import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — AscendantWeb" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase puts type=recovery in the hash after email link click
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setMessage("If an account exists, we've sent a reset link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Password updated. You can now sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-glass-border bg-glass p-8">
        <Link to="/auth" className="mb-6 block font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          ← Back to sign in
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {mode === "update" ? "Set new password" : "Reset password"}
        </h1>
        <form onSubmit={mode === "update" ? handleUpdate : handleRequest} className="mt-6 space-y-4">
          {mode === "request" ? (
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
              required
            />
          ) : (
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
              required
            />
          )}
          {error && <div className="text-sm text-red-400">{error}</div>}
          {message && <div className="text-sm text-primary">{message}</div>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/40 disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "update" ? "Update password" : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
