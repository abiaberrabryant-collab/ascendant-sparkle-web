import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment complete — AscendantWeb" },
      { name: "description", content: "Your order has been received." },
    ],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id: sessionId } = Route.useSearch();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-lg rounded-3xl border border-glass-border bg-glass p-10 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/20">
          <Check className="size-7 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Payment complete</h1>
        <p className="mt-3 text-foreground/60">
          Thank you — we've received your order and your monthly maintenance plan is now active.
          You'll get an email confirmation shortly, and our team will reach out within 24 hours
          to kick off your build.
        </p>
        {sessionId && (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-foreground/40">
            Ref: {sessionId.slice(0, 24)}…
          </p>
        )}
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/40"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
