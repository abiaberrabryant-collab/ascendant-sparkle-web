import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMyBilling, createPortalSession } from "@/utils/account.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { AccountSkeleton } from "@/components/Skeleton";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [{ title: "My account — AscendantWeb" }, { name: "robots", content: "noindex" }],
  }),
  component: AccountPage,
});

type Billing = Awaited<ReturnType<typeof getMyBilling>>;

const TIER_LABEL: Record<string, string> = {
  basic: "Basic",
  advanced: "Advanced",
  ascendant: "Ascendant",
};

function tierFromPrice(priceId: string | null | undefined): string {
  if (!priceId) return "—";
  if (priceId.startsWith("basic")) return TIER_LABEL.basic;
  if (priceId.startsWith("advanced")) return TIER_LABEL.advanced;
  if (priceId.startsWith("ascendant")) return TIER_LABEL.ascendant;
  return priceId;
}

function AccountPage() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalBusy, setPortalBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyBilling({ data: { environment: getStripeEnvironment() } })
      .then((res) => setBilling(res))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const openPortal = async () => {
    setPortalBusy(true);
    setError(null);
    try {
      const res = await createPortalSession({
        data: {
          returnUrl: `${window.location.origin}/account`,
          environment: getStripeEnvironment(),
        },
      });
      if ("error" in res) throw new Error(res.error);
      window.open(res.url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPortalBusy(false);
    }
  };

  const currentSub = billing?.subscriptions?.[0];

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            ← Home
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin" className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold hover:bg-white/5">
                Admin
              </Link>
            )}
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight">My Account</h1>
        <p className="mt-2 text-foreground/60">{user?.email}</p>
        <Link to="/dashboard" className="mt-5 mr-3 inline-flex rounded-xl border border-glass-border px-5 py-3 font-bold hover:bg-white/5">
          Owner dashboard
        </Link>
        <Link to="/chatbot" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-lg shadow-primary/30">
          Open Chatbot Studio
        </Link>

        {loading ? (
          <AccountSkeleton />
        ) : (
          <>
            <div className="mt-10 rounded-3xl border border-glass-border bg-glass p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                // Current plan
              </div>
              {currentSub ? (
                <>
                  <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4">
                    <div>
                      <div className="text-3xl font-extrabold tracking-tight">
                        {tierFromPrice(currentSub.price_id)}
                      </div>
                      <div className="mt-1 text-sm text-foreground/60">
                        Status:{" "}
                        <span
                          className={
                            currentSub.status === "active" || currentSub.status === "trialing"
                              ? "font-semibold text-primary"
                              : currentSub.status === "past_due"
                              ? "font-semibold text-amber-400"
                              : "font-semibold text-foreground/70"
                          }
                        >
                          {currentSub.status}
                        </span>
                        {currentSub.cancel_at_period_end && " (cancels at period end)"}
                      </div>
                      {currentSub.current_period_end && (
                        <div className="mt-1 text-sm text-foreground/60">
                          Next renewal:{" "}
                          {new Date(currentSub.current_period_end).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={openPortal}
                      disabled={portalBusy}
                      className="rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-lg shadow-primary/30 disabled:opacity-50"
                    >
                      {portalBusy ? "Opening…" : "Manage billing"}
                    </button>
                  </div>
                  {currentSub.status === "past_due" && (
                    <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                      Your last payment failed. Update your card in "Manage billing" to avoid interruption.
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-3">
                  <p className="text-foreground/60">
                    You don't have an active plan yet.
                  </p>
                  <Link
                    to="/"
                    hash="pricing"
                    className="mt-4 inline-flex rounded-xl bg-primary px-5 py-3 font-bold text-white"
                  >
                    View plans
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-8 rounded-3xl border border-glass-border bg-glass p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                // Payment history
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-glass-border text-left text-foreground/60">
                      <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-widest">Date</th>
                      <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-widest">Tier</th>
                      <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-widest">Amount</th>
                      <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(billing?.orders ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-foreground/50">
                          No payments yet.
                        </td>
                      </tr>
                    ) : (
                      (billing?.orders ?? []).map((o: any) => (
                        <tr key={o.id} className="border-b border-glass-border/60">
                          <td className="py-3 pr-4">{new Date(o.created_at).toLocaleDateString()}</td>
                          <td className="py-3 pr-4 capitalize">{o.tier}</td>
                          <td className="py-3 pr-4">
                            ${(o.amount_cents / 100).toFixed(2)} {o.currency?.toUpperCase()}
                          </td>
                          <td className="py-3 pr-4">{o.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {error && <div className="mt-6 text-sm text-red-400">{error}</div>}
      </div>
    </div>
  );
}
