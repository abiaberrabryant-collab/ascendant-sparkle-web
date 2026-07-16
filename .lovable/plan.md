# Plan: Make AscendantWeb a real, functioning business

Current state: marketing site + working Stripe embedded checkout on the happy path only. No sign-in UI, no account page, no admin panel, contact/audit forms are fakes, and the webhook silently drops subscriptions for guest checkouts and ignores renewals and payment failures.

This plan closes every gap.

## What gets built

### 1. Authentication (new, user-facing)
- Add `/auth` route with Google sign-in + email/password sign-up and sign-in.
- Add `/auth/reset-password` for password reset (required by our stack).
- Add a session provider in `__root.tsx` that tracks the current user, listens for `SIGNED_IN` / `SIGNED_OUT` / `USER_UPDATED`, and exposes a `useAuth()` hook.
- Header nav shows **Sign In** when signed out, and **My Account / Sign Out** when signed in.
- Google is already configured on the backend; the sign-in button uses the Lovable-managed Google flow so no extra setup is needed.

### 2. Checkout gated behind sign-in
- Clicking a tier's CTA now requires being signed in.
- If signed out → redirect to `/auth?next=/checkout/<tier>`, then bounce back into checkout after login.
- If signed in → open the embedded checkout with `userId` + verified email already populated (no more asking the user for name/email in a form).
- Checkout session gets `managed_payments: { enabled: true }` so Stripe handles tax calculation, collection, filing, remittance, fraud, disputes, and transaction support (+3.5% per transaction). Buyer statements will read `LINK.COM* ASCENDANTWEB`.

### 3. `/account` — customer dashboard (new)
- Behind auth (`_authenticated` layout).
- Shows current tier, subscription status (`active` / `past_due` / `canceled`), next renewal date, one-time build fee receipt, invoice history.
- **Manage billing** button → opens the Stripe Customer Portal in a new tab where the customer can update card, download invoices, cancel their subscription, and see billing history. Stripe hosts this — we don't rebuild it.

### 4. `/admin` — owner dashboard (new)
- Behind auth + `has_role(user_id, 'admin')` gate. Only `abiaberrabryant@gmail.com` sees it (auto-granted admin on email verification by existing trigger).
- **Orders table**: date, customer email, tier, amount, status, Stripe session link, environment (test/live). Filter by tier and status.
- **Subscriptions table**: customer email, tier, status, next renewal date, cancel-at-period-end flag, MRR contribution.
- Admin link only appears in the nav for admins.

