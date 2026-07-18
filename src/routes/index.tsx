import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Search,
  Bot,
  Layout,
  Wrench,
  Rocket,
  Shield,
  Smartphone,
  Users,
  Check,
  ChevronDown,
  Loader2,
  Radar,
  Workflow,
  Gauge,
} from "lucide-react";
import beforeSite from "@/assets/before-site.webp";
import afterSite from "@/assets/after-site.webp";
import industryElectrical from "@/assets/industry-electrical.webp";
import industryPlumbing from "@/assets/industry-plumbing.webp";
import industryLaw from "@/assets/industry-law.webp";
import industryRestaurant from "@/assets/industry-restaurant.webp";
import industryRealEstate from "@/assets/industry-realestate.webp";
import { useAuth } from "@/hooks/useAuth";
import { submitInquiry } from "@/utils/contact.functions";
import { ChatWidget } from "@/components/ChatWidget";

const CheckoutDialog = lazy(() => import("@/components/CheckoutDialog"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AscendantWeb — Websites that convert visitors into customers" },
      {
        name: "description",
        content:
          "AscendantWeb designs and builds fast, modern websites for growing businesses — with real design, SEO, and an AI chatbot included.",
      },
    ],
  }),
  component: HomePage,
});

/* ---------------- Shared UI ---------------- */

/** Shared cloud gradient + fractal-noise filters. Rendered once; every cloud
 *  references these by id. The turbulence displacement is what makes the
 *  smooth puff silhouette read as a real, wispy cloud. */
function SkyDefs() {
  const filters = [
    { id: "cloudA", seed: 4, freq: "0.012 0.019", scale: 58 },
    { id: "cloudB", seed: 17, freq: "0.011 0.021", scale: 52 },
    { id: "cloudC", seed: 29, freq: "0.013 0.017", scale: 66 },
  ];

  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="cloudFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="52%" stopColor="#f5f8fe" />
          <stop offset="100%" stopColor="#d6e1f0" />
        </linearGradient>
        {filters.map((f) => (
          <filter key={f.id} id={f.id} x="-35%" y="-35%" width="170%" height="170%">
            <feTurbulence type="fractalNoise" baseFrequency={f.freq} numOctaves={4} seed={f.seed} stitchTiles="stitch" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={f.scale} xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation={1} />
          </filter>
        ))}
      </defs>
    </svg>
  );
}

/** A realistic cloud: a puff cluster warped by fractal noise, softly shaded,
 *  with a clean symmetric shadow beneath. */
function Cloud({ w, opacity = 1, filterId }: { w: number; opacity?: number; filterId: string }) {
  const h = (w * 160) / 260;
  return (
    <div style={{ position: "relative", width: w, height: h, opacity }}>
      <div
        style={{
          position: "absolute",
          left: "16%",
          right: "16%",
          bottom: "8%",
          height: Math.max(10, h * 0.13),
          borderRadius: "50%",
          background: "radial-gradient(50% 50% at 50% 50%, oklch(0.5 0.06 262 / 0.2), transparent 72%)",
          filter: "blur(7px)",
        }}
      />
      <svg
        viewBox="0 0 260 160"
        width={w}
        height={h}
        aria-hidden="true"
        style={{ position: "relative", display: "block", overflow: "visible" }}
      >
        <g fill="url(#cloudFill)" filter={`url(#${filterId})`}>
          <ellipse cx="130" cy="118" rx="112" ry="32" />
          <circle cx="130" cy="82" r="52" />
          <circle cx="76" cy="102" r="42" />
          <circle cx="42" cy="116" r="30" />
          <circle cx="188" cy="100" r="46" />
          <circle cx="222" cy="116" r="30" />
          <circle cx="102" cy="66" r="34" />
          <circle cx="160" cy="60" r="38" />
        </g>
      </svg>
    </div>
  );
}

/** Rolling hills that form the ground at the very bottom of the page. */
function Ground() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[46vh] min-h-[340px]">
      {/* horizon haze so the sky melts softly into the land */}
      <div
        className="absolute inset-x-0 top-0 h-44"
        style={{ background: "linear-gradient(180deg, oklch(0.97 0.02 250 / 0.95), transparent)" }}
      />
      <svg viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="hillBack" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dcecc9" />
            <stop offset="100%" stopColor="#cbe2b3" />
          </linearGradient>
          <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c1dda1" />
            <stop offset="100%" stopColor="#a8cf84" />
          </linearGradient>
          <linearGradient id="hillFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9fca75" />
            <stop offset="100%" stopColor="#82b659" />
          </linearGradient>
        </defs>
        <path d="M0 214 C 240 154, 430 188, 720 204 S 1210 252, 1440 194 L1440 400 L0 400 Z" fill="url(#hillBack)" />
        <path d="M0 286 C 300 236, 560 306, 850 284 S 1265 262, 1440 304 L1440 400 L0 400 Z" fill="url(#hillMid)" />
        <path d="M0 344 C 260 306, 620 364, 960 344 S 1305 334, 1440 352 L1440 400 L0 400 Z" fill="url(#hillFront)" />
      </svg>
    </div>
  );
}

