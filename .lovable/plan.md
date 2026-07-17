## Performance & polish — first release

Six focused changes. Ship them in this order; each is independently deployable.

### 1. Lazy-load checkout and chat widget on the home page
- Convert `CheckoutDialog` import in `src/routes/index.tsx` to `React.lazy` + `Suspense`. Only mount it once a plan is clicked (already gated behind `selectedPlan` state, but the code still ships in the initial JS chunk).
- Same treatment for `ChatWidget`: swap the static import for `React.lazy`, render inside `<Suspense fallback={null}>`, and only mount after the launcher button is clicked (keep the small launcher button eager so users see it).
- Expected win: removes Stripe SDK + `react-markdown` + streaming/AI-chat code from the initial home-page bundle.

### 2. Defer chatbot settings fetch until first interaction
- `ChatWidget` currently calls `get_public_chatbot_settings` on mount. Move that query into the "open chat" handler and cache it with TanStack Query (`staleTime: Infinity`, keyed `['chatbot-settings']`) so it only runs once per visit and only if the visitor opens chat.
- If the widget is disabled, the fetch should never run.

### 3. Convert homepage hero/section images to WebP with responsive sizes
- Audit the 7 JPEGs referenced in `src/routes/index.tsx` (~1.3–1.5 MB total).
- Add `vite-imagetools` (already documented in the stack) and import each image with `?format=webp&w=640;1024;1600&as=picture` to generate a `<picture>` with WebP + JPEG fallback and a proper `srcset`/`sizes`.
- Add `loading="lazy"` and `decoding="async"` to every below-the-fold image; keep the LCP hero eager and add a `head().links` `rel="preload"` entry on the index route for its WebP.
- Target: each image ≤ ~200 KB at 1x.

### 4. Reduce animated blur on mobile + respect reduced motion
- The homepage renders two ~900px blurred gradient blobs plus glass/blur cards that repaint every frame.
- Gate the animated blob classes behind `md:` (desktop only) and wrap in a `@media (prefers-reduced-motion: reduce)` override that disables the animation.
- Swap heavy `backdrop-blur-*` utilities on mobile for a plain semi-transparent background.

### 5. Slim the account + admin queries and add indexes
- `src/routes/account.tsx`: replace `select('*')` on `subscriptions` and `orders` with an explicit column list (only fields actually rendered). Limit `orders` to the last 10 with `.order('created_at', desc).limit(10)`; add a "Show all" button that fetches the rest on demand.
- Admin lists: replace the `.limit(500)` with cursor pagination (page size 25).
- Migration: add btree indexes on `subscriptions(user_id, environment, created_at desc)`, `orders(user_id, created_at desc)`, and any admin sort columns used in the queries above. (I will double-check the exact queries before writing the migration.)

### 6. Loading skeletons + minimal perf monitoring
- Add skeleton components for the account page (subscription card, order list) and Chatbot Studio (settings form, conversations list), rendered via `pendingComponent` on each route.
- Add a tiny Web Vitals reporter: `web-vitals` package, sends `CLS/LCP/INP/TTFB` to a new `POST /api/public/perf` route that logs to a `perf_metrics` table (user_id nullable, route, metric, value, created_at). No PII. This gives measurable data before/after each release.

### What I will NOT do in this pass
- No visual redesign of the home page CTA/spacing/typography — flagged for a follow-up "polish" pass so this release stays focused on speed.
- No favicon/meta rework unless the audit finds they're actually missing (I'll check during step 3 and fold it in if trivial).
- No Stripe or auth logic changes.

### Order of operations
1. Steps 1 + 2 together (pure frontend, biggest LCP/TBT win, no schema).
2. Publish → re-run PageSpeed → record numbers.
3. Step 3 (images).
4. Publish → re-check.
5. Step 4 (mobile blur).
6. Steps 5 + 6 (DB + monitoring; requires one migration for indexes and one for `perf_metrics`).
7. Final publish + PageSpeed run.

### Technical notes
- `React.lazy` requires the target module to have a `default` export; `CheckoutDialog` and `ChatWidget` currently use named exports — I'll add thin `default` re-export shims (`export { CheckoutDialog as default }`) rather than changing every import site.
- `vite-imagetools` runs at build time and works with the current Vite 7 setup; no runtime cost.
- Indexes will be added via `supabase--migration` (requires your approval before running).
- Web Vitals endpoint goes under `/api/public/perf` with a lightweight rate check; no signature needed since it's non-sensitive telemetry, but I'll cap payload size and validate with Zod.

Approve and I'll start with steps 1 + 2.