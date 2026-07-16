import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

function tierFromPrice(priceId: string | null | undefined): string | null {
  if (!priceId) return null;
  if (priceId.startsWith("basic")) return "basic";
  if (priceId.startsWith("advanced")) return "advanced";
  if (priceId.startsWith("ascendant")) return "ascendant";
  return null;
}

async function handleSubscriptionUpsert(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId ?? null;
  const item = subscription.items?.data?.[0];
  const priceId =
    item?.price?.lookup_key ||
    item?.price?.metadata?.lovable_external_id ||
    item?.price?.id;
  const productId =
    typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        product_id: productId,
        price_id: priceId,
        status: subscription.status,
        current_period_start: periodStart
          ? new Date(periodStart * 1000).toISOString()
          : null,
        current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  await getSupabase().from("orders").insert({
    user_id: session.metadata?.userId ?? null,
    email: session.customer_details?.email ?? null,
    tier: session.metadata?.tier ?? "unknown",
    stripe_session_id: session.id,
    stripe_payment_intent:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    status: session.payment_status ?? "complete",
    environment: env,
  });
}

// Recurring renewal payments arrive as invoice.paid; record each as an order row.
async function handleInvoicePaid(invoice: any, env: StripeEnv) {
  // Skip the very first invoice — checkout.session.completed already records it
  if (invoice.billing_reason === "subscription_create") return;

  const line = invoice.lines?.data?.[0];
  const priceId = line?.price?.lookup_key || line?.price?.id;
  const tier = tierFromPrice(priceId) ?? "unknown";
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  // Look up user_id via the subscription row so renewals stay attributable
  let userId: string | null = null;
  if (invoice.subscription) {
    const subId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription.id;
    const { data: sub } = await getSupabase()
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subId)
      .maybeSingle();
    userId = (sub?.user_id as string | null) ?? null;
  }

  await getSupabase().from("orders").insert({
    user_id: userId,
    email: invoice.customer_email ?? null,
    tier,
    stripe_session_id: invoice.id,
    stripe_payment_intent:
      typeof invoice.payment_intent === "string"
        ? invoice.payment_intent
        : invoice.payment_intent?.id ?? null,
    amount_cents: invoice.amount_paid ?? 0,
    currency: invoice.currency ?? "usd",
    status: "paid_renewal",
    environment: env,
  });

  // Also update subscription period info from the invoice if present
  if (invoice.subscription && line?.period) {
    const subId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription.id;
    await getSupabase()
      .from("subscriptions")
      .update({
        current_period_start: line.period.start
          ? new Date(line.period.start * 1000).toISOString()
          : null,
        current_period_end: line.period.end
          ? new Date(line.period.end * 1000).toISOString()
          : null,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subId)
      .eq("environment", env);
  }
}

async function handleInvoiceFailed(invoice: any, env: StripeEnv) {
  if (!invoice.subscription) return;
  const subId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription.id;
  await getSupabase()
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subId)
    .eq("environment", env);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "invoice.paid":
    case "invoice.payment_succeeded":
      await handleInvoicePaid(event.data.object, env);
      break;
    case "invoice.payment_failed":
      await handleInvoiceFailed(event.data.object, env);
      break;
    default:
      console.log("Unhandled webhook event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
