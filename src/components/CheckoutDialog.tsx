import { useEffect, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createTierCheckoutSession } from "@/utils/payments.functions";

type Tier = "basic" | "advanced" | "ascendant";

const TIER_LABELS: Record<Tier, string> = {
  basic: "Basic — $1,250 setup + $150/mo",
  advanced: "Advanced — $1,750 setup + $200/mo",
  ascendant: "Ascendant — $2,000 setup + $250/mo",
};

interface Props {
  tier: Tier | null;
  onClose: () => void;
}

export function CheckoutDialog({ tier, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (tier) {
      setError(null);
      setKey((k) => k + 1);
    }
  }, [tier]);

  if (!tier) return null;

  const fetchClientSecret = async (): Promise<string> => {
    const result = await createTierCheckoutSession({
      data: {
        tier,
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
    return result.clientSecret;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur">
      <div className="relative mt-10 w-full max-w-2xl rounded-3xl border border-glass-border bg-background p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-glass-border px-3 py-1 text-xs text-foreground/70 hover:bg-white/5"
        >
          Close
        </button>
        <div className="mb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            // Checkout
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{TIER_LABELS[tier]}</h2>
          <p className="mt-1 text-sm text-foreground/60">
            One-time build fee charged today. Monthly maintenance + AI chatbot starts immediately
            and renews every month. Stripe handles tax and receipts automatically.
          </p>
        </div>

        {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

        <div id="checkout" key={key} className="overflow-hidden rounded-xl bg-white p-2">
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}
