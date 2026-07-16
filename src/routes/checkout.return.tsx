import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { verifyCheckoutSession } from "@/utils/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment complete — AscendantWeb" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id: sessionId } = Route.useSearch();
  const { user, isLoading } = useAuth();
  const [verified, setVerified] = useState<null | { ok: boolean; message: string }>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!sessionId || !user) {
      setVerified({ ok: false, message: "No session information found." });
      return;
    }
    verifyCheckoutSession({ data: { sessionId: sessionId!, environment: getStripeEnvironment() } })
      .then((res: any) => {
        if (res?.error) {
          setVerified({ ok: false, message: String(res.error) });
        } else if (res?.status === "complete" && res?.payment_status !== "unpaid") {
          setVerified({ ok: true, message: "" });
        } else {
          setVerified({
            ok: false,
            message: `Checkout status: ${res?.status} / ${res?.payment_status}`,
          });
        }
      })
      .catch((e) => setVerified({ ok: false, message: e instanceof Error ? e.message : String(e) }));
  }, [sessionId, user, isLoading]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-lg rounded-3xl border border-glass-border bg-glass p-10 text-center">
        {!verified ? (
          <div className="text-foreground/60">Verifying payment…</div>
        ) : verified.ok ? (
          <>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/20">
              <Check className="size-7 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Payment complete</h1>
            <p className="mt-3 text-foreground/60">
              Thank you — your monthly maintenance plan is active and our team will reach out
              within 24 hours to kick off your build.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/account"
                className="rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/40"
              >
                Go to my account
              </Link>
              <Link
                to="/"
                className="rounded-xl border border-glass-border px-6 py-3 font-bold hover:bg-white/5"
              >
                Back to home
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-500/20">
              <AlertCircle className="size-7 text-amber-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Something's off</h1>
            <p className="mt-3 text-foreground/60">{verified.message}</p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 font-bold text-white"
            >
              Back to home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
