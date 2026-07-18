import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FilePenLine,
  Filter,
  Globe2,
  Inbox,
  LoaderCircle,
  Plus,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import {
  createPublicSignalDraft,
  createSignalCampaign,
  listSignalWorkspace,
  runSignalCampaign,
  updatePublicSignalStatus,
} from "@/utils/signal-prospecting.functions";

export const Route = createFileRoute("/_authenticated/signals")({
  head: () => ({
    meta: [{ title: "Signal Studio — AscendantWeb" }, { name: "robots", content: "noindex" }],
  }),
  component: SignalStudio,
});

type Draft = {
  id: string;
  recipient_name: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
};
type Campaign = {
  id: string;
  name: string;
  service_area: string;
  offer: string;
  ideal_customer: string;
  keywords: string[];
  intent_phrases: string[];
  source_urls: string[];
  enabled: boolean;
  last_run_at: string | null;
};
type SignalItem = {
  id: string;
  campaign_id: string;
  source_name: string;
  source_url: string;
  item_url: string;
  title: string;
  excerpt: string;
  author: string;
  published_at: string | null;
  matched_terms: string[];
  score: number;
  status: "new" | "reviewed" | "draft_ready" | "dismissed";
  draft: Draft | null;
};
type Workspace = { campaigns: Campaign[]; items: SignalItem[] };

const initialForm = {
  name: "Local service website redesign",
  service_area: "United States",
  offer: "Fast, conversion-focused websites with an AI chatbot for local service businesses",
  ideal_customer:
    "HVAC, plumbing, electrical, roofing, landscaping, remodeling, and other local service owners",
  keywords:
    "website redesign, website speed, mobile website, lead generation, online booking, website chatbot",
  intent_phrases:
    "need a new website, looking for a web designer, website is not getting leads, website is too slow, redesign my website, need a website for my business",
  source_urls: "",
};

