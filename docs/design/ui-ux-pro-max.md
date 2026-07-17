---
name: ui-ux-pro-max
description: "UI/UX design intelligence adapted for the AscendantWeb stack (React 19, TanStack Start/Router, Tailwind CSS v4, shadcn/ui, Radix). Use when planning, building, reviewing, fixing, or improving anything that changes how the product looks, feels, moves, or is interacted with — landing pages, dashboards, the chatbot studio, forms, tables, charts, navigation, color systems, typography, spacing, animation, dark mode, and accessibility. Prioritizes premium feel, conversion, plain-English clarity, and reduced-motion-safe polish. Adapted from nextlevelbuilder/ui-ux-pro-max (original targets React Native); this copy is web-first."
---

# UI/UX Pro Max — Design Intelligence (Web-adapted for AscendantWeb)

Design guide for AscendantWeb's public site and product surfaces. This is a web-first
adaptation of the original ui-ux-pro-max skill (which targets React Native). The universal
rules are preserved; stack-specific guidance is rewritten for **React 19 + TanStack Start/
Router + Tailwind CSS v4 + shadcn/ui + Radix**.

For the full searchable database (161 palettes, 57 font pairings, 25 chart types) install the
upstream plugin via `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`.

## Project design goals (AscendantWeb)

Every UI decision serves these:

- **Premium, expensive, trustworthy** — not "generic AI tool." Bold type, strong hierarchy,
  one coherent palette, purposeful motion.
- **Instantly understandable** — plain-English labels, "what happens next" guidance, no jargon.
- **Conversion-first** — instant demo, audit, chatbot, pricing, and contact must be easy to find.
- **Motion that respects `prefers-reduced-motion`** and never makes the site slow.
- **Mobile UX equal to desktop.**
- **Avoid**: generic AI gradients, crowded cards, fake stats, exaggerated claims.

## When to Apply

Use when the task changes how a feature **looks, feels, moves, or is interacted with**:
new pages, component work, color/type/spacing/layout decisions, navigation, animation,
responsive behavior, dark mode, or a UI/UX/accessibility review.

Skip for pure backend logic, API/DB design, infra/DevOps, or non-visual scripts.

## Rule Categories by Priority

Work top-down: fix higher-priority categories first.

| # | Category | Impact | Must have | Avoid |
|---|----------|--------|-----------|-------|
| 1 | Accessibility | CRITICAL | Contrast 4.5:1, alt text, keyboard nav, aria-labels, visible focus | Removing focus rings, icon-only buttons without labels |
| 2 | Interaction | CRITICAL | ≥44×44px targets, ≥8px spacing, loading feedback, `cursor-pointer` | Hover-only actions, 0ms state changes |
| 3 | Performance | HIGH | WebP/AVIF, lazy load, reserved space (CLS < 0.1), route splitting | Layout thrashing, cumulative layout shift |
| 4 | Style selection | HIGH | Match product type, consistency, SVG icons (Lucide) | Emoji as icons, mixing styles randomly |
| 5 | Layout & responsive | HIGH | Mobile-first breakpoints, viewport meta, no horizontal scroll | Fixed px widths, disabling zoom |
| 6 | Typography & color | MEDIUM | 16px base, line-height 1.5, semantic tokens | <12px body, gray-on-gray, raw hex in components |
| 7 | Animation | MEDIUM | 150–300ms, transform/opacity only, respect reduced-motion | Decorative-only motion, animating width/height |
| 8 | Forms & feedback | MEDIUM | Visible labels, error near field, helper text | Placeholder-only labels, errors only at top |
| 9 | Navigation | HIGH | Predictable back, active state, deep-linkable routes | Overloaded nav, broken back behavior |
| 10 | Charts & data | LOW | Legends, tooltips, accessible colors, empty/loading states | Color-only meaning, pie charts >5 categories |

## Quick Reference

### 1. Accessibility (CRITICAL)
- Contrast ≥4.5:1 body text (3:1 large). Verify light AND dark independently.
- Visible focus rings (2–4px) on all interactive elements — never remove them.
- `aria-label` on icon-only buttons; descriptive `alt` on meaningful images.
- Tab order matches visual order; full keyboard support; skip-to-content link.
- Sequential heading hierarchy (one h1, no level skips).
- Never convey meaning by color alone — add icon or text.
- Respect `prefers-reduced-motion`; support browser text zoom without breakage.
- Provide cancel/back/close in every modal and multi-step flow.

### 2. Interaction (CRITICAL)
- Touch/click targets ≥44×44px; extend hit area if the visual is smaller.
- ≥8px gap between targets. `cursor-pointer` on everything clickable.
- Primary interactions on click/tap — never hover-only.
- Disable buttons during async ops; show spinner/progress.
- Errors appear near the problem, stated as cause + fix (not "Invalid input").
- Visual press feedback within ~100ms.

### 3. Performance (HIGH)
- WebP/AVIF, responsive `srcset`, `loading="lazy"` below the fold.
- Always set width/height or `aspect-ratio` to prevent CLS.
- `font-display: swap`; preload only critical fonts.
- Route/feature code-splitting (TanStack lazy routes, `React.lazy`/Suspense).
- Skeleton screens for loads >300ms instead of long blocking spinners.
- Debounce/throttle scroll/resize/input; virtualize lists of 50+ rows.
- Load third-party scripts async/defer; audit and remove unnecessary ones.

### 4. Style Selection (HIGH)
- Match style to product type; keep it consistent across all pages.
- SVG icons only (Lucide, already in the stack) — never emoji as structural icons.
- One icon set, consistent stroke width and sizing tokens.
- Shadows/blur/radius aligned to one chosen style; consistent elevation scale.
- Design light and dark variants together.
- One primary CTA per screen; secondary actions visually subordinate.

