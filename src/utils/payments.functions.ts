import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";
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

export const createTierCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      tier: Tier;
      customerEmail?: string;
      customerName?: string;
      userId?: string;
      returnUrl: string;
      environment: StripeEnv;
    }) => {
      if (!TIER_CONFIG[data.tier]) throw new Error("Invalid tier");
      return data;
    },
  )
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const config = TIER_CONFIG[data.tier];

      const [monthlyPrice, setupPrice] = await Promise.all([
        resolveLookupPrice(stripe, config.monthly),
        resolveLookupPrice(stripe, config.setup),
      ]);

      const customerId =
        data.customerEmail || data.userId
          ? await resolveOrCreateCustomer(stripe, {
              email: data.customerEmail,
              userId: data.userId,
            })
          : undefined;

      if (customerId && data.customerName) {
        await stripe.customers.update(customerId, { name: data.customerName });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        line_items: [{ price: monthlyPrice.id, quantity: 1 }],
        subscription_data: {
          description: `${config.name} — includes one-time build fee + monthly maintenance & AI chatbot`,
          metadata: {
            tier: data.tier,
            ...(data.userId && { userId: data.userId }),
          },
          add_invoice_items: [{ price: setupPrice.id, quantity: 1 }],
        },
        ...(customerId && { customer: customerId }),
        metadata: {
          tier: data.tier,
          ...(data.userId && { userId: data.userId }),
        },
      } as Stripe.Checkout.SessionCreateParams);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