// Edge-biased: larger, opaque clouds hug the left/right margins so they stay
// clear of the centered text column; small, hazy clouds fill the middle.
// Each bobs up and down (amp) on its own timing so the sky feels alive.
// `f` picks one of the shared noise filters so no two clouds look identical.
const skyClouds = [
  { top: "2%", left: "-7%", w: 320, op: 0.96, dur: "9s", delay: "0s", amp: "-30px", f: "cloudA" },
  { top: "4%", left: "70%", w: 360, op: 0.96, dur: "11s", delay: "-2s", amp: "-34px", f: "cloudB" },
  { top: "8%", left: "24%", w: 150, op: 0.5, dur: "8s", delay: "-3s", amp: "-22px", f: "cloudC" },
  { top: "11%", left: "48%", w: 130, op: 0.4, dur: "7s", delay: "-1s", amp: "-18px", f: "cloudA" },
  { top: "14%", left: "88%", w: 230, op: 0.85, dur: "12s", delay: "-5s", amp: "-28px", f: "cloudC" },
  { top: "18%", left: "-5%", w: 270, op: 0.9, dur: "10s", delay: "-4s", amp: "-30px", f: "cloudB" },
  { top: "23%", left: "62%", w: 160, op: 0.5, dur: "8s", delay: "-2s", amp: "-20px", f: "cloudA" },
  { top: "28%", left: "82%", w: 290, op: 0.88, dur: "13s", delay: "-6s", amp: "-32px", f: "cloudB" },
  { top: "32%", left: "-8%", w: 300, op: 0.9, dur: "11s", delay: "-3s", amp: "-30px", f: "cloudC" },
  { top: "36%", left: "34%", w: 130, op: 0.42, dur: "7s", delay: "-1s", amp: "-18px", f: "cloudA" },
  { top: "40%", left: "70%", w: 180, op: 0.6, dur: "9s", delay: "-5s", amp: "-24px", f: "cloudC" },
  { top: "45%", left: "89%", w: 250, op: 0.85, dur: "12s", delay: "-2s", amp: "-30px", f: "cloudA" },
  { top: "49%", left: "-6%", w: 290, op: 0.88, dur: "10s", delay: "-6s", amp: "-28px", f: "cloudB" },
  { top: "53%", left: "48%", w: 140, op: 0.44, dur: "8s", delay: "-3s", amp: "-20px", f: "cloudC" },
  { top: "57%", left: "78%", w: 270, op: 0.86, dur: "13s", delay: "-4s", amp: "-32px", f: "cloudA" },
  { top: "61%", left: "-7%", w: 300, op: 0.9, dur: "11s", delay: "-1s", amp: "-30px", f: "cloudB" },
  { top: "65%", left: "30%", w: 150, op: 0.48, dur: "9s", delay: "-5s", amp: "-22px", f: "cloudC" },
  { top: "69%", left: "84%", w: 250, op: 0.85, dur: "12s", delay: "-2s", amp: "-30px", f: "cloudB" },
  { top: "73%", left: "-5%", w: 290, op: 0.88, dur: "10s", delay: "-6s", amp: "-28px", f: "cloudA" },
  { top: "77%", left: "56%", w: 170, op: 0.5, dur: "8s", delay: "-3s", amp: "-22px", f: "cloudC" },
  { top: "81%", left: "80%", w: 280, op: 0.88, dur: "13s", delay: "-4s", amp: "-32px", f: "cloudA" },
  { top: "85%", left: "4%", w: 290, op: 0.9, dur: "11s", delay: "-1s", amp: "-30px", f: "cloudB" },
  { top: "89%", left: "40%", w: 150, op: 0.48, dur: "9s", delay: "-5s", amp: "-22px", f: "cloudC" },
  { top: "92%", left: "84%", w: 230, op: 0.82, dur: "12s", delay: "-2s", amp: "-28px", f: "cloudB" },
  { top: "95%", left: "16%", w: 250, op: 0.82, dur: "10s", delay: "-4s", amp: "-26px", f: "cloudA" },
  { top: "97%", left: "62%", w: 220, op: 0.8, dur: "11s", delay: "-3s", amp: "-24px", f: "cloudC" },
];

function SkyBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Vertical sky: soft blue up high → airy middle → warm horizon near the ground */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #b9d4f2 0%, #cbe0f6 13%, #dfebf8 32%, #edf3fb 52%, #f4f1eb 74%, #f7efe2 87%, #edf1e2 100%)",
        }}
      />
      {/* Sun glow */}
      <div
=======
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="cloudFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="52%" stopColor="#f5f8fe" />
          <stop offset="100%" stopColor="#d6e1f0" />
        </linearGradient>
        {filters.map((f) => (
          <filter key={f.id} id={f.id} x="-35%" y="-35%" width="170%" height="170%">
            <feTurbulence type="fractalNoise" baseFrequency={f.freq} numOctaves={4} seed={f.seed} stitchTiles="stitch" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={f.scale} xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation={1} />
          </filter>
        ))}
      </defs>
    </svg>
  );
}

/** A realistic cloud: a puff cluster warped by fractal noise, softly shaded,
 *  with a clean symmetric shadow beneath. */
function Cloud({ w, opacity = 1, filterId }: { w: number; opacity?: number; filterId: string }) {
  const h = (w * 160) / 260;
  return (
    <div style={{ position: "relative", width: w, height: h, opacity }}>
      <div
        style={{
          position: "absolute",
          left: "16%",
          right: "16%",
          bottom: "8%",
          height: Math.max(10, h * 0.13),
          borderRadius: "50%",
          background: "radial-gradient(50% 50% at 50% 50%, oklch(0.5 0.06 262 / 0.2), transparent 72%)",
          filter: "blur(7px)",
        }}
      />
      <svg
        viewBox="0 0 260 160"
        width={w}
        height={h}
        aria-hidden="true"
        style={{ position: "relative", display: "block", overflow: "visible" }}
      >
        <g fill="url(#cloudFill)" filter={`url(#${filterId})`}>
          <ellipse cx="130" cy="118" rx="112" ry="32" />
          <circle cx="130" cy="82" r="52" />
          <circle cx="76" cy="102" r="42" />
          <circle cx="42" cy="116" r="30" />
          <circle cx="188" cy="100" r="46" />
          <circle cx="222" cy="116" r="30" />
          <circle cx="102" cy="66" r="34" />
          <circle cx="160" cy="60" r="38" />
        </g>
      </svg>
    </div>
  );
}

/** Rolling hills that form the ground at the very bottom of the page. */
function Ground() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[46vh] min-h-[340px]">
      {/* horizon haze so the sky melts softly into the land */}
      <div
        className="absolute inset-x-0 top-0 h-44"
        style={{ background: "linear-gradient(180deg, oklch(0.97 0.02 250 / 0.95), transparent)" }}
      />
      <svg viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="hillBack" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dcecc9" />
            <stop offset="100%" stopColor="#cbe2b3" />
          </linearGradient>
          <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c1dda1" />
            <stop offset="100%" stopColor="#a8cf84" />
          </linearGradient>
          <linearGradient id="hillFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9fca75" />
            <stop offset="100%" stopColor="#82b659" />
          </linearGradient>
        </defs>
        <path d="M0 214 C 240 154, 430 188, 720 204 S 1210 252, 1440 194 L1440 400 L0 400 Z" fill="url(#hillBack)" />
        <path d="M0 286 C 300 236, 560 306, 850 284 S 1265 262, 1440 304 L1440 400 L0 400 Z" fill="url(#hillMid)" />
        <path d="M0 344 C 260 306, 620 364, 960 344 S 1305 334, 1440 352 L1440 400 L0 400 Z" fill="url(#hillFront)" />
      </svg>
    </div>
  );
}

