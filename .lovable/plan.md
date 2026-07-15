# Plan: Polish + Industry Showcase

## 1. Hide "Edit with Lovable" badge
- Call `publish_settings--set_badge_visibility` with `hide_badge: true` (requires Pro; if it fails I'll surface that to you).

## 2. Remove sections from `src/routes/index.tsx`
- Delete the **Before/After preview slider** component and its section on the home page (plus unused `before-site.jpg` / `after-site.jpg` imports).
- Delete the **Case studies coming soon** placeholder section entirely (not just empty state — remove the whole block and its nav link if any).

## 3. Replace with "Industry Model Sites" section
New section titled something like **"Built for your industry"** with 5 model site concepts, each as a HUD-style card (icon, industry name, tagline, key features list, "Preview this style" CTA that scrolls to contact / opens audit form). The 5 industries:

1. **Electrical Contractors** — emergency call CTA, service areas, licensing badges, quote form
2. **Plumbing & HVAC** — booking widget, service menu, before/after gallery, reviews
3. **Law Firms** — practice areas, attorney bios, case intake form, trust-forward typography
4. **Restaurants & Cafés** — menu, reservations, gallery, location/hours
5. **Real Estate Agents** — listings grid, agent profile, lead capture, neighborhood guides

Each card uses the existing design tokens (aurora/glass/scanline style), no new images needed — icon + gradient background. Generated AI-preview images optional; skipping to keep it fast unless you want mockups.

## 4. Soften improvement claims
Sweep `src/routes/index.tsx` for any numeric performance/conversion stats (e.g. "3x faster", "+40% conversions", "98 Lighthouse", audit score numbers, animated hero counters) and replace with ambiguous language like "dramatically faster", "meaningful lift in conversions", "top-tier performance scores", "significant improvement". The audit tool's numeric score output → replaced with qualitative rating ("Needs work" / "Solid" / "Excellent").

## Technical notes
- Only `src/routes/index.tsx` edited for content changes; badge toggled via publish settings tool.
- No new routes, no backend changes.
- Keep all existing sections (hero, services, pricing, testimonials placeholder, FAQ, contact) intact.

Want me to also generate mockup images for the 5 industry cards, or keep them icon-only for speed?