### 5. Layout & Responsive (HIGH)
- `width=device-width, initial-scale=1` — never disable zoom.
- Mobile-first; systematic breakpoints (e.g. 375 / 768 / 1024 / 1440).
- ≥16px body on mobile (avoids iOS auto-zoom). No horizontal scroll.
- 4/8px spacing scale. Consistent desktop max-width (`max-w-6xl`/`7xl`).
- Prefer `min-h-dvh` over `100vh` on mobile.
- Defined z-index scale (e.g. 10 / 20 / 40 / 100 / 1000).
- Fixed navbars/footers must reserve safe padding for content beneath.

### 6. Typography & Color (MEDIUM)
- Line-height 1.5–1.75 body; 60–75 chars per line desktop, 35–60 mobile.
- Consistent type scale (12 14 16 18 24 32…); weight reinforces hierarchy (700 headings, 400 body, 500 labels).
- Semantic color tokens (primary, surface, on-surface, error) via Tailwind theme — no raw hex in components.
- Dark mode uses desaturated/lighter tonal variants, not inverted colors.
- Tabular figures for prices, data columns, timers.
- Intentional whitespace to group and separate; avoid clutter.

### 7. Animation (MEDIUM)
- 150–300ms micro-interactions; complex transitions ≤400ms; avoid >500ms.
- Animate `transform`/`opacity` only — never width/height/top/left.
- Every animation conveys cause→effect; animate 1–2 key elements per view.
- ease-out entering, ease-in exiting; exits ~60–70% of enter duration.
- Stagger list reveals 30–50ms/item. Modals animate from their trigger.
- Parallax sparingly; must respect reduced-motion.
- **Gate all non-essential motion behind `prefers-reduced-motion: no-preference`.**

### 8. Forms & Feedback (MEDIUM)
- Visible label per input (not placeholder-only); mark required fields.
- Validate on blur, not per keystroke; show error below the field.
- Semantic input types (`email`, `tel`, `number`) for correct mobile keyboards.
- Loading→success/error state on submit; auto-focus first invalid field.
- Helper text for complex inputs; progressive disclosure — don't overwhelm.
- Confirm destructive actions; offer undo where possible.
- Toasts: `aria-live="polite"`, auto-dismiss 3–5s, don't steal focus (sonner is installed).
- Empty states: helpful message + next action, never a blank panel.

### 9. Navigation (HIGH)
- Current location visually highlighted (color/weight/indicator).
- All key screens deep-linkable via URL (TanStack routes) for sharing.
- Predictable back; preserve scroll and filter state.
- Nav placement consistent across pages; icon + text label.
- ≥1024px prefer sidebar; small screens use top/bottom nav.
- Breadcrumbs for 3+ level hierarchies; separate destructive actions (logout, delete) from normal nav.
- Modals must not be primary navigation.

### 10. Charts & Data (LOW) — recharts is in the stack
- Match chart to data: trend→line, comparison→bar, proportion→pie/donut (≤5 slices).
- Legends visible and near the chart; tooltips on hover/tap with exact values.
- Accessible palettes; never red/green only. Supplement color with pattern/shape.
- Provide a table alternative and a text summary/aria-label for screen readers.
- Empty state ("No data yet" + guidance) and skeleton while loading — not a bare axis.
- Charts reflow/simplify on small screens; entrance animation respects reduced-motion.
- Locale-aware number/date/currency formatting; gridlines low-contrast (gray-200).

## Stack notes (React web)

- **Reduced motion**: the audit found no `prefers-reduced-motion` handling in the repo. Add a
  shared pattern — a `useReducedMotion` hook and/or a global CSS media query that neutralizes
  transitions/animations — and gate reveal/parallax/hover-depth effects behind it.
- **shadcn/ui + Radix**: prefer these primitives (Dialog, Popover, Tabs, Tooltip) — they ship
  focus management, escape routes, and ARIA roles. Don't rebuild interactive controls from divs.
- **Tailwind v4**: keep semantic tokens in the theme layer; reference `bg-primary`,
  `text-on-surface` etc. rather than hardcoding hex per component.
- **Icons**: Lucide (`lucide-react`) is installed — use it, one consistent size/stroke.
- **Motion**: no motion library is installed; CSS transitions + `@keyframes` (already in
  `styles.css`) plus IntersectionObserver for reveals keeps the bundle lean.

## Pre-Delivery Checklist (web)

Visual
- [ ] SVG icons only (Lucide); no emoji as icons; one consistent icon family
- [ ] Semantic theme tokens used; no ad-hoc per-component hex
- [ ] Press/hover states don't shift layout bounds

Interaction & a11y
- [ ] All meaningful images/icons have alt/aria-label
- [ ] Touch/click targets ≥44×44px; visible focus rings intact
- [ ] Form fields have labels, helper text, and errors near the field
- [ ] Color is never the only indicator
- [ ] Keyboard order matches visual order; modals have escape routes

Light/Dark
- [ ] Body text ≥4.5:1 and secondary ≥3:1 in both themes (tested, not inferred)
- [ ] Borders/dividers and interaction states visible in both modes
- [ ] Modal scrim strong enough for legibility (≈40–60% black)

Layout & motion
- [ ] Verified at 375px, 768px, 1024px, 1440px; no horizontal scroll
- [ ] 4/8px spacing rhythm; consistent max-width
- [ ] CLS-safe (dimensions reserved for async content and images)
- [ ] Behavior verified with reduced-motion enabled

Conversion (AscendantWeb)
- [ ] One clear primary CTA per screen
- [ ] Demo / audit / chatbot / pricing / contact are easy to find
- [ ] Copy is plain-English with "what happens next" guidance