// Edge-biased: larger, opaque clouds hug the left/right margins so they stay
// clear of the centered text column; small, hazy clouds fill the middle.
// Each bobs up and down (amp) on its own timing so the sky feels alive.
// `f` picks one of the shared noise filters so no two clouds look identical.
const skyClouds = [
  { top: "2%", left: "-7%", w: 320, op: 0.96, dur: "9s", delay: "0s", amp: "-30px", f: "cloudA" },
  { top: "4%", left: "70%", w: 360, op: 0.96, dur: "11s", delay: "-2s", amp: "-34px", f: "cloudB" },
  { top: "8%", left: "24%", w: 150, op: 0.5, dur: "8s", delay: "-3s", amp: "-22px", f: "cloudC" },
  { top: "11%", left: "48%", w: 130, op: 0.4, dur: "7s", delay: "-1s", amp: "-18px", f: "cloudA" },
  { top: "14%", left: "88%", w: 230, op: 0.85, dur: "12s", delay: "-5s", amp: "-28px", f: "cloudC" },
  { top: "18%", left: "-5%", w: 270, op: 0.9, dur: "10s", delay: "-4s", amp: "-30px", f: "cloudB" },
  { top: "23%", left: "62%", w: 160, op: 0.5, dur: "8s", delay: "-2s", amp: "-20px", f: "cloudA" },
  { top: "28%", left: "82%", w: 290, op: 0.88, dur: "13s", delay: "-6s", amp: "-32px", f: "cloudB" },
  { top: "32%", left: "-8%", w: 300, op: 0.9, dur: "11s", delay: "-3s", amp: "-30px", f: "cloudC" },
  { top: "36%", left: "34%", w: 130, op: 0.42, dur: "7s", delay: "-1s", amp: "-18px", f: "cloudA" },
  { top: "40%", left: "70%", w: 180, op: 0.6, dur: "9s", delay: "-5s", amp: "-24px", f: "cloudC" },
  { top: "45%", left: "89%", w: 250, op: 0.85, dur: "12s", delay: "-2s", amp: "-30px", f: "cloudA" },
  { top: "49%", left: "-6%", w: 290, op: 0.88, dur: "10s", delay: "-6s", amp: "-28px", f: "cloudB" },
  { top: "53%", left: "48%", w: 140, op: 0.44, dur: "8s", delay: "-3s", amp: "-20px", f: "cloudC" },
  { top: "57%", left: "78%", w: 270, op: 0.86, dur: "13s", delay: "-4s", amp: "-32px", f: "cloudA" },
  { top: "61%", left: "-7%", w: 300, op: 0.9, dur: "11s", delay: "-1s", amp: "-30px", f: "cloudB" },
  { top: "65%", left: "30%", w: 150, op: 0.48, dur: "9s", delay: "-5s", amp: "-22px", f: "cloudC" },
  { top: "69%", left: "84%", w: 250, op: 0.85, dur: "12s", delay: "-2s", amp: "-30px", f: "cloudB" },
  { top: "73%", left: "-5%", w: 290, op: 0.88, dur: "10s", delay: "-6s", amp: "-28px", f: "cloudA" },
  { top: "77%", left: "56%", w: 170, op: 0.5, dur: "8s", delay: "-3s", amp: "-22px", f: "cloudC" },
  { top: "81%", left: "80%", w: 280, op: 0.88, dur: "13s", delay: "-4s", amp: "-32px", f: "cloudA" },
  { top: "85%", left: "4%", w: 290, op: 0.9, dur: "11s", delay: "-1s", amp: "-30px", f: "cloudB" },
  { top: "89%", left: "40%", w: 150, op: 0.48, dur: "9s", delay: "-5s", amp: "-22px", f: "cloudC" },
  { top: "92%", left: "84%", w: 230, op: 0.82, dur: "12s", delay: "-2s", amp: "-28px", f: "cloudB" },
  { top: "95%", left: "16%", w: 250, op: 0.82, dur: "10s", delay: "-4s", amp: "-26px", f: "cloudA" },
  { top: "97%", left: "62%", w: 220, op: 0.8, dur: "11s", delay: "-3s", amp: "-24px", f: "cloudC" },
];

function SkyBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Vertical sky: soft blue up high → airy middle → warm horizon near the ground */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #b9d4f2 0%, #cbe0f6 13%, #dfebf8 32%, #edf3fb 52%, #f4f1eb 74%, #f7efe2 87%, #edf1e2 100%)",
        }}
      />
      {/* Sun glow */}
      <div

        className="absolute rounded-full"
        style={{
          top: "-5%",
          left: "63%",
          width: 460,
          height: 460,
          background: "radial-gradient(circle, oklch(1 0.04 95 / 0.95), oklch(1 0.05 90 / 0) 62%)",
        }}
      />

      <SkyDefs />
      {skyClouds.map((c, i) => (
        <div
          key={`cloud-${i}`}
          className="absolute"
          style={{
            top: c.top,
            left: c.left,
            ["--amp" as never]: c.amp,
            animation: `cloud-drift ${c.dur} ease-in-out ${c.delay} infinite`,
          }}
        >
          <Cloud w={c.w} opacity={c.op} filterId={c.f} />
        </div>
      ))}

      <Ground />
    </div>
  );
}

