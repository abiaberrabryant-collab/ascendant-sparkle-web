import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  BarChart3,
  Star,
  Smartphone,
  Accessibility,
  Users,
  Calendar,
  Check,
  ChevronDown,
  ArrowUpRight,
  Filter,
  Loader2,
} from "lucide-react";
import beforeSite from "@/assets/before-site.jpg";
import afterSite from "@/assets/after-site.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AscendantWeb — Websites that convert visitors into customers" },
      {
        name: "description",
        content:
          "AscendantWeb builds lightning-fast, high-converting websites for modern businesses. Premium design, AI chatbots, SEO, and performance engineering.",
      },
    ],
  }),
  component: HomePage,
});

/* ---------------- Shared UI ---------------- */

function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-1/2 -left-1/4 size-[900px] rounded-full bg-primary/15 blur-[130px] animate-aurora" />
      <div
        className="absolute -bottom-1/2 -right-1/4 size-[900px] rounded-full bg-secondary/15 blur-[130px] animate-aurora"
        style={{ animationDirection: "reverse" }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0 / 0.6) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />
    </div>
  );
}

function MonoLabel({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "primary" | "secondary" }) {
  const color = tone === "primary" ? "text-primary" : tone === "secondary" ? "text-secondary" : "text-foreground/40";
  return <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${color}`}>{children}</span>;
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
      </span>
      <MonoLabel tone="primary">{children}</MonoLabel>
    </div>
  );
}

/* ---------------- Nav ---------------- */

function Nav() {
  const links = [
    { href: "#services", label: "Services" },
    { href: "#work", label: "Work" },
    { href: "#pricing", label: "Pricing" },
    { href: "#audit", label: "Audit" },
    { href: "#contact", label: "Contact" },
  ];
  return (
    <nav className="sticky top-0 z-50 border-b border-glass-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-tr from-primary to-secondary font-bold text-white shadow-lg shadow-primary/30">
            A
          </div>
          <span className="text-lg font-bold tracking-tight">ASCENDANTWEB</span>
        </a>
        <div className="hidden items-center gap-8 text-sm font-medium text-foreground/60 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </div>
        <a
          href="#audit"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-bold text-background transition-transform hover:scale-105"
        >
          Free Audit
        </a>
      </div>
    </nav>
  );
}

/* ---------------- Hero ---------------- */

function useCountUp(target: number, duration = 1600) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let started = false;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started) {
            started = true;
            const t0 = performance.now();
            const tick = (t: number) => {
              const p = Math.min(1, (t - t0) / duration);
              setValue(Math.floor(target * (1 - Math.pow(1 - p, 3))));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return { value, ref };
}

function Stat({ target, suffix = "", label, tone = "muted" }: { target: number; suffix?: string; label: string; tone?: "muted" | "primary" | "secondary" }) {
  const { value, ref } = useCountUp(target);
  const color = tone === "primary" ? "text-primary" : tone === "secondary" ? "text-secondary" : "text-foreground";
  return (
    <div ref={ref} className="text-center">
      <div className={`text-3xl font-extrabold tabular-nums md:text-4xl ${color}`}>
        {value.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-2">
        <MonoLabel>{label}</MonoLabel>
      </div>
    </div>
  );
}

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
      className="relative mx-auto max-w-7xl px-6 pt-16 pb-28 md:pt-24"
      style={{
        background:
          "radial-gradient(600px circle at var(--mx,50%) var(--my,50%), oklch(0.62 0.19 258 / 0.08), transparent 60%)",
      }}
    >
      <div className="flex flex-col items-center text-center">
        <SectionEyebrow>System Online · Now Accepting Q1 Partners</SectionEyebrow>

        <h1 className="mt-6 max-w-5xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tighter md:text-7xl lg:text-8xl">
          Your Website Should <span className="text-gradient">Work as Hard</span> as You Do.
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg text-foreground/60">
          We build lightning-fast websites that convert visitors into customers — using modern design,
          AI automation, and performance optimization.
        </p>

        <div className="mt-10 flex w-full flex-col justify-center gap-4 sm:flex-row">
          <a
            href="#audit"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 font-bold text-white shadow-lg shadow-primary/30 transition-all hover:shadow-primary/60"
          >
            Get a Free Website Audit
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#work"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-glass-border bg-glass px-8 py-4 font-bold backdrop-blur transition-all hover:bg-white/5"
          >
            View Our Work
          </a>
        </div>

      </div>
    </section>
  );
}


/* ---------------- Trust Stats ---------------- */

function TrustStats() {
  return (
    <section className="border-y border-glass-border bg-white/[0.02] py-14">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-5">
        <Stat target={280} suffix="+" label="Websites Built" tone="primary" />
        <Stat target={190} suffix="+" label="Businesses Helped" tone="secondary" />
        <Stat target={340} suffix="%" label="Avg Speed Boost" />
        <Stat target={14200} suffix="+" label="Leads Generated" tone="primary" />
        <Stat target={99} suffix="%" label="Client Satisfaction" tone="secondary" />
      </div>
    </section>
  );
}

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
    { label: "Page Speed", before: "6.4s", after: "0.8s" },
    { label: "Design Quality", before: "Outdated", after: "Premium 2026" },
    { label: "Mobile Optimization", before: "Broken", after: "Pixel-perfect" },
    { label: "SEO Score", before: "38 / 100", after: "97 / 100" },
    { label: "AI Integration", before: "None", after: "GPT-class chatbot" },
    { label: "Conversion Rate", before: "0.9%", after: "5.8%" },
    { label: "Accessibility", before: "Failing", after: "WCAG AA" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-32">
      <div className="mb-14 max-w-3xl">
        <MonoLabel tone="primary">// The Ascendant Upgrade</MonoLabel>
        <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
          Drag to see what a modern website really looks like.
        </h2>
        <p className="mt-4 text-foreground/60">
          Every second of load time and every layout shift chips away at your brand. We don't just
          redesign — we re-engineer.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div
          ref={wrap}
          className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-3xl border border-glass-border bg-black"
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
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${pos}%` }}
          >
            <img
              src={beforeSite}
              alt="Outdated legacy website"
              width={1200}
              height={1200}
              loading="lazy"
              className="absolute inset-0 h-full object-cover"
              style={{ width: `${(100 / pos) * 100}%` }}
            />
          </div>

          <div className="pointer-events-none absolute left-4 top-4 rounded-md bg-black/60 px-2 py-1 backdrop-blur">
            <MonoLabel>Before</MonoLabel>
          </div>
          <div className="pointer-events-none absolute right-4 top-4 rounded-md bg-primary px-2 py-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white">
              After
            </span>
          </div>

          <div
            className="absolute inset-y-0 z-10 w-px bg-primary shadow-[0_0_20px_oklch(0.62_0.19_258_/_0.7)]"
            style={{ left: `${pos}%` }}
          >
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 grid size-12 place-items-center rounded-full border-4 border-background bg-primary shadow-2xl">
              <ArrowRight className="size-4 -rotate-180 text-white" />
              <ArrowRight className="absolute size-4 text-white translate-x-3" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {criteria.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-glass-border bg-glass p-4 backdrop-blur"
            >
              <MonoLabel>{c.label}</MonoLabel>
              <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                <span className="text-red-400/80 line-through">{c.before}</span>
                <ArrowRight className="size-3 text-foreground/40" />
                <span className="font-semibold text-primary">{c.after}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Why Choose Us ---------------- */

const whyItems = [
  { icon: Layout, title: "Modern UI/UX", desc: "Interfaces engineered to feel effortless and premium." },
  { icon: Smartphone, title: "Mobile Responsive", desc: "Pixel-perfect on every device, from phones to 4K." },
  { icon: Search, title: "SEO Optimization", desc: "Technical + on-page SEO baked into every build." },
  { icon: Zap, title: "Lightning Fast", desc: "Sub-second loads. 95+ Core Web Vitals." },
  { icon: Bot, title: "AI Integration", desc: "Chatbots, lead qualification, and smart automations." },
  { icon: BarChart3, title: "Analytics", desc: "GA4, PostHog, or custom — we wire everything up." },
  { icon: Users, title: "Lead Capture", desc: "Forms, popups, and funnels that actually convert." },
  { icon: Shield, title: "Secure Hosting", desc: "SSL, DDoS mitigation, and 99.99% uptime." },
  { icon: Wrench, title: "Ongoing Maintenance", desc: "Updates, backups, and monitoring — hands-off." },
  { icon: Rocket, title: "Conversion Optimization", desc: "A/B tested layouts and CTAs." },
  { icon: Accessibility, title: "ADA Accessible", desc: "WCAG 2.2 AA compliant by default." },
  { icon: Calendar, title: "Booking Systems", desc: "Cal.com, Calendly, or custom flows." },
];

function WhyUs() {
  return (
    <section className="border-y border-glass-border bg-white/[0.02] py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 max-w-3xl">
          <MonoLabel tone="secondary">// Why AscendantWeb</MonoLabel>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            Every capability a modern business needs. Zero fluff.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyItems.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-glass-border bg-glass p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-white/5"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="grid size-10 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-foreground/60">{desc}</p>
            </div>
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
    tagline: "Bespoke websites engineered from scratch.",
    bullets: ["Custom design system", "Headless CMS", "Blazing performance", "SEO foundation"],
  },
  {
    id: "redesign",
    icon: Rocket,
    title: "Website Redesign",
    tagline: "Transform outdated sites into revenue machines.",
    bullets: ["UX audit + strategy", "Modern rebuild", "Content migration", "Zero downtime launch"],
  },
  {
    id: "landing",
    icon: Sparkles,
    title: "High-Converting Landing Pages",
    tagline: "Purpose-built pages for ads, launches, and funnels.",
    bullets: ["A/B ready", "Analytics wired", "Fast-turn delivery", "CRM integration"],
  },
  {
    id: "ai",
    icon: Bot,
    title: "AI Chatbots",
    tagline: "24/7 AI trained on your business.",
    bullets: [
      "FAQ + support",
      "Lead qualification",
      "Appointment booking",
      "Product recommendations",
      "Quote generation",
      "CRM sync",
    ],
  },
  {
    id: "seo",
    icon: Search,
    title: "SEO Optimization",
    tagline: "Rank higher, get found, convert more.",
    bullets: ["Technical SEO", "On-page optimization", "Schema markup", "Google indexing"],
  },
  {
    id: "maintenance",
    icon: Wrench,
    title: "Website Maintenance",
    tagline: "We keep your site fast, secure, and current.",
    bullets: ["Updates & patches", "Security monitoring", "Automated backups", "Bug fixes"],
  },
];

function Services() {
  const [open, setOpen] = useState<string | null>("ai");
  return (
    <section id="services" className="mx-auto max-w-7xl px-6 py-32">
      <div className="mb-14 max-w-3xl">
        <MonoLabel tone="primary">// Services</MonoLabel>
        <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
          Everything you need to dominate online.
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((s) => {
          const isOpen = open === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setOpen(isOpen ? null : s.id)}
              className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${
                isOpen
                  ? "border-primary/40 bg-gradient-to-b from-primary/10 to-transparent"
                  : "border-glass-border bg-glass hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{s.title}</h3>
                    <p className="text-sm text-foreground/60">{s.tagline}</p>
                  </div>
                </div>
                <ChevronDown
                  className={`size-5 text-foreground/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
              <div
                className={`grid overflow-hidden transition-all duration-500 ${
                  isOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
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
          );
        })}
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
    id: "starter",
    code: "01 / STARTER",
    name: "Starter",
    price: "$2,900",
    cadence: "one-time",
    desc: "Perfect for local businesses launching or refreshing online.",
    features: [
      "Up to 5 pages",
      "Fully mobile responsive",
      "Contact forms",
      "Basic SEO",
      "Analytics + SSL",
      "2 revision rounds",
      "Delivery in 1–2 weeks",
      "Optional AI chatbot add-on",
    ],
    cta: "Launch Starter",
  },
  {
    id: "growth",
    code: "02 / GROWTH",
    name: "Growth",
    price: "$6,500",
    cadence: "one-time",
    desc: "For growing companies that need firepower and automation.",
    features: [
      "Up to 15 pages",
      "Advanced custom design",
      "Blog + CMS",
      "Booking system",
      "CRM integration",
      "Advanced SEO + speed",
      "Analytics dashboard",
      "AI chatbot (first month free)",
      "Delivery in 2–4 weeks",
    ],
    cta: "Select Growth",
    popular: true,
  },
  {
    id: "enterprise",
    code: "03 / ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    desc: "Everything included. For serious operators and scaling brands.",
    features: [
      "Unlimited pages",
      "Custom features & dashboards",
      "Customer & member portals",
      "API + automation workflows",
      "Premium SEO",
      "Dedicated PM + priority support",
      "AI chatbot included",
      "Unlimited revisions in build",
      "Ongoing optimization",
    ],
    cta: "Talk to Sales",
  },
];

const aiTiers: Tier[] = [
  {
    id: "ai-starter",
    code: "AI / STARTER",
    name: "Starter AI",
    price: "$149",
    cadence: "/mo",
    desc: "Answer FAQs and capture leads 24/7.",
    features: ["1,000 msgs / mo", "1 knowledge source", "Lead capture", "Email transcripts", "Basic analytics"],
    cta: "Deploy Starter AI",
  },
  {
    id: "ai-growth",
    code: "AI / GROWTH",
    name: "Growth AI",
    price: "$349",
    cadence: "/mo",
    desc: "Automate booking, quoting, and support.",
    features: [
      "10,000 msgs / mo",
      "5 knowledge sources",
      "Booking + CRM sync",
      "Prompt optimization",
      "Monthly training updates",
      "Advanced analytics",
    ],
    cta: "Deploy Growth AI",
    popular: true,
  },
  {
    id: "ai-enterprise",
    code: "AI / ENTERPRISE",
    name: "Enterprise AI",
    price: "$899",
    cadence: "/mo",
    desc: "White-glove AI with custom integrations.",
    features: [
      "Unlimited msgs",
      "Unlimited knowledge",
      "Custom integrations",
      "Dedicated model tuning",
      "SLA + priority support",
      "Quarterly strategy reviews",
    ],
    cta: "Talk to Sales",
  },
];

function PricingCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-3xl border p-8 transition-all ${
        tier.popular
          ? "border-primary/40 bg-gradient-to-b from-primary/10 to-transparent shadow-2xl shadow-primary/20"
          : "border-glass-border bg-glass hover:border-white/20"
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            Most Popular
          </span>
        </div>
      )}
      <MonoLabel tone={tier.popular ? "primary" : "muted"}>{tier.code}</MonoLabel>
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
      <a
        href="#contact"
        className={`mt-8 inline-flex items-center justify-center rounded-xl px-6 py-3 font-bold transition-all ${
          tier.popular
            ? "bg-primary text-white shadow-lg shadow-primary/40 hover:shadow-primary/60"
            : "border border-glass-border hover:bg-white/5"
        }`}
      >
        {tier.cta}
      </a>
    </div>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="border-y border-glass-border bg-white/[0.02] py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <MonoLabel tone="primary">// Pricing</MonoLabel>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            Transparent pricing. Serious ROI.
          </h2>
          <p className="mt-4 text-foreground/60">Choose the engine that fits your mission.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {websiteTiers.map((t) => (
            <PricingCard key={t.id} tier={t} />
          ))}
        </div>

        <div className="mx-auto mb-14 mt-32 max-w-3xl text-center">
          <MonoLabel tone="secondary">// AI Chatbot Subscriptions</MonoLabel>
          <h3 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
            Bolt on a 24/7 AI teammate.
          </h3>
          <p className="mt-4 text-foreground/60">
            Includes hosting, updates, prompt tuning, and analytics — cancel anytime.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {aiTiers.map((t) => (
            <PricingCard key={t.id} tier={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Portfolio ---------------- */

const industries = [
  "All",
  "Healthcare",
  "Law",
  "Construction",
  "Restaurants",
  "Real Estate",
  "Cleaning",
  "HVAC",
  "Electricians",
  "Retail",
  "E-commerce",
];

const projects = [
  { title: "NorthStar Dental", industry: "Healthcare", metric: "+312% bookings", color: "from-primary/30 to-secondary/20" },
  { title: "Harbor & Wells LLP", industry: "Law", metric: "+180% qualified leads", color: "from-secondary/30 to-primary/20" },
  { title: "Ironclad Builders", industry: "Construction", metric: "+95 SEO score", color: "from-primary/30 to-secondary/20" },
  { title: "Ember Kitchen", industry: "Restaurants", metric: "+240% reservations", color: "from-secondary/30 to-primary/20" },
  { title: "Meridian Realty", industry: "Real Estate", metric: "+410% listing views", color: "from-primary/30 to-secondary/20" },
  { title: "PureShine Co.", industry: "Cleaning", metric: "+275% quote requests", color: "from-secondary/30 to-primary/20" },
  { title: "Arctic Air HVAC", industry: "HVAC", metric: "+220% service calls", color: "from-primary/30 to-secondary/20" },
  { title: "Voltcraft Electric", industry: "Electricians", metric: "+190% conversions", color: "from-secondary/30 to-primary/20" },
  { title: "Nova Apparel", industry: "E-commerce", metric: "+68% AOV", color: "from-primary/30 to-secondary/20" },
];

function Portfolio() {
  const [filter, setFilter] = useState("All");
  const visible = projects.filter((p) => filter === "All" || p.industry === filter);
  return (
    <section id="work" className="mx-auto max-w-7xl px-6 py-32">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <MonoLabel tone="primary">// Portfolio</MonoLabel>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            Recent deployments across every industry.
          </h2>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Filter className="size-4 text-foreground/40" />
          <MonoLabel>Filter</MonoLabel>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {industries.map((i) => (
          <button
            key={i}
            onClick={() => setFilter(i)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              filter === i
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-glass-border bg-glass text-foreground/60 hover:text-foreground"
            }`}
          >
            {i}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <a
            key={p.title}
            href="#contact"
            className="group relative overflow-hidden rounded-2xl border border-glass-border bg-glass p-1 transition-all hover:-translate-y-1 hover:border-primary/40"
          >
            <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br ${p.color}`}>
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(oklch(1 0 0 / 0.15) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.15) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div>
                  <MonoLabel tone="primary">{p.industry}</MonoLabel>
                  <div className="mt-1 text-lg font-bold">{p.title}</div>
                </div>
                <ArrowUpRight className="size-5 text-foreground/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <MonoLabel>Result</MonoLabel>
              <span className="text-sm font-semibold text-primary">{p.metric}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */

const testimonials = [
  {
    name: "Sarah Chen",
    business: "NorthStar Dental",
    quote:
      "We tripled online bookings within 90 days. The site loads instantly and the chatbot handles half our front-desk questions.",
    rating: 5,
  },
  {
    name: "Marcus Reid",
    business: "Ironclad Builders",
    quote:
      "AscendantWeb rebuilt our site in three weeks and we started ranking #1 for our city inside a month. Unreal.",
    rating: 5,
  },
  {
    name: "Elena Vasquez",
    business: "Harbor & Wells LLP",
    quote:
      "They understood the tone a law firm needs and delivered a site that finally feels premium. Leads doubled.",
    rating: 5,
  },
  {
    name: "Dominic Park",
    business: "Ember Kitchen",
    quote:
      "The reservation flow they built is smoother than anything we tested. Guests notice. Revenue is way up.",
    rating: 5,
  },
];

function Testimonials() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % testimonials.length), 6000);
    return () => clearInterval(t);
  }, []);
  const t = testimonials[i];
  return (
    <section className="border-y border-glass-border bg-white/[0.02] py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <MonoLabel tone="secondary">// Client Signal</MonoLabel>
        <div className="mt-6 flex justify-center gap-1">
          {Array.from({ length: t.rating }).map((_, k) => (
            <Star key={k} className="size-5 fill-primary text-primary" />
          ))}
        </div>
        <blockquote key={i} className="animate-fade-up mt-6 text-2xl font-medium leading-relaxed text-foreground md:text-3xl">
          "{t.quote}"
        </blockquote>
        <div className="mt-6">
          <div className="font-bold">{t.name}</div>
          <div className="text-sm text-foreground/50">{t.business}</div>
        </div>
        <div className="mt-8 flex justify-center gap-2">
          {testimonials.map((_, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              aria-label={`Show testimonial ${k + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                k === i ? "w-8 bg-primary" : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Audit Tool ---------------- */

function AuditTool() {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [score, setScore] = useState(0);
  const [form, setForm] = useState({
    business: "",
    url: "",
    email: "",
    phone: "",
    industry: "",
    issues: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setTimeout(() => {
      setScore(38 + Math.floor(Math.random() * 25));
      setState("done");
    }, 1800);
  };

  return (
    <section id="audit" className="mx-auto max-w-6xl px-6 py-32">
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 md:p-14">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-secondary/15 blur-3xl" />

        <div className="relative grid gap-10 md:grid-cols-[1fr_1.1fr]">
          <div>
            <MonoLabel tone="primary">// Free Website Audit</MonoLabel>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
              Find out what your site is really costing you.
            </h2>
            <p className="mt-4 text-foreground/60">
              We'll analyze speed, SEO, mobile UX, and conversion signals — then send you a
              plain-English report within 24 hours.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-foreground/80">
              {["Core Web Vitals score", "Technical SEO checklist", "Conversion opportunities", "Competitor benchmark"].map((x) => (
                <li key={x} className="flex items-center gap-3">
                  <Check className="size-4 text-primary" /> {x}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-glass-border bg-background/70 p-6 backdrop-blur-xl md:p-8">
            {state !== "done" ? (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Business Name" value={form.business} onChange={(v) => setForm({ ...form, business: v })} required />
                  <Input label="Website URL" value={form.url} onChange={(v) => setForm({ ...form, url: v })} placeholder="https://" required />
                  <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                  <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                  <Input label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
                </div>
                <TextArea label="Current Issues" value={form.issues} onChange={(v) => setForm({ ...form, issues: v })} placeholder="Slow, ugly, no leads, hard to update…" />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white shadow-lg shadow-primary/40 transition-all hover:shadow-primary/60 disabled:opacity-70"
                >
                  {state === "loading" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Analyzing your site…
                    </>
                  ) : (
                    <>
                      Run Free Audit <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="animate-fade-up text-center">
                <MonoLabel tone="primary">Preliminary Score</MonoLabel>
                <div className="mt-4 text-7xl font-extrabold text-gradient">{score}/100</div>
                <p className="mt-4 text-foreground/70">
                  Room to grow. We've received your details — a full report is on its way to{" "}
                  <span className="font-semibold text-foreground">{form.email}</span> within 24 hours.
                </p>
                <button
                  onClick={() => setState("idle")}
                  className="mt-6 rounded-xl border border-glass-border px-6 py-2 text-sm font-medium hover:bg-white/5"
                >
                  Run another
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
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
      <MonoLabel>{label}</MonoLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 w-full rounded-lg border border-glass-border bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
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
      <MonoLabel>{label}</MonoLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-1.5 w-full resize-none rounded-lg border border-glass-border bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
      />
    </label>
  );
}

/* ---------------- FAQ ---------------- */

const faqs = [
  { q: "How long does a website take?", a: "Starter sites ship in 1–2 weeks. Growth builds land in 2–4 weeks. Enterprise projects are scoped custom." },
  { q: "How much does it cost?", a: "Sites start at $2,900. Growth builds average $6,500. AI chatbots start at $149/mo. Full pricing is in the section above." },
  { q: "Do you offer hosting?", a: "Yes — premium managed hosting on globally distributed edge infrastructure with 99.99% uptime, SSL, and CDN included." },
  { q: "Do you maintain websites?", a: "Yes. Every plan includes an optional monthly maintenance subscription covering updates, security, backups, and monitoring." },
  { q: "Can I update it myself?", a: "Absolutely. We build on modern CMS options so your team can edit copy, images, and posts without touching code." },
  { q: "What industries do you work with?", a: "Healthcare, law, construction, restaurants, real estate, cleaning, HVAC, electricians, retail, and e-commerce." },
  { q: "Do you offer AI chatbots?", a: "Yes — subscription-based AI assistants trained on your business for FAQ, booking, lead qualification, and CRM sync." },
  { q: "Can you redesign my existing website?", a: "That's our specialty. We migrate content, preserve SEO equity, and relaunch faster, cleaner, and higher-converting." },
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="border-y border-glass-border bg-white/[0.02] py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <MonoLabel tone="primary">// FAQ</MonoLabel>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            Questions, answered.
          </h2>
          <p className="mt-4 text-foreground/60">
            Still unsure? Drop us a note in the contact form — we usually reply within a few hours.
          </p>
        </div>
        <div className="divide-y divide-glass-border">
          {faqs.map((f, i) => {
            const isOpen = i === open;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-base font-semibold md:text-lg">{f.q}</span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-foreground/50 transition-transform ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid overflow-hidden transition-all duration-500 ${
                    isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0 pr-8 text-sm text-foreground/70 leading-relaxed">{f.a}</div>
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
  return (
    <section id="contact" className="mx-auto max-w-6xl px-6 py-32">
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <MonoLabel tone="secondary">// Contact</MonoLabel>
        <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
          Let's build something worth showing off.
        </h2>
        <p className="mt-4 text-foreground/60">
          Tell us about your project. We'll get back within one business day.
        </p>
      </div>

      <div className="rounded-3xl border border-glass-border bg-glass p-6 backdrop-blur md:p-10">
        {sent ? (
          <div className="animate-fade-up py-16 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
              <Check className="size-8" />
            </div>
            <h3 className="mt-6 text-2xl font-bold">Message received.</h3>
            <p className="mt-2 text-foreground/60">
              Thanks {form.firstName || "there"} — we'll be in touch shortly.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <Input label="First Name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
            <Input label="Last Name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
            <Input label="Business Name" value={form.business} onChange={(v) => setForm({ ...form, business: v })} />
            <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://" />
            <Input label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
            <label className="block">
              <MonoLabel>Project Budget</MonoLabel>
              <select
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-glass-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
              >
                <option value="">Select…</option>
                <option>Under $3K</option>
                <option>$3K – $7K</option>
                <option>$7K – $15K</option>
                <option>$15K+</option>
              </select>
            </label>
            <label className="block">
              <MonoLabel>Timeline</MonoLabel>
              <select
                value={form.timeline}
                onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-glass-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
              >
                <option value="">Select…</option>
                <option>ASAP</option>
                <option>Within 1 month</option>
                <option>1–3 months</option>
                <option>Just exploring</option>
              </select>
            </label>
            <label className="block">
              <MonoLabel>Preferred Contact</MonoLabel>
              <select
                value={form.contactMethod}
                onChange={(e) => setForm({ ...form, contactMethod: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-glass-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
              >
                <option>Email</option>
                <option>Phone</option>
                <option>Text</option>
              </select>
            </label>
            <Input label="Services Interested In" value={form.services} onChange={(v) => setForm({ ...form, services: v })} placeholder="Redesign, AI chatbot, SEO…" />
            <div className="md:col-span-2">
              <TextArea label="Additional Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/40 transition-all hover:shadow-primary/60"
              >
                Send Message
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="mt-3 text-center text-xs text-foreground/40">
                Prefer to schedule a call? <a href="#audit" className="text-primary hover:underline">Book a discovery call</a>.
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  return (
    <footer className="border-t border-glass-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-tr from-primary to-secondary font-bold text-white">
              A
            </div>
            <span className="text-lg font-bold tracking-tight">ASCENDANTWEB</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-foreground/60">
            Helping businesses ascend online. Premium websites, AI automation, and performance
            engineering.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 flex max-w-sm gap-2 rounded-xl border border-glass-border bg-glass p-1 backdrop-blur"
          >
            <input
              type="email"
              placeholder="you@company.com"
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-foreground/40"
            />
            <button className="rounded-lg bg-primary px-4 text-sm font-bold text-white hover:brightness-110">
              Subscribe
            </button>
          </form>
        </div>

        <FooterCol title="Company" links={["About", "Careers", "Blog", "Contact"]} />
        <FooterCol title="Services" links={["Custom Sites", "Redesign", "Landing Pages", "AI Chatbots", "SEO"]} />
        <FooterCol title="Legal" links={["Privacy Policy", "Terms", "DPA", "Security"]} />
      </div>
      <div className="border-t border-glass-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row">
          <MonoLabel>© 2026 AscendantWeb · All Systems Operational</MonoLabel>
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
      <MonoLabel>{title}</MonoLabel>
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
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary/30">
      <GlowBackground />
      <Nav />
      <Hero />
      <TrustStats />
      <BeforeAfter />
      <WhyUs />
      <Services />
      <Pricing />
      <Portfolio />
      <Testimonials />
      <AuditTool />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}
