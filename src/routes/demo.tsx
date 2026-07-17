import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  Check,
  ChevronRight,
  Eye,
  Loader2,
  LockKeyhole,
  MoveRight,
  Phone,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { createWebsiteDemo } from "@/utils/demo-generator.functions";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Instant Website Demo — AscendantWeb" },
      { name: "description", content: "Paste your website URL and see a premium AscendantWeb concept in minutes." },
    ],
  }),
  component: DemoPage,
});

type Industry = "electrical" | "plumbing" | "law" | "restaurant" | "realestate" | "generic";

type Demo = {
  businessName: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  services: Array<{ title: string; description: string }>;
  proof: string[];
  palette: { primary: string; accent: string };
  sourceUrl: string;
  generatedWithAi: boolean;
  industry: Industry;
};

function DemoPage() {
  const [url, setUrl] = useState("");
  const [demo, setDemo] = useState<Demo | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const steps = ["Reading the public page", "Detecting your industry", "Designing your specialized concept"];

  useEffect(() => {
    if (state !== "loading") return;
    const id = window.setInterval(() => setStep((current) => Math.min(current + 1, 2)), 1100);
    return () => window.clearInterval(id);
  }, [state]);

  const generate = async () => {
    setState("loading");
    setStep(0);
    setError("");
    try {
      const result = await createWebsiteDemo({ data: { website_url: url } });
      setDemo(result as Demo);
      setState("done");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not generate a concept from that website.");
      setState("idle");
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <DemoBackdrop />
      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-white text-slate-900">A</span>
          AscendantWeb
        </Link>
        <Link to="/" className="text-sm text-white/70 transition hover:text-white">
          Back to website
        </Link>
      </header>

      <section className="relative mx-auto max-w-5xl px-6 pb-16 pt-12 text-center md:pb-24 md:pt-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/5 px-3 py-1 text-xs font-semibold text-cyan-100">
          <Sparkles className="size-3.5" />
          Instant concept studio
        </div>
        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
          Paste your website.
          <br />
          <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
            See a site built for your trade.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/65">
          We read one public page, detect your industry, and build a specialized concept designed around how your
          customers actually buy.
        </p>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/15 bg-white/[0.06] p-2 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && url) generate();
              }}
              placeholder="https://yourwebsite.com"
              className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/35"
            />
            <button
              onClick={generate}
              disabled={!url || state === "loading"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-slate-900 transition hover:scale-[1.02] disabled:opacity-60"
            >
              {state === "loading" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <WandSparkles className="size-4" />
                  Create my demo
                </>
              )}
            </button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-200">{error}</p>}

        <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-white/45">
          <span className="inline-flex items-center gap-1">
            <LockKeyhole className="size-3" />
            Public pages only
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" />
            Specialized concept
          </span>
          <span className="inline-flex items-center gap-1">
            <Bot className="size-3" />
            No sign-up required
          </span>
        </div>

        {state === "loading" && (
          <div className="mx-auto mt-9 max-w-md text-left">
            {steps.map((label, index) => (
              <div
                key={label}
                className={`flex items-center gap-3 border-l py-2 pl-4 text-sm transition ${index <= step ? "border-cyan-300 text-cyan-100" : "border-white/10 text-white/30"}`}
              >
                <span
                  className={`grid size-5 place-items-center rounded-full text-[10px] ${index < step ? "bg-cyan-300 text-slate-900" : index === step ? "animate-pulse bg-white/20" : "bg-white/5"}`}
                >
                  {index < step ? <Check className="size-3" /> : index + 1}
                </span>
                {label}
              </div>
            ))}
          </div>
        )}
      </section>

      {demo ? (
        <DemoPreview
          demo={demo}
          onReset={() => {
            setDemo(null);
            setState("idle");
            setUrl("");
          }}
        />
      ) : (
        <HowItWorks />
      )}
    </main>
  );
}

function DemoBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div className="absolute -left-40 -top-40 size-[620px] rounded-full bg-cyan-400/15 blur-[150px]" />
      <div className="absolute -bottom-72 -right-32 size-[700px] rounded-full bg-violet-500/20 blur-[170px]" />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: "linear-gradient(#fff1 1px,transparent 1px),linear-gradient(90deg,#fff1 1px,transparent 1px)",
          backgroundSize: "54px 54px",
          maskImage: "radial-gradient(circle at center,black,transparent 78%)",
        }}
      />
    </div>
  );
}