/** Scroll-reveal wrapper. Uses CSS transitions, so reduced-motion (handled
 *  globally in styles.css) resolves it instantly. Falls back to visible when
 *  IntersectionObserver is unavailable. */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children, tone = "primary" }: { children: React.ReactNode; tone?: "primary" | "secondary" }) {
  return (
    <span className={`eyebrow ${tone === "secondary" ? "eyebrow--secondary" : ""}`}>
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-70 motion-safe:animate-ping" />
        <span className="relative inline-flex size-1.5 rounded-full bg-current" />
      </span>
      {children}
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/45">{children}</span>;
}

function SectionHead({
  eyebrow,
  tone = "primary",
  title,
  sub,
  center = false,
}: {
  eyebrow: string;
  tone?: "primary" | "secondary";
  title: React.ReactNode;
  sub?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <Reveal className={`mb-14 max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-tight md:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg leading-relaxed text-foreground/60">{sub}</p>}
    </Reveal>
  );
}

/* ---------------- Nav ---------------- */

function Nav() {
  const { user, isAdmin } = useAuth();
  const links = [
    { href: "#services", label: "Services" },
    { href: "#industries", label: "Industries" },
    { href: "#pricing", label: "Pricing" },
    { href: "#audit", label: "Audit" },
    { href: "#contact", label: "Contact" },
  ];
  return (
    <nav className="sticky top-0 z-50 border-b border-glass-border bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-tr from-primary to-secondary font-bold text-white shadow-lg shadow-primary/30">
            A
          </div>
          <span className="text-lg font-bold tracking-tight">AscendantWeb</span>
        </a>
        <div className="hidden items-center gap-8 text-sm font-medium text-foreground/60 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
          <Link to="/demo" className="font-semibold text-primary transition-colors hover:text-secondary">
            Instant demo
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden rounded-lg border border-glass-border px-3 py-2 text-sm font-semibold hover:bg-black/5 md:inline-flex"
                >
                  Admin
                </Link>
              )}
              <Link
                to="/account"
                className="rounded-full bg-foreground px-5 py-2 text-sm font-bold text-background transition-transform hover:scale-105"
              >
                My account
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-full border border-foreground/20 px-5 py-2 text-sm font-bold text-foreground transition-colors hover:bg-foreground/5"
              >
                Sign in
              </Link>

              <a href="#audit" className="rounded-full bg-foreground px-5 py-2 text-sm font-bold text-background transition-transform hover:scale-105">

              <a
                href="#audit"
                className="rounded-full bg-foreground px-5 py-2 text-sm font-bold text-background transition-transform hover:scale-105"
              >

                Free audit
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      id="top"
      ref={heroRef}
      className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28"
      style={{
        background:
          "radial-gradient(620px circle at var(--mx,50%) var(--my,40%), oklch(0.62 0.19 258 / 0.09), transparent 60%)",
      }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="animate-fade-up">
          <Eyebrow>Booking Q1 · a few spots left</Eyebrow>
        </div>

        <h1 className="mt-7 max-w-5xl animate-fade-up text-balance text-5xl font-extrabold leading-[1.03] tracking-tighter md:text-7xl lg:text-[5.5rem]">
          Your website should <span className="text-gradient">pull its weight</span>.
        </h1>
        <p className="mt-6 max-w-2xl animate-fade-up text-pretty text-lg text-foreground/60 md:text-xl" style={{ animationDelay: "80ms" }}>
          We design and build websites that turn visitors into paying customers — real design, fast
          pages, and an AI chatbot that actually helps.
        </p>

        <div
          className="mt-10 flex w-full animate-fade-up flex-col justify-center gap-4 sm:flex-row"
          style={{ animationDelay: "150ms" }}
        >
          <a href="#audit" className="btn-primary group px-8 py-4">
            Grab a free audit
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
          <Link to="/demo" className="btn-ghost px-8 py-4">
            See your new site
          </Link>
        </div>

        <div className="mt-6 flex animate-fade-up flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground/45" style={{ animationDelay: "220ms" }}>
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-4 text-primary" /> No obligation
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-4 text-primary" /> Reply within 24 hours
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-4 text-primary" /> Built for local businesses
          </span>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Industry Marquee ---------------- */

function IndustryMarquee() {
  const words = [
    "Plumbers",
    "Law firms",
    "Restaurants",
    "Electricians",
    "Real estate",
    "HVAC",
    "Clinics",
    "Contractors",
    "Agencies",
    "Retail",
  ];
  const row = [...words, ...words];
  return (
    <div className="relative overflow-hidden border-y border-glass-border bg-black/[0.015] py-4">
      <div className="flex w-max gap-8 whitespace-nowrap motion-safe:animate-marquee">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-8 text-sm font-medium text-foreground/40">
            <span>{w}</span>
            <span className="text-primary/40">◆</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

/* ---------------- Proof band (honest) ---------------- */

const proofItems = [
  { icon: Rocket, value: "1–2 wk", label: "From kickoff to launch" },
  { icon: Gauge, value: "99.99%", label: "Managed hosting uptime" },
  { icon: Bot, value: "24/7", label: "AI chatbot answering" },
  { icon: Shield, value: "WCAG AA", label: "Accessible by default" },
];

function ProofBand() {
  return (
    <section className="border-b border-glass-border bg-black/[0.02] py-14">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 md:grid-cols-4">
        {proofItems.map(({ icon: Icon, value, label }, i) => (
          <Reveal key={label} delay={i * 80} className="flex items-center gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/[0.08] text-primary">
              <Icon className="size-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight tabular-nums">{value}</div>
              <div className="text-xs text-foreground/55">{label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Industries ---------------- */

const industries = [
  {
    code: "01",
    icon: Zap,
    image: industryElectrical,
    name: "Electrical Contractors",
    tagline: "Turn emergency calls into booked jobs.",
    features: ["One-tap call button up top", "Service area + license badges", "Quick quote form", "Real reviews front and center"],
  },
  {
    code: "02",
    icon: Wrench,
    image: industryPlumbing,
    name: "Plumbing & HVAC",
    tagline: "Built around getting people to book.",
    features: ["Online booking widget", "Clear service menu with prices", "Before/after job gallery", "SMS-friendly contact flow"],
  },
  {
    code: "03",
    icon: Shield,
    image: industryLaw,
    name: "Law Firms",
    tagline: "Looks the part on the first scroll.",
    features: ["One page per practice area", "Attorney bios + credentials", "Private case intake form", "Clean, serious typography"],
  },
  {
    code: "04",
    icon: Sparkles,
    image: industryRestaurant,
    name: "Restaurants & Cafés",
    tagline: "Photos that put people in seats.",
    features: ["Menu + weekly specials", "Reservation integration", "Hours, map, and directions", "Photo gallery + press"],
  },
  {
    code: "05",
    icon: Layout,
    image: industryRealEstate,
    name: "Real Estate Agents",
    tagline: "Listings that look as good as the homes.",
    features: ["Live listings grid", "Agent + brokerage profile", "Lead form on every listing", "Neighborhood pages for SEO"],
  },
];

/* ---------------- Before / After Slider ---------------- */

function BeforeAfter() {
  const [pos, setPos] = useState(52);
  const dragging = useRef(false);
  const wrap = useRef<HTMLDivElement | null>(null);

  const setFromClientX = (clientX: number) => {
    const el = wrap.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(4, Math.min(96, p)));
  };

  useEffect(() => {
    const onUp = () => (dragging.current = false);
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const x = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      setFromClientX(x);
    };
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove);
    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
    };
  }, []);

  const criteria = [
    { label: "Page speed", before: "Slow", after: "Quick" },
    { label: "Design quality", before: "Outdated", after: "Premium 2026" },
    { label: "Mobile experience", before: "Broken", after: "Pixel-perfect" },
    { label: "SEO health", before: "Weak", after: "Fully optimized" },
    { label: "AI chatbot", before: "None", after: "Built-in chatbot" },
    { label: "Conversion design", before: "Passive", after: "High-intent" },
    { label: "Accessibility", before: "Failing", after: "WCAG AA" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-28 md:py-32">
      <SectionHead
        eyebrow="Before / After"
        title="Drag the slider. See the difference."
        sub="A slow, dated site quietly loses customers every day. We rebuild it end to end — not just a fresh coat of paint."
      />

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <Reveal
          className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-3xl border border-glass-border bg-neutral-100 shadow-[var(--shadow-card)]"
        >
          <div
            ref={wrap}
            className="absolute inset-0"
            onMouseDown={(e) => {
              dragging.current = true;
              setFromClientX(e.clientX);
            }}
            onTouchStart={(e) => {
              dragging.current = true;
              setFromClientX(e.touches[0].clientX);
            }}
          >
            <img
              src={afterSite}
              alt="Modern AscendantWeb redesign"
              width={1200}
              height={1200}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pos}%` }}>
              <img
                src={beforeSite}
                alt="Outdated legacy website"
                width={1200}
                height={1200}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full object-cover"
                style={{ width: `${(100 / pos) * 100}%` }}
              />
            </div>

            <div className="pointer-events-none absolute left-4 top-4 rounded-md bg-white/75 px-2.5 py-1 backdrop-blur">
              <Label>Before</Label>
            </div>
            <div className="pointer-events-none absolute right-4 top-4 rounded-md bg-primary px-2.5 py-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">After</span>
            </div>

            <div
              className="absolute inset-y-0 z-10 w-px bg-primary shadow-[0_0_20px_oklch(0.62_0.19_258_/_0.7)]"
              style={{ left: `${pos}%` }}
            >
              <div className="absolute top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-background bg-primary shadow-2xl">
                <ArrowRight className="size-4 -rotate-180 text-white" />
                <ArrowRight className="absolute size-4 translate-x-3 text-white" />
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-3">
          {criteria.map((c, i) => (
            <Reveal key={c.label} delay={i * 50}>
              <div className="card-premium p-4">
                <Label>{c.label}</Label>
                <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                  <span className="text-foreground/40 line-through">{c.before}</span>
                  <ArrowRight className="size-3 text-foreground/40" />
                  <span className="font-semibold text-primary">{c.after}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Industries ---------------- */

function Industries() {
  return (
    <section id="industries" className="mx-auto max-w-7xl px-6 py-28 md:py-32">
      <SectionHead
        eyebrow="Industries"
        title="Templates tuned to how your customers actually buy."
        sub="Every industry sells differently. We start from a proven blueprint — then shape it around your brand."
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {industries.map((i, idx) => {
          const Icon = i.icon;
          return (
            <Reveal key={i.name} delay={(idx % 3) * 80}>
              <div className="card-premium card-hover group flex h-full flex-col overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden border-b border-glass-border bg-neutral-100">
                  <img
                    src={i.image}
                    alt={`${i.name} website design mockup`}
                    width={1280}
                    height={960}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 rounded-md border border-glass-border bg-background/80 px-2 py-1 backdrop-blur">
                    <Label>{i.code}</Label>
                  </div>
                  <div className="absolute right-3 top-3 grid size-9 place-items-center rounded-lg border border-primary/30 bg-primary/20 text-primary backdrop-blur">
                    <Icon className="size-4" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-bold">{i.name}</h3>
                  <p className="mt-1 text-sm text-foreground/60">{i.tagline}</p>
                  <ul className="mt-5 flex-1 space-y-2">
                    {i.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#contact"
                    className="mt-6 inline-flex items-center justify-between rounded-xl border border-glass-border px-4 py-2.5 text-sm font-bold transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
                  >
                    Build this style
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </Reveal>
          );
        })}
        <Reveal delay={160}>
          <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-[1.25rem] border border-dashed border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
            <Eyebrow>Not listed?</Eyebrow>
            <h3 className="mt-4 text-xl font-bold">Your industry, your rules.</h3>
            <p className="mt-2 text-sm text-foreground/70">
              Retail, healthcare, fitness, agencies — we tailor a blueprint to any niche.
            </p>
            <a href="#contact" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              Talk to us <ArrowRight className="size-4" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Why Choose Us ---------------- */

const whyItems = [
  { icon: Layout, title: "Modern design", desc: "Clean, current design that feels good to use." },
  { icon: Smartphone, title: "Mobile responsive", desc: "Looks right on phones, tablets, and desktops." },
  { icon: Zap, title: "Fast pages", desc: "Loads quickly, feels snappy — how it should." },
  { icon: Search, title: "SEO optimization", desc: "Technical and on-page SEO handled from day one." },
  { icon: Bot, title: "AI chatbot", desc: "Answers questions, qualifies leads, books calls." },
  { icon: Users, title: "Lead capture", desc: "Forms and pages built to actually convert." },
  { icon: Shield, title: "Managed hosting", desc: "SSL, CDN, backups, and boring reliability." },
  { icon: Wrench, title: "Ongoing upkeep", desc: "Updates and monitoring you never have to think about." },
];

function WhyUs() {
  return (
    <section className="border-y border-glass-border bg-black/[0.02] py-28 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead eyebrow="Why AscendantWeb" tone="secondary" title="The essentials, done properly." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyItems.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={(i % 4) * 70}>
              <div className="card-premium card-hover group relative h-full overflow-hidden p-6">
                <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-1 text-sm text-foreground/60">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Services ---------------- */

const services = [
  {
    id: "custom",
    icon: Layout,
    title: "Custom Website Development",
    tagline: "Custom sites built from scratch.",
    bullets: ["Custom design", "Editable CMS", "Fast by default", "SEO fundamentals"],
  },
  {
    id: "redesign",
    icon: Rocket,
    title: "Website Redesign",
    tagline: "Take an old site and make it earn its keep.",
    bullets: ["UX audit + strategy", "Modern rebuild", "Content migration", "Zero downtime launch"],
  },
  {
    id: "ai",
    icon: Bot,
    title: "AI Chatbots",
    tagline: "A chatbot that actually knows your business.",
    bullets: ["FAQ + support", "Lead qualification", "Booking + CRM sync", "Quote generation"],
  },
  {
    id: "seo",
    icon: Search,
    title: "SEO & Performance",
    tagline: "Rank higher. Load faster. Convert more.",
    bullets: ["Technical SEO", "On-page optimization", "Core Web Vitals tuning", "Schema markup"],
  },
];

function Services() {
  const [open, setOpen] = useState<string | null>("ai");
  return (
    <section id="services" className="mx-auto max-w-7xl px-6 py-28 md:py-32">
      <SectionHead eyebrow="Services" title="Four things we do — really well." />
      <div className="grid gap-5 md:grid-cols-2">
        {services.map((s, idx) => {
          const isOpen = open === s.id;
          const Icon = s.icon;
          return (
            <Reveal key={s.id} delay={(idx % 2) * 80}>
              <button
                onClick={() => setOpen(isOpen ? null : s.id)}
                aria-expanded={isOpen}
                className={`group relative w-full overflow-hidden rounded-[1.25rem] border p-6 text-left transition-all ${
                  isOpen
                    ? "border-primary/40 bg-gradient-to-b from-primary/10 to-transparent shadow-[var(--shadow-card)]"
                    : "card-premium hover:border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{s.title}</h3>
                      <p className="text-sm text-foreground/60">{s.tagline}</p>
                    </div>
                  </div>
                  <ChevronDown className={`size-5 text-foreground/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
                <div className={`grid overflow-hidden transition-all duration-500 ${isOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="min-h-0">
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {s.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-foreground/80">
                          <Check className="size-4 text-primary" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Product System ---------------- */

const systemSteps = [
  { icon: Layout, number: "01", title: "Your conversion-ready website", text: "The public-facing home for your brand: fast pages, clear services, trust builders, and simple next steps." },
  { icon: Bot, number: "02", title: "Your trained website assistant", text: "A chatbot answers common questions, captures callback requests, and routes real opportunities to your dashboard." },
  { icon: Workflow, number: "03", title: "Your owner command center", text: "Manage business details, review conversations, and keep every customer follow-up organized in one place." },
  { icon: Radar, number: "04", title: "Your opportunity research", text: "Signal Studio watches public buyer-intent feeds and makes review-only drafts — never automatic spam." },
];

function Systems() {
  return (
    <section className="relative overflow-hidden border-y border-glass-border bg-black/[0.02] py-28 md:py-32">
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHead
          center
          eyebrow="Your business system, explained"
          tone="secondary"
          title="More than a website. A clearer way to grow."
          sub="Every part has one job, connects cleanly to the next, and stays under your control. No mystery automations. No confusing dashboards."
        />
        <div className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {systemSteps.map(({ icon: Icon, number, title, text }, index) => (
            <Reveal key={title} delay={index * 90}>
              <div className="card-premium card-hover group relative h-full p-6">
                <div className="flex items-center justify-between">
                  <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground/35">{number}</span>
                </div>
                <h3 className="mt-6 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground/60">{text}</p>
                {index < systemSteps.length - 1 && (
                  <ArrowRight className="absolute -right-7 top-1/2 z-10 hidden size-5 text-primary/50 lg:block" />
                )}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10">
          <div className="flex flex-col items-center justify-between gap-5 rounded-[1.25rem] border border-primary/20 bg-primary/5 p-6 text-center sm:flex-row sm:text-left">
            <div>
              <div className="font-semibold">Want to see this applied to your business?</div>
              <p className="mt-1 text-sm text-foreground/60">Paste your website and get an instant polished concept before you commit.</p>
            </div>
            <Link to="/demo" className="btn-primary shrink-0 px-5 py-3 text-sm">
              Create my demo <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Pricing ---------------- */

type Tier = {
  id: string;
  code: string;
  name: string;
  price: string;
  cadence?: string;
  desc: string;
  features: string[];
  cta: string;
  popular?: boolean;
};

const websiteTiers: Tier[] = [
  {
    id: "basic",
    code: "01 / Basic",
    name: "Basic",
    price: "$1,250",
    cadence: "one-time + $150/mo",
    desc: "A clean, fast site for getting online properly.",
    features: [
      "Up to 5 pages",
      "Fully mobile responsive",
      "Modern custom design",
      "Contact form + email delivery",
      "Basic on-page SEO",
      "Analytics + SSL",
      "$150/mo maintenance + basic AI chatbot",
      "Live in 1–2 weeks",
    ],
    cta: "Start with Basic",
  },
  {
    id: "advanced",
    code: "02 / Advanced",
    name: "Advanced",
    price: "$1,750",
    cadence: "one-time + $200/mo",
    desc: "For growing businesses that need more room and more features.",
    features: [
      "Everything in Basic",
      "Up to 12 pages",
      "Advanced custom design system",
      "Blog + editable CMS",
      "Booking or lead-capture flow",
      "CRM / email integration",
      "Advanced SEO + speed tuning",
      "$200/mo maintenance + AI chatbot (business-trained)",
      "Live in 2–3 weeks",
    ],
    cta: "Choose Advanced",
    popular: true,
  },
  {
    id: "ascendant",
    code: "03 / Ascendant",
    name: "Ascendant",
    price: "$2,000",
    cadence: "one-time + $250/mo",
    desc: "Our top build. Everything on the table, nothing held back.",
    features: [
      "Everything in Advanced",
      "Unlimited pages",
      "Premium bespoke design + animations",
      "Custom features & dashboards",
      "Advanced integrations & automations",
      "Premium SEO + schema markup",
      "$250/mo maintenance + full AI chatbot with priority support",
      "Live in 3–4 weeks",
    ],
    cta: "Go Ascendant",
  },
];

function PricingCard({ tier, onSelect }: { tier: Tier; onSelect: (id: string) => void }) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-3xl border p-8 transition-all ${
        tier.popular
          ? "border-primary/40 bg-gradient-to-b from-primary/10 to-transparent shadow-[var(--shadow-card-hover)] md:-translate-y-2"
          : "card-premium card-hover"
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">Most popular</span>
        </div>
      )}
      <Label>{tier.code}</Label>
      <div className="mt-4 flex items-baseline gap-2">
        <div className="text-4xl font-extrabold tracking-tight">{tier.price}</div>
        {tier.cadence && <div className="text-sm text-foreground/40">{tier.cadence}</div>}
      </div>
      <p className="mt-3 text-sm text-foreground/60">{tier.desc}</p>
      <ul className="mt-6 flex-1 space-y-3">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="text-foreground/80">{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => onSelect(tier.id)}
        className={`mt-8 inline-flex items-center justify-center rounded-xl px-6 py-3 font-bold transition-all ${
          tier.popular
            ? "btn-primary w-full"
            : "border border-glass-border hover:border-primary/30 hover:bg-primary/[0.04]"
        }`}
      >
        {tier.cta}
      </button>
    </div>
  );
}

function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<"basic" | "advanced" | "ascendant" | null>(null);

  const handleSelect = (id: string) => {
    const tier = id as "basic" | "advanced" | "ascendant";
    if (!user) {
      navigate({ to: "/auth", search: { next: "/#pricing" } });
      return;
    }
    setSelectedTier(tier);
  };

  return (
    <section id="pricing" className="border-y border-glass-border bg-black/[0.02] py-28 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          center
          eyebrow="Pricing"
          title="Simple pricing. No games."
          sub={
            <>
              One checkout. Setup fee plus your first month today, then the maintenance and chatbot
              subscription renews every month. {!user && "You'll need to sign in first."}
            </>
          }
        />
        <div className="grid items-start gap-8 md:grid-cols-3">
          {websiteTiers.map((t, i) => (
            <Reveal key={t.id} delay={i * 90}>
              <PricingCard tier={t} onSelect={handleSelect} />
            </Reveal>
          ))}
        </div>
      </div>
      {selectedTier && (
        <Suspense fallback={null}>
          <CheckoutDialog tier={selectedTier} onClose={() => setSelectedTier(null)} />
        </Suspense>
      )}
    </section>
  );
}

/* ---------------- Testimonials ---------------- */

function Testimonials() {
  return (
    <section className="border-b border-glass-border bg-black/[0.02] py-28 md:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <div className="flex justify-center">
            <Eyebrow tone="secondary">Reviews</Eyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl">Reviews coming soon.</h2>
          <p className="mt-4 text-lg text-foreground/60">
            We're just getting started. Real client stories will land here as our first sites go live.
            Want to be one of them?
          </p>
          <a href="#contact" className="btn-ghost mt-8 px-6 py-3 text-sm">
            Be a founding client
            <ArrowRight className="size-4" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Audit Tool ---------------- */

function AuditTool() {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [rating, setRating] = useState<string>("");
  const [form, setForm] = useState({
    business: "",
    url: "",
    email: "",
    phone: "",
    industry: "",
    issues: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const result = await submitInquiry({
        data: {
          name: form.business,
          email: form.email,
          source: "audit",
          website_url: form.url || null,
          message: [
            form.industry && `Industry: ${form.industry}`,
            form.phone && `Phone: ${form.phone}`,
            form.issues && `Current issues: ${form.issues}`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      });
      if ("error" in result) throw new Error(result.error);
      const options = ["Needs Work", "Underperforming", "Solid Foundation"];
      setRating(options[Math.floor(Math.random() * options.length)]);
      setState("done");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("idle");
    }
  };

  return (
    <section id="audit" className="mx-auto max-w-6xl px-6 py-28 md:py-32">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 shadow-[var(--shadow-card)] md:p-14">
          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-secondary/15 blur-3xl" />

          <div className="relative grid gap-10 md:grid-cols-[1fr_1.1fr]">
            <div>
              <Eyebrow>Free website audit</Eyebrow>
              <h2 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl">
                See what your current site is costing you.
              </h2>
              <p className="mt-4 text-lg text-foreground/60">
                We'll look at speed, SEO, mobile, and conversion — then send you a plain-English writeup
                within 24 hours.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-foreground/80">
                {["Speed check", "SEO checklist", "Conversion notes", "Competitor comparison"].map((x) => (
                  <li key={x} className="flex items-center gap-3">
                    <Check className="size-4 text-primary" /> {x}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-glass-border bg-background/80 p-6 backdrop-blur-xl md:p-8">
              {state !== "done" ? (
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Business name" value={form.business} onChange={(v) => setForm({ ...form, business: v })} required />
                    <Input label="Website URL" value={form.url} onChange={(v) => setForm({ ...form, url: v })} placeholder="https://" required />
                    <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                    <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                    <Input label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
                  </div>
                  <TextArea label="Current issues" value={form.issues} onChange={(v) => setForm({ ...form, issues: v })} placeholder="Slow, ugly, no leads, hard to update?" />
                  <button type="submit" disabled={state === "loading"} className="btn-primary w-full py-3.5 disabled:opacity-70">
                    {state === "loading" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        Send it <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="animate-fade-up text-center">
                  <Eyebrow>First look</Eyebrow>
                  <div className="mt-4 text-5xl font-extrabold text-gradient md:text-6xl">{rating}</div>
                  <p className="mt-4 text-foreground/70">
                    Got it. Your full report is on the way to{" "}
                    <span className="font-semibold text-foreground">{form.email}</span> within 24 hours.
                  </p>
                  <button onClick={() => setState("idle")} className="mt-6 rounded-xl border border-glass-border px-6 py-2 text-sm font-medium hover:bg-primary/[0.04]">
                    Do another
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="field mt-1.5"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="field mt-1.5 resize-none" />
    </label>
  );
}

/* ---------------- FAQ ---------------- */

const faqs = [
  { q: "How long does a website take?", a: "Basic sites ship in 1–2 weeks. Advanced builds land in 2–3 weeks. Ascendant flagship projects take 3–4 weeks." },
  { q: "How much does it cost?", a: "Basic is $1,250, Advanced is $1,750, and Ascendant is $2,000 one-time. Each includes an ongoing plan ($150/$200/$250 per month) covering maintenance and your AI chatbot." },
  { q: "Do you offer hosting?", a: "Yes — premium managed hosting on globally distributed edge infrastructure with 99.99% uptime, SSL, and CDN included." },
  { q: "What's included in the monthly plan?", a: "Updates, security monitoring, automated backups, uptime monitoring, small content edits, and your AI chatbot running 24/7." },
  { q: "Can I update it myself?", a: "Absolutely. We build on modern CMS options so your team can edit copy, images, and posts without touching code." },
  { q: "What industries do you work with?", a: "Healthcare, law, construction, restaurants, real estate, cleaning, HVAC, electricians, retail, and e-commerce." },
  { q: "Do you offer AI chatbots?", a: "Yes — every tier includes an AI chatbot trained on your business for FAQ, booking, lead qualification, and CRM sync." },
  { q: "Can you redesign my existing website?", a: "That's our specialty. We migrate content, preserve SEO equity, and relaunch faster, cleaner, and higher-converting." },
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="border-b border-glass-border bg-black/[0.02] py-28 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_1.3fr]">
        <Reveal>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl">Common questions.</h2>
          <p className="mt-4 text-lg text-foreground/60">
            Not sure about something? Send us a note — we usually reply the same day.
          </p>
        </Reveal>
        <div className="divide-y divide-glass-border">
          {faqs.map((f, i) => {
            const isOpen = i === open;
            return (
              <div key={f.q}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                  <span className="text-base font-semibold md:text-lg">{f.q}</span>
                  <ChevronDown className={`size-5 shrink-0 text-foreground/50 transition-transform ${isOpen ? "rotate-180 text-primary" : ""}`} />
                </button>
                <div className={`grid overflow-hidden transition-all duration-500 ${isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="min-h-0 pr-8 text-sm leading-relaxed text-foreground/70">{f.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Contact ---------------- */

function Contact() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    business: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    budget: "",
    timeline: "",
    services: "",
    notes: "",
    contactMethod: "Email",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const message = [
        form.business && `Business: ${form.business}`,
        form.phone && `Phone: ${form.phone}`,
        form.industry && `Industry: ${form.industry}`,
        form.timeline && `Timeline: ${form.timeline}`,
        form.services && `Services: ${form.services}`,
        form.contactMethod && `Preferred contact: ${form.contactMethod}`,
        form.notes && `Notes: ${form.notes}`,
      ]
        .filter(Boolean)
        .join("\n");
      const result = await submitInquiry({
        data: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          source: "contact",
          budget: form.budget || null,
          website_url: form.website || null,
          message: message || null,
        },
      });
      if ("error" in result) throw new Error(result.error);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="mx-auto max-w-6xl px-6 py-28 md:py-32">
      <SectionHead center eyebrow="Contact" tone="secondary" title="Let's build something good." sub="Tell us about your project. We reply within one business day." />

      <Reveal>
        <div className="card-premium p-6 md:p-10">
          {sent ? (
            <div className="animate-fade-up py-16 text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
                <Check className="size-8" />
              </div>
              <h3 className="mt-6 text-2xl font-bold">Got it.</h3>
              <p className="mt-2 text-foreground/60">Thanks {form.firstName || "there"} — we'll be in touch shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive md:col-span-2">
                  {error}
                </div>
              )}
              <Input label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
              <Input label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
              <Input label="Business name" value={form.business} onChange={(v) => setForm({ ...form, business: v })} />
              <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
              <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Input label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://" />
              <Input label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
              <label className="block">
                <Label>Project budget</Label>
                <select value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="field mt-1.5">
                  <option value="">Select…</option>
                  <option>Basic — $1,250 + $150/mo</option>
                  <option>Advanced — $1,750 + $200/mo</option>
                  <option>Ascendant — $2,000 + $250/mo</option>
                  <option>Not sure yet</option>
                </select>
              </label>
              <label className="block">
                <Label>Timeline</Label>
                <select value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} className="field mt-1.5">
                  <option value="">Select…</option>
                  <option>ASAP</option>
                  <option>Within 1 month</option>
                  <option>1–3 months</option>
                  <option>Just exploring</option>
                </select>
              </label>
              <label className="block">
                <Label>Preferred contact</Label>
                <select value={form.contactMethod} onChange={(e) => setForm({ ...form, contactMethod: e.target.value })} className="field mt-1.5">
                  <option>Email</option>
                  <option>Phone</option>
                  <option>Text</option>
                </select>
              </label>
              <Input label="Services interested in" value={form.services} onChange={(v) => setForm({ ...form, services: v })} placeholder="Redesign, AI chatbot, SEO…" />
              <div className="md:col-span-2">
                <TextArea label="Additional notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={submitting} className="btn-primary group w-full py-4 disabled:opacity-50">
                  {submitting ? "Sending…" : "Send message"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </button>
                <p className="mt-3 text-center text-xs text-foreground/40">
                  Prefer to schedule a call?{" "}
                  <a href="#audit" className="text-primary hover:underline">
                    Book a call
                  </a>
                  .
                </p>
              </div>
            </form>
          )}
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  return (
    <footer className="border-t border-glass-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-tr from-primary to-secondary font-bold text-white">
              A
            </div>
            <span className="text-lg font-bold tracking-tight">AscendantWeb</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-foreground/60">
            Websites, chatbots, and hosting for growing businesses. Nothing fancy — just work that ships.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="mt-6 flex max-w-sm gap-2 rounded-xl border border-glass-border bg-glass p-1 backdrop-blur">
            <input type="email" placeholder="you@company.com" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-foreground/40" />
            <button className="rounded-lg bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110">Subscribe</button>
          </form>
        </div>

        <FooterCol title="Company" links={["About", "Careers", "Blog", "Contact"]} />
        <FooterCol title="Services" links={["Custom Sites", "Redesign", "Landing Pages", "AI Chatbots", "SEO"]} />
        <FooterCol title="Legal" links={["Privacy Policy", "Terms", "DPA", "Security"]} />
      </div>
      <div className="border-t border-glass-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row">
          <Label>© 2026 AscendantWeb</Label>
          <div className="flex gap-4">
            {["Twitter", "LinkedIn", "Instagram"].map((s) => (
              <a key={s} href="#" className="text-xs text-foreground/50 hover:text-foreground">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <Label>{title}</Label>
      <ul className="mt-4 space-y-2 text-sm text-foreground/70">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="transition-colors hover:text-foreground">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Page ---------------- */

function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-foreground selection:bg-primary/30">
      <SkyBackground />
      <Nav />
      <Hero />
      <IndustryMarquee />
      <ProofBand />
      <BeforeAfter />
      <Industries />
      <WhyUs />
      <Services />
      <Systems />
      <Pricing />
      <Testimonials />
      <AuditTool />
      <FAQ />
      <Contact />
      <Footer />
      <ChatWidget />
    </div>
  );
}
