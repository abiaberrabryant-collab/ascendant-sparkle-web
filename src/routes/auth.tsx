import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { next?: string } => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — AscendantWeb" },
      { name: "description", content: "Sign in to manage your AscendantWeb account, subscription, and billing." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate({ to: next || "/account", replace: true });
    }
  }, [isLoading, user, navigate, next]);

  // Same-origin relative next path (e.g. `/.lovable/oauth/consent?authorization_id=...`).
  // Used to bring the user back to an OAuth consent flow after sign-in/signup.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  const returnUrl = safeNext
    ? `${window.location.origin}${safeNext}`
    : window.location.origin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: returnUrl,
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: returnUrl,
    });
    if (result.error) {
      setError(result.error.message ?? "Google sign-in failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-glass-border bg-glass p-8">
        <Link to="/" className="mb-6 block font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {mode === "signup" ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          {mode === "signup"
            ? "You'll use this to check out and manage your website plan."
            : "Sign in to continue to checkout or view your account."}
        </p>

        <button
          onClick={handleGoogle}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-glass-border bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41.4 35.8 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-glass-border" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">or</span>
          <div className="h-px flex-1 bg-glass-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-xs font-mono uppercase tracking-widest text-foreground/60">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
                required
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-mono uppercase tracking-widest text-foreground/60">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono uppercase tracking-widest text-foreground/60">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
              required
            />
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/40 hover:shadow-primary/60 disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex justify-between text-sm">
          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-foreground/60 hover:text-foreground"
          >
            {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
          {mode === "signin" && (
            <Link to="/auth/reset-password" className="text-foreground/60 hover:text-foreground">
              Forgot password?
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
