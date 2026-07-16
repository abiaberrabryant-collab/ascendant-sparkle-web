import { useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createTierCheckoutSession } from "@/utils/payments.functions";
import { supabase } from "@/integrations/supabase/client";

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
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!tier) return null;

  const fetchClientSecret = async (): Promise<string> => {
    const { data: authData } = await supabase.auth.getUser();
    const result = await createTierCheckoutSession({
      data: {
        tier,
        customerEmail: email,
        customerName: name,
        userId: authData.user?.id,
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
    return result.clientSecret;
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !name) {
      setError("Name and email are required.");
      return;
    }
    setLoading(true);
    try {
      setStarted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
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
            One-time build fee is charged today. Monthly maintenance + AI chatbot start immediately and recur every month.
          </p>
        </div>

        {!started ? (
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-mono uppercase tracking-widest text-foreground/60">
                Full name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-mono uppercase tracking-widest text-foreground/60">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
                required
              />
            </div>
            {error && <div className="text-sm text-red-400">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/40 hover:shadow-primary/60 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Continue to payment"}
            </button>
          </form>
        ) : (
          <div id="checkout" className="rounded-xl bg-white p-2">
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </div>
    </div>
  );
}