function HowItWorks() {
  const cards: Array<[string, string, string]> = [
    ["01", "Paste a public URL", "We look at the visible copy and structure of one public page."],
    ["02", "We detect your industry", "The concept is tailored to your trade — plumbing, law, restaurants, and more."],
    ["03", "Make it real", "Choose a package and we turn the concept into a fully built website."],
  ];
  return (
    <section className="relative mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">
      {cards.map(([number, title, text]) => (
        <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.045] p-6 backdrop-blur">
          <div className="font-mono text-xs text-cyan-200">{number}</div>
          <h2 className="mt-7 text-xl font-bold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">{text}</p>
        </div>
      ))}
    </section>
  );
}

/* ---------------- Industry templates ---------------- */

type Template = {
  nav: string[];
  asideKind: "chat" | "booking";
  asideTitle: string;
  asidePrimary: string;
  sectionEyebrow: string;
  sectionTitle: string;
  items: Array<{ title: string; desc: string }>;
  visual: boolean;
  phone: boolean;
  bar: { title: string; sub: string; button: string };
};

function templateFor(industry: Industry, name: string): Template {
  switch (industry) {
    case "electrical":
      return {
        nav: ["Services", "Service area", "Reviews", "Contact"],
        asideKind: "booking",
        asideTitle: "Book an electrician",
        asidePrimary: "Get a fast quote",
        sectionEyebrow: "What we handle",
        sectionTitle: "Licensed electrical work, done right",
        items: [
          { title: "24/7 emergency callouts", desc: "Power out or sparking? We answer day or night." },
          { title: "Panel upgrades & rewiring", desc: "Safe, modern electrical for older homes and busy shops." },
          { title: "Licensed & insured", desc: "Certified electricians, every job up to code." },
          { title: "Upfront quotes", desc: "Clear pricing before we start — no surprises." },
        ],
        visual: false,
        phone: true,
        bar: { title: "Power emergency?", sub: "We pick up 24/7 and can be on site fast.", button: "Call now" },
      };
    case "plumbing":
      return {
        nav: ["Services", "Book online", "Reviews", "Contact"],
        asideKind: "booking",
        asideTitle: "Book a plumber",
        asidePrimary: "Check availability",
        sectionEyebrow: "Our services",
        sectionTitle: "Plumbing & HVAC you can count on",
        items: [
          { title: "Same-day repairs", desc: "Leaks, clogs, and breakdowns handled fast." },
          { title: "Heating & cooling", desc: "HVAC installs, tune-ups, and emergency fixes." },
          { title: "Upfront flat pricing", desc: "Know the price before we begin." },
          { title: "Easy online booking", desc: "Pick a time that works — confirmed by text." },
        ],
        visual: false,
        phone: true,
        bar: { title: "Burst pipe or no heat?", sub: "Same-day emergency slots available now.", button: "Book now" },
      };
    case "law":
      return {
        nav: ["Practice areas", "Attorneys", "Results", "Contact"],
        asideKind: "booking",
        asideTitle: "Request a consultation",
        asidePrimary: "Start your case",
        sectionEyebrow: "Practice areas",
        sectionTitle: "Experienced counsel on your side",
        items: [
          { title: "Free case review", desc: "Tell us what happened — we'll tell you where you stand." },
          { title: "Experienced attorneys", desc: "Decades of combined courtroom experience." },
          { title: "Clear communication", desc: "Plain-English updates at every step." },
          { title: "Flexible fee options", desc: "Ask about contingency and payment plans." },
        ],
        visual: false,
        phone: false,
        bar: { title: "Not sure if you have a case?", sub: "Get a free, confidential review today.", button: "Request consultation" },
      };
    case "restaurant":
      return {
        nav: ["Menu", "Reservations", "Hours", "Contact"],
        asideKind: "booking",
        asideTitle: "Reserve a table",
        asidePrimary: "Book a table",
        sectionEyebrow: "Menu highlights",
        sectionTitle: "Fresh plates, made to order",
        items: [
          { title: "Seasonal menu", desc: "Dishes that change with what's fresh." },
          { title: "Easy reservations", desc: "Book your table online in seconds." },
          { title: "Private events", desc: "Host your celebration with us." },
          { title: "Order online", desc: "Pickup and delivery from our kitchen." },
        ],
        visual: true,
        phone: false,
        bar: { title: "Planning a night out?", sub: "Reserve your table before we fill up.", button: "Book a table" },
      };
    case "realestate":
      return {
        nav: ["Listings", "About", "Neighborhoods", "Contact"],
        asideKind: "booking",
        asideTitle: "Book a viewing",
        asidePrimary: "See listings",
        sectionEyebrow: "Featured listings",
        sectionTitle: "Homes that move fast",
        items: [
          { title: "Active listings", desc: "Browse homes with photos, maps, and details." },
          { title: "Free home valuation", desc: "Find out what your home is worth today." },
          { title: "Buyer guidance", desc: "From first tour to closing, handled." },
          { title: "Neighborhood guides", desc: "Local insight on schools, prices, and trends." },
        ],
        visual: true,
        phone: false,
        bar: { title: "Thinking of buying or selling?", sub: "Get a free home valuation or tour.", button: "Book a viewing" },
      };
    default:
      return {
        nav: ["Services", "About", "Contact"],
        asideKind: "chat",
        asideTitle: `Ask ${name}`,
        asidePrimary: "Chat with us",
        sectionEyebrow: "How we help",
        sectionTitle: "Built to turn visits into customers",
        items: [
          { title: "Clear next steps", desc: "Visitors instantly know what to do." },
          { title: "Built for trust", desc: "Proof and details where decisions happen." },
          { title: "Always available", desc: "A trained assistant answers common questions 24/7." },
          { title: "Made to convert", desc: "Every page nudges toward getting in touch." },
        ],
        visual: false,
        phone: false,
        bar: { title: "Like what you see?", sub: `This concept is designed around ${name}.`, button: "Make it real" },
      };
  }
}

