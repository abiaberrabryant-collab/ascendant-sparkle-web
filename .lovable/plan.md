
## Goal

Make this app connectable from ChatGPT Codex (and other MCP clients) as a custom MCP server at `https://ascendantweb.org/mcp`, protected with OAuth so each caller signs in as a real user of the app and RLS runs as that user.

## What gets built

1. **Install** `@lovable.dev/mcp-js` + `zod`, and add both to the supply-chain allow-list in `bunfig.toml`.

2. **Activate managed OAuth 2.1** on the backend via `supabase--configure_oauth_server` (dynamic client registration on, standard consent path).

3. **Consent route** at `src/routes/[.]lovable.oauth.consent.tsx`:
   - Reads `authorization_id`, checks session, redirects unauthenticated users to `/auth` with `next=` preserving the full consent URL.
   - Calls `supabase.auth.oauth.getAuthorizationDetails / approveAuthorization / denyAuthorization`.
   - Shows a simple "Connect <client> to AscendantWeb" screen with Approve / Deny.

4. **Auth route `next=` handling**: update the existing sign-in path so password login, signup `emailRedirectTo`, and Google `signInWithOAuth` all return the user to the preserved consent URL (not `/`).

5. **MCP server entry** `src/lib/mcp/index.ts` with `defineMcp` + `auth.oauth.issuer({ issuer: https://<ref>.supabase.co/auth/v1, acceptedAudiences: "authenticated" })`, issuer built from `VITE_SUPABASE_PROJECT_ID`.

6. **Tools** under `src/lib/mcp/tools/` — all run as the signed-in user via a per-request Supabase client that forwards `ctx.getToken()`:
   - `list_conversations` (read) — chatbot conversations visible to the user under RLS
   - `get_conversation` (read) — messages for one conversation
   - `list_leads` (read) — captured leads
   - `get_chatbot_settings` (read) — current settings + knowledge base
   - `update_chatbot_settings` (write, admin-only via `has_role`) — greeting, suggested prompts, brand color, knowledge base text, enabled flag
   - `list_orders` (read, admin-only) — Stripe orders
   - `list_subscriptions` (read, admin-only) — subscription rows

   Admin-only tools check `has_role(user, 'admin')` through the user-scoped client before doing anything; no `supabaseAdmin` inside MCP handlers.

7. **Vite plugin**: add `mcpPlugin()` from `@lovable.dev/mcp-js/stacks/tanstack/vite` to `vite.config.ts` (plugin generates `/mcp` and `/.well-known/oauth-protected-resource`).

8. **Favicon**: only if none exists — a small AscendantWeb mark so Codex's connector list shows a proper icon.

9. **Validate**: run manifest extraction after the tools are on disk.

## How you connect it in Codex

After this ships, in ChatGPT → Settings → Connectors → Add custom MCP server:

- URL: `https://ascendantweb.org/mcp`
- Codex triggers OAuth → opens `/auth` → you sign in with Google → consent screen → approved → tokens issued → tools appear.

## Not touched

Chat widget, checkout, admin UI internals, database schema, RLS, `/api/public/chat` endpoint, Stripe wiring. Only additive files + the auth route's `next=` handling.

## Notes

- Public site, so `/mcp` is directly reachable; no `/api/public/` prefix needed.
- Every tool acts as the caller under RLS. Admin gating is a runtime `has_role` check, not an audience check.
- Tokens are never returned or logged; the MCP server only validates them.