function SignalStudio() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const [filter, setFilter] = useState<"all" | "high" | "new" | "draft_ready">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [contact, setContact] = useState<Record<string, { name: string; email: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      setError("");
      const data = await listSignalWorkspace();
      const next = data as unknown as Workspace;
      setWorkspace(next);
      setCampaignId((current) => current || next.campaigns[0]?.id || "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load Signal Studio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const activeCampaign =
    workspace?.campaigns.find((campaign) => campaign.id === campaignId) ?? workspace?.campaigns[0];
  const items = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return (workspace?.items ?? [])
      .filter((item) => !activeCampaign || item.campaign_id === activeCampaign.id)
      .filter(
        (item) =>
          filter === "all" || (filter === "high" ? item.score >= 60 : item.status === filter),
      )
      .filter(
        (item) =>
          !normalized ||
          `${item.title} ${item.excerpt} ${item.source_name} ${item.matched_terms.join(" ")}`
            .toLowerCase()
            .includes(normalized),
      );
  }, [activeCampaign, filter, search, workspace?.items]);

  const stats = useMemo(() => {
    const campaignItems =
      workspace?.items.filter(
        (item) => !activeCampaign || item.campaign_id === activeCampaign.id,
      ) ?? [];
    return {
      total: campaignItems.length,
      high: campaignItems.filter((item) => item.score >= 60).length,
      drafts: campaignItems.filter((item) => item.status === "draft_ready").length,
      sources: new Set(campaignItems.map((item) => item.source_name)).size,
    };
  }, [activeCampaign, workspace?.items]);

  const updateForm = (field: keyof typeof initialForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const splitList = (value: string) => [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ];

  const createCampaign = async (event: FormEvent) => {
    event.preventDefault();
    if (!termsConfirmed) return;
    setSaving(true);
    setNotice("");
    setError("");
    try {
      const campaign = await createSignalCampaign({
        data: {
          name: form.name,
          service_area: form.service_area,
          offer: form.offer,
          ideal_customer: form.ideal_customer,
          keywords: splitList(form.keywords),
          intent_phrases: splitList(form.intent_phrases),
          source_urls: splitList(form.source_urls),
          terms_confirmed: true,
        },
      });
      setShowBuilder(false);
      setTermsConfirmed(false);
      setForm(initialForm);
      setNotice("Campaign created. Run it to pull fresh public signals into your review queue.");
      await refresh();
      setCampaignId((campaign as unknown as Campaign).id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create campaign.");
    } finally {
      setSaving(false);
    }
  };

  const run = async (id: string) => {
    setRunning(id);
    setNotice("");
    setError("");
    try {
      const result = await runSignalCampaign({ data: { campaign_id: id } });
      setNotice(
        `${result.saved} signal${result.saved === 1 ? "" : "s"} added to your review queue${result.failedSources ? ` · ${result.failedSources} source${result.failedSources === 1 ? "" : "s"} could not be read` : ""}.`,
      );
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not run this campaign.");
    } finally {
      setRunning(null);
    }
  };

  const draft = async (item: SignalItem) => {
    const details = contact[item.id] ?? {
      name: item.draft?.recipient_name ?? "",
      email: item.draft?.recipient_email ?? "",
    };
    if (!details.email) return;
    setDrafting(item.id);
    setNotice("");
    setError("");
    try {
      await createPublicSignalDraft({
        data: {
          signal_item_id: item.id,
          recipient_name: details.name,
          recipient_email: details.email,
        },
      });
      setNotice("Personalized draft saved. It remains unsent until you approve it yourself.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the draft.");
    } finally {
      setDrafting(null);
    }
  };

  const setStatus = async (item: SignalItem, status: "reviewed" | "dismissed") => {
    try {
      await updatePublicSignalStatus({ data: { signal_item_id: item.id, status } });
      setNotice(
        status === "dismissed" ? "Signal dismissed from your active queue." : "Marked as reviewed.",
      );
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update this signal.");
    }
  };

  if (loading)
    return (
      <main className="min-h-screen bg-background px-4 py-16 text-foreground">
        <div className="mx-auto max-w-7xl animate-pulse text-sm text-foreground/55">
          Loading your signal workspace…
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground/60 transition hover:text-primary"
          >
            ← Owner dashboard
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="size-4" />
            Human approval required
          </div>
        </div>

        <header className="relative mt-8 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="eyebrow">
                <Radar className="size-3.5" /> Signal intelligence
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
                Find the moment before the pitch.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/60">
                Track relevant public conversations, rank the strongest buying signals, and turn one
                specific context into a thoughtful email draft. Your team reviews every message
                before it leaves.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowBuilder(true)}
                className="btn-primary min-h-11"
              >
                <Plus className="size-4" />
                New campaign
              </button>
              {activeCampaign && (
                <button
                  type="button"
                  onClick={() => run(activeCampaign.id)}
                  disabled={running === activeCampaign.id}
                  className="btn-ghost min-h-11"
                >
                  <RefreshCw
                    className={`size-4 ${running === activeCampaign.id ? "animate-spin" : ""}`}
                  />
                  {running === activeCampaign.id ? "Scanning…" : "Run now"}
                </button>
              )}
            </div>
          </div>
          <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
            <Step
              number="01"
              title="Define intent"
              text="Tell the system who you help and what a real buying moment sounds like."
            />
            <Step
              number="02"
              title="Listen to sources"
              text="Read permitted RSS or Atom feeds, including your automatically added Google News query."
            />
            <Step
              number="03"
              title="Review and draft"
              text="Open the original context, add a legitimate business contact, and approve the wording yourself."
            />
          </div>
        </header>

        {notice && (
          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-primary/25 bg-primary/8 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            {notice}
          </div>
        )}
        {error && (
          <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/8 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Inbox} label="Signals in queue" value={stats.total} />
          <Stat icon={Sparkles} label="High-intent" value={stats.high} accent />
          <Stat icon={FilePenLine} label="Drafts ready" value={stats.drafts} />
          <Stat icon={Globe2} label="Sources represented" value={stats.sources} />
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="card-premium p-4">
              <div className="flex items-center justify-between">
                <div className="eyebrow eyebrow--secondary">Campaigns</div>
                <button
                  type="button"
                  aria-label="Create a campaign"
                  onClick={() => setShowBuilder(true)}
                  className="grid size-9 place-items-center rounded-lg border border-border text-foreground/60 transition hover:border-primary/40 hover:text-primary"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              {workspace?.campaigns.length ? (
                <div className="mt-4 space-y-2">
                  {workspace.campaigns.map((campaign) => (
                    <button
                      type="button"
                      key={campaign.id}
                      onClick={() => setCampaignId(campaign.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${activeCampaign?.id === campaign.id ? "border-primary/35 bg-primary/8" : "border-transparent bg-muted/60 hover:border-border"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold leading-5">{campaign.name}</span>
                        {activeCampaign?.id === campaign.id && (
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        )}
                      </div>
                      <div className="mt-1 text-xs text-foreground/50">
                        {campaign.keywords.length + campaign.intent_phrases.length} intent terms ·{" "}
                        {campaign.source_urls.length + 1} feeds
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-foreground/55">
                  Create a campaign to start listening.
                </div>
              )}
            </div>
            <div className="card-premium p-4">
              <div className="flex items-center gap-2 font-semibold">
                <Activity className="size-4 text-primary" />
                Source rules
              </div>
              <p className="mt-2 text-xs leading-5 text-foreground/55">
                Only use public RSS/Atom feeds whose terms permit automated access. The Google News
                feed is added automatically; any custom source must be approved by you.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="size-3.5" />
                No automatic sending
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Filter className="size-4" />
                </div>
                <select
                  aria-label="Active campaign"
                  value={activeCampaign?.id ?? ""}
                  onChange={(event) => setCampaignId(event.target.value)}
                  className="min-w-0 bg-transparent text-sm font-bold outline-none"
                >
                  <option value="" disabled>
                    Select campaign
                  </option>
                  {workspace?.campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search signals"
                    className="field min-h-10 pl-9 sm:w-48"
                  />
                </div>
                <div className="flex rounded-xl border border-border bg-muted/50 p-1">
                  {(["all", "high", "new", "draft_ready"] as const).map((value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`min-h-9 rounded-lg px-2.5 text-xs font-semibold transition ${filter === value ? "bg-card text-primary shadow-sm" : "text-foreground/55 hover:text-foreground"}`}
                    >
                      {value === "all"
                        ? "All"
                        : value === "high"
                          ? "High"
                          : value === "draft_ready"
                            ? "Drafts"
                            : "New"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeCampaign && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm">
                <div>
                  <span className="font-semibold">{activeCampaign.name}</span>
                  <span className="ml-2 text-foreground/55">
                    {activeCampaign.last_run_at
                      ? `Last run ${formatDate(activeCampaign.last_run_at)}`
                      : "Not run yet"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-foreground/55">
                  <span>{activeCampaign.intent_phrases.length} intent phrases</span>
                  <span>·</span>
                  <span>{activeCampaign.source_urls.length + 1} permitted feeds</span>
                </div>
              </div>
            )}

            {items.length ? (
              <div className="mt-4 space-y-3">
                {items.map((item, index) => (
                  <SignalCard
                    key={item.id}
                    item={item}
                    index={index}
                    expanded={expandedId === item.id}
                    onToggle={() =>
                      setExpandedId((current) => (current === item.id ? null : item.id))
                    }
                    contact={
                      contact[item.id] ?? {
                        name: item.draft?.recipient_name ?? "",
                        email: item.draft?.recipient_email ?? "",
                      }
                    }
                    setContact={(value) =>
                      setContact((current) => ({ ...current, [item.id]: value }))
                    }
                    onDraft={() => draft(item)}
                    drafting={drafting === item.id}
                    onStatus={(status) => setStatus(item, status)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                hasCampaign={Boolean(activeCampaign)}
                onCreate={() => setShowBuilder(true)}
                onRun={() => activeCampaign && run(activeCampaign.id)}
                running={Boolean(activeCampaign && running === activeCampaign.id)}
              />
            )}
          </div>
        </section>
      </div>

      {showBuilder && (
        <CampaignBuilder
          form={form}
          updateForm={updateForm}
          termsConfirmed={termsConfirmed}
          setTermsConfirmed={setTermsConfirmed}
          saving={saving}
          onClose={() => setShowBuilder(false)}
          onSubmit={createCampaign}
        />
      )}
    </main>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/55 p-4">
      <div className="font-mono text-[10px] font-bold tracking-[.18em] text-primary">{number}</div>
      <div className="mt-3 text-sm font-bold">{title}</div>
      <p className="mt-1 text-xs leading-5 text-foreground/55">{text}</p>
    </div>
  );
}
function Stat({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="card-premium flex items-center gap-3 p-4">
      <div
        className={`grid size-10 place-items-center rounded-xl ${accent ? "bg-primary/12 text-primary" : "bg-muted text-foreground/60"}`}
      >
        <Icon className="size-4" />
      </div>
      <div>
        <div className="text-2xl font-extrabold tracking-tight">{value}</div>
        <div className="text-xs font-semibold text-foreground/50">{label}</div>
      </div>
    </div>
  );
}

function SignalCard({
  item,
  index,
  expanded,
  onToggle,
  contact,
  setContact,
  onDraft,
  drafting,
  onStatus,
}: {
  item: SignalItem;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  contact: { name: string; email: string };
  setContact: (value: { name: string; email: string }) => void;
  onDraft: () => void;
  drafting: boolean;
  onStatus: (status: "reviewed" | "dismissed") => void;
}) {
  const tone =
    item.score >= 70
      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
      : item.score >= 40
        ? "text-amber-700 dark:text-amber-300 bg-amber-500/10"
        : "text-foreground/60 bg-muted";
  return (
    <article
      className="card-premium card-hover overflow-hidden p-4 sm:p-5"
      style={{
        animation: "fade-up .45s ease-out both",
        animationDelay: `${Math.min(index, 8) * 45}ms`,
      }}
    >
      <div className="flex gap-3">
        <div
          className={`grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-extrabold ${tone}`}
        >
          {item.score}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-foreground/50">
            <span className="inline-flex items-center gap-1">
              <Globe2 className="size-3.5" />
              {item.source_name}
            </span>
            <span>·</span>
            <span>{item.published_at ? formatDate(item.published_at) : "Recently published"}</span>
            {item.status === "draft_ready" && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                Draft ready
              </span>
            )}
          </div>
          <a
            href={item.item_url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-base font-bold leading-6 transition hover:text-primary"
          >
            {item.title}
            <ArrowUpRight className="ml-1 inline size-3.5 align-[1px]" />
          </a>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/60">
            {item.excerpt ||
              "Open the original source to review the full context behind this signal."}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.matched_terms.slice(0, 5).map((term) => (
              <span
                key={term}
                className="rounded-full border border-primary/15 bg-primary/6 px-2 py-1 text-[11px] font-semibold text-primary"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          aria-label={expanded ? "Collapse signal" : "Open signal actions"}
          onClick={onToggle}
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-foreground/55 transition hover:border-primary/40 hover:text-primary"
        >
          <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>
      {expanded && (
        <div className="mt-5 border-t border-border pt-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-foreground/45">
                <WandSparkles className="size-4 text-primary" />
                Why this is a signal
              </div>
              <p className="mt-2 text-sm leading-6 text-foreground/65">
                The feed matched {item.matched_terms.length || "a relevant"} configured intent term
                {item.matched_terms.length === 1 ? "" : "s"}. Verify the original post or article
                and make sure your contact has a legitimate business reason to hear from you.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onStatus("reviewed")}
                  className="btn-ghost min-h-10 px-3 text-xs"
                >
                  <Check className="size-3.5" />
                  Mark reviewed
                </button>
                <button
                  type="button"
                  onClick={() => onStatus("dismissed")}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-destructive/20 px-3 text-xs font-bold text-destructive transition hover:bg-destructive/8"
                >
                  <Trash2 className="size-3.5" />
                  Dismiss
                </button>
              </div>
            </div>
            {item.draft ? (
              <DraftPreview draft={item.draft} />
            ) : (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 font-bold">
                  <FilePenLine className="size-4 text-primary" />
                  Prepare a personalized draft
                </div>
                <p className="mt-1 text-xs leading-5 text-foreground/55">
                  Use a real business contact you are allowed to reach. This only creates copy; it
                  never sends.
                </p>
                <div className="mt-4 space-y-2">
                  <input
                    value={contact.name}
                    onChange={(event) => setContact({ ...contact, name: event.target.value })}
                    placeholder="Recipient name (optional)"
                    className="field min-h-10"
                  />
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(event) => setContact({ ...contact, email: event.target.value })}
                    placeholder="Business email address"
                    className="field min-h-10"
                  />
                </div>
                <button
                  type="button"
                  onClick={onDraft}
                  disabled={!contact.email || drafting}
                  className="btn-primary mt-3 min-h-10 w-full px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {drafting ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Creating draft…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Create review-only draft
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function DraftPreview({ draft }: { draft: Draft }) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold">
          <CheckCircle2 className="size-4 text-emerald-600" />
          Draft ready
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[.15em] text-emerald-700 dark:text-emerald-300">
          Not sent
        </span>
      </div>
      <div className="mt-4 text-xs text-foreground/55">
        To: {draft.recipient_name || "Unnamed contact"} · {draft.recipient_email}
      </div>
      <div className="mt-3 text-sm font-bold">{draft.subject}</div>
      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap font-sans text-xs leading-6 text-foreground/65">
        {draft.body}
      </pre>
    </div>
  );
}

function EmptyState({
  hasCampaign,
  onCreate,
  onRun,
  running,
}: {
  hasCampaign: boolean;
  onCreate: () => void;
  onRun: () => void;
  running: boolean;
}) {
  return (
    <div className="mt-4 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Radar className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold">
        {hasCampaign ? "Your queue is clear" : "Create your first signal campaign"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground/55">
        {hasCampaign
          ? "Run the campaign again or tune your intent phrases. Keep them specific so the feed stays useful."
          : "Start with one service, one audience, and a few phrases a real buyer might actually write."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {hasCampaign ? (
          <button type="button" onClick={onRun} disabled={running} className="btn-primary min-h-11">
            <RefreshCw className={`size-4 ${running ? "animate-spin" : ""}`} />
            {running ? "Scanning…" : "Run campaign"}
          </button>
        ) : (
          <button type="button" onClick={onCreate} className="btn-primary min-h-11">
            <Plus className="size-4" />
            Build a campaign
          </button>
        )}
      </div>
    </div>
  );
}

function CampaignBuilder({
  form,
  updateForm,
  termsConfirmed,
  setTermsConfirmed,
  saving,
  onClose,
  onSubmit,
}: {
  form: typeof initialForm;
  updateForm: (field: keyof typeof initialForm, value: string) => void;
  termsConfirmed: boolean;
  setTermsConfirmed: (value: boolean) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/25 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">
              <Sparkles className="size-3.5" />
              Campaign builder
            </div>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
              Tell Signal Studio what to listen for.
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground/55">
              Keep the offer specific. The system uses these terms to rank public feed items and
              write grounded drafts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close campaign builder"
            className="grid size-10 place-items-center rounded-xl border border-border text-foreground/55 hover:text-foreground"
          >
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Campaign name"
              value={form.name}
              onChange={(value) => updateForm("name", value)}
              placeholder="Local service redesign"
              required
            />
            <Field
              label="Service area"
              value={form.service_area}
              onChange={(value) => updateForm("service_area", value)}
              placeholder="Austin, TX or United States"
            />
          </div>
          <TextField
            label="What you sell"
            value={form.offer}
            onChange={(value) => updateForm("offer", value)}
            placeholder="A clear, outcome-focused description"
            required
          />
          <TextField
            label="Ideal customer"
            value={form.ideal_customer}
            onChange={(value) => updateForm("ideal_customer", value)}
            placeholder="Who is a strong fit?"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Relevant keywords"
              hint="Comma-separated"
              value={form.keywords}
              onChange={(value) => updateForm("keywords", value)}
              placeholder="website speed, online booking"
            />
            <TextField
              label="Buyer-intent phrases"
              hint="Use phrases a buyer may actually write"
              value={form.intent_phrases}
              onChange={(value) => updateForm("intent_phrases", value)}
              placeholder="need a new website, looking for help"
            />
          </div>
          <TextField
            label="Optional RSS / Atom sources"
            hint="One URL per line. Only add feeds whose current terms allow automated access."
            value={form.source_urls}
            onChange={(value) => updateForm("source_urls", value)}
            placeholder="https://example.com/feed.xml"
          />
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-muted/50 p-4 text-sm">
            <input
              type="checkbox"
              checked={termsConfirmed}
              onChange={(event) => setTermsConfirmed(event.target.checked)}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <span>
              <span className="font-bold">I confirm these sources are permitted.</span>
              <span className="mt-1 block text-xs leading-5 text-foreground/55">
                Signal Studio uses public feeds only. It does not bypass logins, scrape private
                profiles, or send outreach automatically.
              </span>
            </span>
          </label>
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-ghost min-h-11">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !termsConfirmed}
              className="btn-primary min-h-11 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Create campaign
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-foreground/65">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field min-h-11"
      />
    </label>
  );
}
function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold text-foreground/65">
        <span>
          {label}
          {required && <span className="text-primary"> *</span>}
        </span>
        {hint && <span className="font-normal text-foreground/40">{hint}</span>}
      </span>
      <textarea
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="field resize-y"
      />
    </label>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}