### 5. Contact & Audit forms wired to the database
- Contact form on the homepage now inserts into the existing `contact_inquiries` table (name, email, budget, message, source='contact').
- Free-audit form inserts into the same table with source='audit' plus the URL and additional details, instead of the fake `setTimeout`.
- Both work anonymously (existing RLS already allows public inserts).
- Admin panel gets a third tab: **Inquiries** — table of all leads with mark-as-contacted / archive controls. *(Note: this is a small scope extension beyond "orders & subscriptions only" — I'll build the write path either way since forms are broken, and add the admin view since the table exists. If you don't want admin visibility into leads, just say so and I'll drop the third tab.)*

### 6. Webhook hardening
- Fix the anonymous-checkout bug by requiring auth (already done in step 2) AND making the DB column `subscriptions.user_id` nullable as a belt-and-suspenders safety net.
- Add missing event handlers:
  - `invoice.paid` → append a new row to `orders` for each monthly renewal so revenue is auditable month-over-month.
  - `invoice.payment_failed` → mark subscription `past_due` and log for admin visibility.
  - `checkout.session.expired` → no-op but logged (kills the "unknown event" noise).
  - `charge.refunded` → mark the matching order refunded.
- Populate `orders.stripe_payment_intent` from the session so refunds are traceable.
- `checkout.return` page verifies the session against Stripe server-side before showing "Payment complete."

### 7. Test-mode banner + return polish
- Existing `PaymentTestModeBanner` is only shown inside the pricing section; move it to the top of the app while in test mode so every page carries the "test payments" warning.

## Files touched (technical)

New:
- `src/routes/auth.tsx`, `src/routes/auth.reset-password.tsx`, `src/routes/auth.callback.tsx`
- `src/routes/_authenticated/route.tsx`, `src/routes/_authenticated/account.tsx`
- `src/routes/_authenticated/admin.tsx` (with tabs: Orders, Subscriptions, Inquiries)
- `src/hooks/useAuth.tsx` + provider in `__root.tsx`
- `src/utils/account.functions.ts` (portal session, my-subscription, my-orders — all `requireSupabaseAuth`)
- `src/utils/admin.functions.ts` (list-all-orders, list-all-subscriptions, list-inquiries — `requireSupabaseAuth` + has_role check, uses `supabaseAdmin` after verification)
- `src/utils/contact.functions.ts` (public inserts into `contact_inquiries`)

Modified:
- `src/routes/index.tsx` — pricing CTAs require auth; contact & audit forms call server fns; nav gets Sign In / My Account / Admin links.
- `src/components/CheckoutDialog.tsx` — drop the name/email form; use session user directly.
- `src/utils/payments.functions.ts` — add `managed_payments`, add `createPortalSession`.
- `src/routes/api/public/payments/webhook.ts` — new event handlers, populate payment_intent.
- `src/routes/checkout.return.tsx` — server-verify session before rendering success.

Migration:
- `ALTER TABLE public.subscriptions ALTER COLUMN user_id DROP NOT NULL;` (safety net)
- Add `contact_inquiries.status` column (`new` | `contacted` | `archived`) + admin-only UPDATE policy.
- Add `orders.stripe_payment_intent` write path (column already exists).

## How to test in preview

Preview always runs in Stripe **test mode** (client token starts with `pk_test_`), so no real cards are charged. The "test payments" banner will be visible at the top of every page.

**End-to-end customer flow:**
1. Open the preview → click **Sign In** in the nav → sign up with any email (e.g. `test+1@example.com`) and a password. If email confirmation is enabled you'll get a confirmation link; otherwise you're signed in immediately.
2. Go to Pricing → click **Choose Advanced** → embedded Stripe checkout appears.
3. Fill in card: **`4242 4242 4242 4242`**, any future expiry (e.g. `12/34`), any 3-digit CVC, any ZIP. Submit.
4. Land on `/checkout/return` — should say "Payment complete" only if the server confirms the session succeeded.
5. Go to **My Account** — verify Advanced tier shows as active, $1,750 build fee logged, next renewal date visible.
6. Click **Manage billing** → Stripe Customer Portal opens in a new tab. Cancel the subscription from there. Back in the app, refresh — status flips to canceled.
7. **Test failure card**: `4000 0000 0000 0002` (generic decline) or `4000 0000 0000 9995` (insufficient funds) to see the failure UI in checkout.

**Contact / audit forms:**
1. Submit the contact form and the free-audit form from the homepage.
2. Sign in as `abiaberrabryant@gmail.com` → go to `/admin` → **Inquiries** tab → both submissions should appear immediately.

**Admin panel:**
1. Sign in as `abiaberrabryant@gmail.com` (this email is auto-granted admin by the existing DB trigger the first time it verifies).
2. Go to `/admin` → **Orders** and **Subscriptions** tabs show every purchase made across all test users.
3. Sign in as any other test email → `/admin` link is hidden and direct navigation to `/admin` redirects home.

**Webhook / renewal test (optional, more advanced):**
- In the Stripe test dashboard, advance the subscription's clock or use "Send test webhook" for `invoice.paid` → a new row appears in Orders for that month.
- Send a test `invoice.payment_failed` → subscription status flips to `past_due` and shows a banner in **My Account**.

Ready to build?