/* ---------------- Preview ---------------- */

function DemoPreview({ demo, onReset }: { demo: Demo; onReset: () => void }) {
  const t = templateFor(demo.industry, demo.businessName);
  const style = { "--demo-primary": demo.palette.primary, "--demo-accent": demo.palette.accent } as CSSProperties;

  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-2 text-sm text-white/60">
        <div className="inline-flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
          Specialized {demo.industry === "generic" ? "concept" : `${demo.industry} concept`}{" "}
          {demo.generatedWithAi ? "personalized with AI" : "ready"}
        </div>
        <button onClick={onReset} className="inline-flex items-center gap-2 text-white transition hover:text-cyan-200">
          <RefreshCw className="size-3.5" />
          Try another website
        </button>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/15 bg-slate-50 p-2 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-2 rounded-t-[20px] bg-slate-900 px-4 py-3">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-300" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <div className="ml-3 max-w-[50%] truncate rounded bg-white/10 px-3 py-1 font-mono text-[10px] text-white/60">
            {demo.sourceUrl}
          </div>
        </div>

        <div style={style} className="overflow-hidden bg-white text-slate-900">
          {/* Nav */}
          <div className="mx-auto max-w-6xl px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="text-lg font-black tracking-tight">{demo.businessName}</div>
              <div className="hidden gap-6 text-xs font-semibold text-slate-500 md:flex">
                {t.nav.map((link) => (
                  <span key={link}>{link}</span>
                ))}
              </div>
              <button className="rounded-full px-4 py-2 text-xs font-bold text-white" style={{ background: "var(--demo-primary)" }}>
                {demo.primaryCta}
              </button>
            </div>
          </div>

          {/* Hero */}
          <div className="relative overflow-hidden border-y border-slate-100">
            <div className="absolute -right-24 -top-32 size-96 rounded-full opacity-20 blur-3xl" style={{ background: "var(--demo-accent)" }} />
            <div className="absolute -bottom-20 left-1/3 size-80 rounded-full opacity-15 blur-3xl" style={{ background: "var(--demo-primary)" }} />
            <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.2fr_.8fr] md:py-24">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[.2em]" style={{ color: "var(--demo-primary)" }}>
                  {demo.eyebrow}
                </div>
                <h2 className="mt-5 max-w-2xl text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">{demo.headline}</h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-slate-600">{demo.subheadline}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button className="rounded-xl px-5 py-3 text-sm font-bold text-white shadow-xl" style={{ background: "var(--demo-primary)" }}>
                    {demo.primaryCta} <ArrowRight className="ml-1 inline size-4" />
                  </button>
                  <button className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold">{demo.secondaryCta}</button>
                </div>
              </div>
              <HeroAside demo={demo} template={t} />
            </div>
          </div>

          {/* Signature section (industry-specific) */}
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[.2em]" style={{ color: "var(--demo-primary)" }}>
              {t.sectionEyebrow}
            </div>
            <h3 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">{t.sectionTitle}</h3>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {t.items.map((item, index) =>
                t.visual ? (
                  <div key={item.title} className="overflow-hidden rounded-2xl border border-slate-200 transition hover:-translate-y-1 hover:shadow-xl">
                    <div
                      className="flex h-24 items-end p-3"
                      style={{ background: `linear-gradient(135deg, var(--demo-primary), var(--demo-accent))` }}
                    >
                      <span className="rounded-md bg-white/85 px-2 py-0.5 text-[10px] font-bold text-slate-700">0{index + 1}</span>
                    </div>
                    <div className="p-5">
                      <h4 className="font-bold">{item.title}</h4>
                      <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ) : (
                  <div key={item.title} className="rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="grid size-9 place-items-center rounded-lg text-sm font-black text-white" style={{ background: index === 1 ? "var(--demo-accent)" : "var(--demo-primary)" }}>
                      0{index + 1}
                    </div>
                    <h4 className="mt-6 font-bold">{item.title}</h4>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.desc}</p>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* How we help (AI-written services) */}
          <div className="border-t border-slate-100 bg-slate-50/60">
            <div className="mx-auto max-w-6xl px-6 py-16">
              <div className="grid gap-4 md:grid-cols-3">
                {demo.services.map((service, index) => (
                  <div key={service.title} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="grid size-9 place-items-center rounded-lg text-sm font-black text-white" style={{ background: index === 1 ? "var(--demo-accent)" : "var(--demo-primary)" }}>
                      0{index + 1}
                    </div>
                    <h4 className="mt-6 text-lg font-bold">{service.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
                    <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold" style={{ color: "var(--demo-primary)" }}>
                      Learn more <ChevronRight className="size-4" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Proof strip */}
          <div className="mx-auto max-w-6xl px-6 pb-4 pt-12">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {demo.proof.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                  <Check className="size-4" style={{ color: "var(--demo-primary)" }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Industry contact bar */}
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div
              className="flex flex-col items-center justify-between gap-5 rounded-3xl p-8 text-center text-white md:flex-row md:text-left"
              style={{ background: `linear-gradient(120deg, var(--demo-primary), var(--demo-accent))` }}
            >
              <div>
                <div className="text-2xl font-black">{t.bar.title}</div>
                <p className="mt-2 text-sm text-white/80">{t.bar.sub}</p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900">
                {t.phone ? <Phone className="size-4" /> : <CalendarCheck className="size-4" />}
                {t.bar.button}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-slate-500 md:flex-row">
              <span className="font-bold text-slate-700">{demo.businessName}</span>
              <span>A specialized concept by AscendantWeb</span>
            </div>
          </div>
        </div>
      </div>

      {/* Make it real */}
      <div className="mt-6 flex flex-col items-center justify-between gap-5 rounded-3xl bg-white/[0.05] p-8 text-center md:flex-row md:text-left">
        <div>
          <div className="text-xl font-black text-white">Ready to make this real?</div>
          <p className="mt-2 text-sm text-white/60">We'll build this specialized site for {demo.businessName}, fully live.</p>
        </div>
        <a href="/#contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950">
          Build my site <MoveRight className="size-4" />
        </a>
      </div>
    </section>
  );
}

function HeroAside({ demo, template }: { demo: Demo; template: Template }) {
  if (template.asideKind === "chat") {
    return (
      <div className="relative rounded-3xl border border-white bg-white/70 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur">
        <div className="absolute -right-2 -top-2 rounded-full px-3 py-1 text-[10px] font-bold text-white" style={{ background: "var(--demo-accent)" }}>
          LIVE CONCEPT
        </div>
        <div className="rounded-2xl bg-slate-900 p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="font-bold">Ask {demo.businessName}</span>
            <Bot className="size-5" style={{ color: "var(--demo-primary)" }} />
          </div>
          <p className="mt-5 text-sm text-white/60">Hi! How can I help you today?</p>
          <div className="mt-6 rounded-xl bg-white/10 px-3 py-2 text-sm text-white/70">I'd like to learn more</div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {demo.proof.map((item) => (
            <div key={item} className="rounded-xl bg-slate-100 p-3 text-center text-[10px] font-bold text-slate-600">
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl border border-white bg-white/80 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur">
      <div className="absolute -right-2 -top-2 rounded-full px-3 py-1 text-[10px] font-bold text-white" style={{ background: "var(--demo-accent)" }}>
        LIVE CONCEPT
      </div>
      <div className="flex items-center gap-2">
        <div className="grid size-9 place-items-center rounded-lg text-white" style={{ background: "var(--demo-primary)" }}>
          <CalendarCheck className="size-5" />
        </div>
        <div className="font-bold">{template.asideTitle}</div>
      </div>
      <div className="mt-5 space-y-2.5">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400">Your name</div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400">
          {template.phone ? "Phone number" : "Email address"}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400">How can we help?</div>
      </div>
      <button className="mt-4 w-full rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg" style={{ background: "var(--demo-primary)" }}>
        {template.asidePrimary}
      </button>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {demo.proof.map((item) => (
          <div key={item} className="rounded-xl bg-slate-100 p-2.5 text-center text-[10px] font-bold text-slate-600">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
