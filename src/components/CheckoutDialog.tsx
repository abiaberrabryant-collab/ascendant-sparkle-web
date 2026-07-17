import { useEffect, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Loader2, AlertTriangle } from "lucide-react";
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

export default function CheckoutDialog({ tier, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!tier) {
      setError(null);
      setClientSecret(null);
      return;
    }
    let cancelled = false;
    setError(null);
    setClientSecret(null);
    setLoading(true);
    (async () => {
      try {
        const result = await createTierCheckoutSession({
          data: {
            tier,
            returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
            environment: getStripeEnvironment(),
          },
        });
        if (cancelled) return;
        if ("error" in result) throw new Error(result.error);
        if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
        setClientSecret(result.clientSecret);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tier, attempt]);

  if (!tier) return null;

  const fetchClientSecret = async (): Promise<string> => {
    if (!clientSecret) throw new Error("Checkout not ready");
    return clientSecret;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative mt-10 w-full max-w-2xl rounded-3xl border border-glass-border bg-background p-6 shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-glass-border px-3 py-1 text-xs text-foreground/70 hover:bg-black/5"
        >
          Close
        </button>
        <div className="mb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            // Checkout
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{TIER_LABELS[tier]}</h2>
          <p className="mt-1 text-sm text-foreground/60">
            Setup fee plus first month billed today. Monthly maintenance + AI chatbot renews every
            month. Cancel anytime from your account.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-500">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">Checkout couldn't start</div>
              <div className="mt-1 opacity-90">{error}</div>
              <button
                onClick={() => setAttempt((a) => a + 1)}
                className="mt-2 rounded-md border border-red-400/40 px-3 py-1 text-xs font-semibold hover:bg-red-500/10"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {loading && !error && (
          <div className="flex h-64 items-center justify-center rounded-xl bg-black/[0.03]">
            <div className="flex items-center gap-3 text-sm text-foreground/60">
              <Loader2 className="size-4 animate-spin" />
              Preparing secure checkout…
            </div>
          </div>
        )}

        {clientSecret && !error && (
          <div id="checkout" className="overflow-hidden rounded-xl bg-white p-2 animate-fade-in">
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </div>
    </div>
  );
}
