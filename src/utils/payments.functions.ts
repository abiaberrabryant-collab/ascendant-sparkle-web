import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type Tier = "basic" | "advanced" | "ascendant";

const TIER_CONFIG: Record<Tier, { setup: string; monthly: string; name: string }> = {
  basic: { setup: "basic_setup", monthly: "basic_monthly", name: "Basic Website + Maintenance" },
  advanced: { setup: "advanced_setup", monthly: "advanced_monthly", name: "Advanced Website + Maintenance" },
  ascendant: { setup: "ascendant_setup", monthly: "ascendant_monthly", name: "Ascendant Website + Maintenance" },
};

type CheckoutSessionResult = { clientSecret: string } | { error: string };

function safeReturnUrl(value: string, expectedOrigin?: string) {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Invalid return URL");
  if (expectedOrigin && url.origin !== expectedOrigin) throw new Error("Return URL must stay on this site");
  return url.toString();
}

async function resolveOrCreateCustomer(
  stripe: Stripe,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

async function resolveLookupPrice(stripe: Stripe, lookupKey: string): Promise<Stripe.Price> {
  const prices = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (!prices.data.length) throw new Error(`Price not found: ${lookupKey}`);
  return prices.data[0];
}

// Signed-in-only checkout. Uses the session user's id + verified email.
export const createTierCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { tier: Tier; returnUrl: string; environment: StripeEnv }) => {
      if (!TIER_CONFIG[data.tier]) throw new Error("Invalid tier");
      if (data.environment !== "sandbox" && data.environment !== "live") throw new Error("Invalid payment environment");
      safeReturnUrl(data.returnUrl);
      return data;
    },
  )
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const { supabase, userId } = context;
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;
      const fullName =
        (userData.user?.user_metadata as any)?.full_name ??
        (userData.user?.user_metadata as any)?.name;

      const stripe = createStripeClient(data.environment);
      const config = TIER_CONFIG[data.tier];

      const [monthlyPrice, setupPrice] = await Promise.all([
        resolveLookupPrice(stripe, config.monthly),
        resolveLookupPrice(stripe, config.setup),
      ]);

      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });
      if (fullName) {
        await stripe.customers.update(customerId, { name: fullName });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: safeReturnUrl(data.returnUrl, new URL(getRequest().url).origin),
        customer: customerId,
        line_items: [
          { price: monthlyPrice.id, quantity: 1 },
          { price: setupPrice.id, quantity: 1 },
        ],
        subscription_data: {
          description: `${config.name} — one-time build fee + monthly maintenance & AI chatbot`,
          metadata: { tier: data.tier, userId },
        },
        metadata: { tier: data.tier, userId },
        managed_payments: { enabled: true },
      } as Stripe.Checkout.SessionCreateParams);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

// Verify a session server-side so the return page can trust the result.
export const verifyCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string; environment: StripeEnv }) => {
    if (!/^cs_[a-zA-Z0-9_]+$/.test(data.sessionId)) throw new Error("Invalid sessionId");
    if (data.environment !== "sandbox" && data.environment !== "live") throw new Error("Invalid payment environment");
    return data;
  })
  .handler(async ({ data, context }) => {
    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      const sessionUserId = session.metadata?.userId;
      let ownsCustomer = false;
      if (!sessionUserId || sessionUserId !== context.userId) {
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (customerId) {
          const { data: subscriptions } = await context.supabase
            .from("subscriptions")
            .select("stripe_customer_id")
            .eq("user_id", context.userId)
            .eq("environment", data.environment)
            .limit(10);
          ownsCustomer = (subscriptions ?? []).some((subscription: { stripe_customer_id: string }) => subscription.stripe_customer_id === customerId);
        }
      }
      if (sessionUserId !== context.userId && !ownsCustomer) return { error: "Checkout session not found" };
      return {
        status: session.status,
        payment_status: session.payment_status,
        customer_email: session.customer_details?.email ?? null,
        amount_total: session.amount_total,
        currency: session.currency,
      };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
