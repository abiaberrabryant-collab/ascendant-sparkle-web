import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FilePenLine,
  MailCheck,
  Play,
  Plus,
  Radar,
  RefreshCw,
  Rss,
  Save,
  ScanSearch,
  Settings2,
  ShieldCheck,
  Target,
} from "lucide-react";
import {
  createSignalDraft,
  listSignalProspects,
  scanSignalProspect,
} from "@/utils/signal-prospecting.functions";
import {
  createSignalOpportunityDraft,
  listSignalCampaigns,
  runSignalCampaign,
  saveSignalCampaign,
  saveSignalSource,
  updateSignalOpportunity,
  updateSignalOpportunityDraft,
} from "@/utils/signal-campaigns.functions";

export const Route = createFileRoute("/_authenticated/signals")({
  // Signal Studio is an internal AscendantWeb prospecting tool, not a client
  // feature. Restrict it to admin accounts; everyone else goes to their dashboard.
  beforeLoad: async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) throw redirect({ to: "/auth", search: { next: "/signals" } });
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Signal Studio — AscendantWeb" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignalStudio,
});

type Signal = { id: string; label: string; detail: string; weight: number };
type WebsiteDraft = { id: string; subject: string; body: string; status: string; created_at: string };
type Prospect = {
  id: string;
  company_name: string;
  website_url: string;
  contact_name: string;
  contact_email: string;
  status: string;
  score: number;
  page_title: string;
  scanned_at: string | null;
  signals: Signal[];
  drafts: WebsiteDraft[];
};
type OpportunityDraft = { id: string; subject: string; body: string; status: "draft" | "approved" | "sent" | "discarded" };
type Opportunity = {
  id: string;
  source_url: string;
  title: string;
  excerpt: string;
  author_name: string;
  posted_at: string | null;
  matched_terms: string[];
  score: number;
  status: "new" | "reviewed" | "draft_ready" | "approved" | "contacted" | "not_a_fit";
  contact_name: string;
  contact_email: string;
  company_name: string;
  company_website_url: string;
  drafts: OpportunityDraft[];
};
type Source = { id: string; name: string; feed_url: string; is_enabled: boolean; last_run_at: string | null };
type Campaign = {
  id: string;
  name: string;
  offer: string;
  ideal_customer: string;
  service_area: string;
  match_keywords: string[];
  intent_phrases: string[];
  sender_name: string;
  sender_email: string;
  postal_address: string;
  opt_out_email: string;
  is_active: boolean;
  sources: Source[];
  opportunities: Opportunity[];
};
type CampaignForm = {
  id?: string;
  name: string;
  offer: string;
  ideal_customer: string;
  service_area: string;
  match_keywords: string;
  intent_phrases: string;
  sender_name: string;
  sender_email: string;
  postal_address: string;
  opt_out_email: string;
  is_active: boolean;
};
type ContactForm = { name: string; email: string; company: string; website: string };
type DraftForm = { subject: string; body: string };

const blankCampaign: CampaignForm = {
  name: "",
  offer: "",
  ideal_customer: "",
  service_area: "",
  match_keywords: "",
  intent_phrases: "",
  sender_name: "",
  sender_email: "",
  postal_address: "",
  opt_out_email: "",
  is_active: true,
};

const opportunityStatuses: Opportunity["status"][] = [
  "new",
  "reviewed",
  "draft_ready",
  "approved",
  "contacted",
  "not_a_fit",
];

function SignalStudio() {
  const [tab, setTab] = useState<"intent" | "website">("intent");
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [prospects, setProspects] = useState<Prospect[] | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(blankCampaign);
  const [source, setSource] = useState({ name: "", feedUrl: "" });
  const [redditConsent, setRedditConsent] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [contactEdits, setContactEdits] = useState<Record<string, ContactForm>>({});
  const [draftEdits, setDraftEdits] = useState<Record<string, DraftForm>>({});
  const [savingOpportunity, setSavingOpportunity] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState<string | null>(null);
  const [websiteContacts, setWebsiteContacts] = useState<Record<string, { name: string; email: string }>>({});
  const autoRunCampaign = useRef<string | null>(null);

  const showNotice = (message: string, tone: "success" | "error" = "success") => {
    setNotice(message);
    setNoticeTone(tone);
  };

  const refresh = async () => {
    try {
      const [nextCampaigns, nextProspects] = await Promise.all([
        listSignalCampaigns(),
        listSignalProspects(),
      ]);
      const resolvedCampaigns = nextCampaigns as Campaign[];
      setCampaigns(resolvedCampaigns);
      setProspects(nextProspects as Prospect[]);
      setSelectedCampaignId((current) => current && resolvedCampaigns.some((campaign) => campaign.id === current) ? current : resolvedCampaigns[0]?.id ?? "");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not load Signal Studio.", "error");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const activeCampaign = useMemo(
    () => campaigns?.find((campaign) => campaign.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId],
  );

  useEffect(() => {
    if (!activeCampaign) return;
    setCampaignForm(toCampaignForm(activeCampaign));
    setSource({ name: "", feedUrl: "" });
  }, [activeCampaign?.id]);

  const saveCampaign = async () => {
    setSaving(true);
    try {
      const saved = await saveSignalCampaign({
        data: {
          id: campaignForm.id,
          name: campaignForm.name,
          offer: campaignForm.offer,
          ideal_customer: campaignForm.ideal_customer,
          service_area: campaignForm.service_area,
          match_keywords: splitTerms(campaignForm.match_keywords),
          intent_phrases: splitTerms(campaignForm.intent_phrases),
          sender_name: campaignForm.sender_name,
          sender_email: campaignForm.sender_email,
          postal_address: campaignForm.postal_address,
          opt_out_email: campaignForm.opt_out_email,
          is_active: campaignForm.is_active,
        },
      });
      setSelectedCampaignId((saved as Campaign).id);
      showNotice("Campaign saved. A free Google News topic feed is connected automatically. You can add more permitted sources below.");
      await refresh();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not save this campaign.", "error");
    } finally {
      setSaving(false);
    }
  };

  const addSource = async () => {
    if (!activeCampaign) return;
    setSaving(true);
    try {
      await saveSignalSource({
        data: {
          campaign_id: activeCampaign.id,
          name: source.name,
          feed_url: source.feedUrl,
          is_enabled: true,
        },
      });
      setSource({ name: "", feedUrl: "" });
      showNotice("Feed source added. Only add feeds you are allowed to monitor.");
      await refresh();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not add that feed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const addPresetSource = async (name: string, feedUrl: string) => {
    if (!activeCampaign) return;
    setSaving(true);
    try {
      await saveSignalSource({
        data: {
          campaign_id: activeCampaign.id,
          name,
          feed_url: feedUrl,
          is_enabled: true,
        },
      });
      showNotice(name + " added. Only public items matching your campaign will enter the review queue.");
      await refresh();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not add that source.", "error");
    } finally {
      setSaving(false);
    }
  };

  const runCampaign = async () => {
    if (!activeCampaign) return;
    setRunning(true);
    try {
      const result = await runSignalCampaign({ data: { campaign_id: activeCampaign.id } }) as {
        itemsFound: number;
        opportunitiesAdded: number;
        errors: string[];
      };
      const suffix = result.errors.length ? " Some sources could not be read." : "";
      showNotice("Found " + result.itemsFound + " relevant posts and added " + result.opportunitiesAdded + " new opportunities." + suffix);
      await refresh();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not run this campaign.", "error");
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (!activeCampaign?.is_active || autoRunCampaign.current === activeCampaign.id) return;
    const enabledSources = activeCampaign.sources.filter((entry) => entry.is_enabled);
    if (!enabledSources.length) return;
    const lastRun = enabledSources
      .map((entry) => entry.last_run_at ? new Date(entry.last_run_at).getTime() : 0)
      .reduce((latest, value) => Math.max(latest, value), 0);
    if (lastRun && Date.now() - lastRun < 1000 * 60 * 60 * 6) return;

    autoRunCampaign.current = activeCampaign.id;
    void (async () => {
      setRunning(true);
      try {
        const result = await runSignalCampaign({ data: { campaign_id: activeCampaign.id } }) as { itemsFound: number; opportunitiesAdded: number; errors: string[] };
        showNotice("Auto-scan found " + result.itemsFound + " relevant items and added " + result.opportunitiesAdded + " new opportunities.");
        await refresh();
      } catch (error) {
        showNotice(error instanceof Error ? error.message : "Automatic scan could not complete.", "error");
      } finally {
        setRunning(false);
      }
    })();
    }, [activeCampaign?.id, activeCampaign?.is_active, activeCampaign?.sources.length]);

  const saveOpportunity = async (opportunity: Opportunity, status = opportunity.status) => {
    const contact = contactFor(opportunity, contactEdits);
    setSavingOpportunity(opportunity.id);
    try {
      await updateSignalOpportunity({
        data: {
          id: opportunity.id,
          status,
          contact_name: contact.name,
          contact_email: contact.email,
          company_name: contact.company,
          company_website_url: contact.website,
        },
      });
      showNotice("Opportunity saved.");
      await refresh();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not save this opportunity.", "error");
    } finally {
      setSavingOpportunity(null);
    }
  };

  const makeDraft = async (opportunity: Opportunity) => {
    const contact = contactFor(opportunity, contactEdits);
    setDrafting(opportunity.id);
    try {
      await createSignalOpportunityDraft({
        data: {
          opportunity_id: opportunity.id,
          contact_name: contact.name,
          contact_email: contact.email,
          company_name: contact.company,
          company_website_url: contact.website,
        },
      });
      showNotice("Personalized draft created. Review and approve it before using your own email to send.");
      await refresh();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not create this draft.", "error");
    } finally {
      setDrafting(null);
    }
  };

  const saveDraft = async (draft: OpportunityDraft, status: OpportunityDraft["status"]) => {
    const values = draftEdits[draft.id] ?? { subject: draft.subject, body: draft.body };
    setSavingDraft(draft.id);
    try {
      await updateSignalOpportunityDraft({ data: { id: draft.id, subject: values.subject, body: values.body, status } });
      showNotice(status === "approved" ? "Draft approved. It still has not been sent." : status === "sent" ? "Marked as sent." : "Draft saved.");
      await refresh();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not save this draft.", "error");
    } finally {
      setSavingDraft(null);
    }
  };

  const scanWebsite = async () => {
    setScanning(true);
    try {
      await scanSignalProspect({ data: { website_url: websiteUrl } });
      setWebsiteUrl("");
      showNotice("Website scanned and added to your review queue.");
      await refresh();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not scan that website.", "error");
    } finally {
      setScanning(false);
    }
  };

  const createWebsiteDraft = async (prospect: Prospect) => {
    const details = websiteContacts[prospect.id] ?? { name: prospect.contact_name ?? "", email: prospect.contact_email ?? "" };
    setDrafting(prospect.id);
    try {
      await createSignalDraft({ data: { prospect_id: prospect.id, contact_name: details.name, contact_email: details.email } });
      showNotice("Personalized draft saved. It will not send automatically.");
      await refresh();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not create the draft.", "error");
    } finally {
      setDrafting(null);
    }
  };

  if (!campaigns || !prospects) return <main className="min-h-screen bg-background p-10 text-foreground/60">Loading Signal Studio…</main>;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Link to="/dashboard" className="inline-flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-primary transition hover:text-primary/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <ChevronRight className="size-3 rotate-180" />Owner dashboard
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
              <ShieldCheck className="size-3.5" />Review-only outreach
            </div>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Signal Studio</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground/60 sm:text-base">
              Watch approved public feeds for people actively describing a problem you solve. Every source stays visible, every contact is entered by you, and every email remains editable until you choose to send it yourself.
            </p>
          </div>
          <div className="rounded-2xl border border-glass-border bg-glass px-4 py-3 text-right">
            <div className="text-xs font-bold uppercase tracking-wider text-foreground/45">Live workflow</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-semibold"><Activity className="size-4 text-primary" />Find → review → draft → approve</div>
          </div>
        </div>

        {notice && (
          <div role="status" className={"mt-6 rounded-xl border p-4 text-sm " + (noticeTone === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-foreground")}>
            <CheckCircle2 className={"mr-2 inline size-4 " + (noticeTone === "error" ? "text-destructive" : "text-primary")} />{notice}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2 border-b border-glass-border pb-3" role="tablist" aria-label="Signal Studio workspaces">
          <TabButton active={tab === "intent"} onClick={() => setTab("intent")} icon={<Target className="size-4" />}>Intent campaigns</TabButton>
          <TabButton active={tab === "website"} onClick={() => setTab("website")} icon={<Radar className="size-4" />}>Website review</TabButton>
        </div>

        {tab === "intent" ? (
          <section className="mt-6">
            <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="rounded-2xl border border-glass-border bg-glass p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-foreground/45">Campaigns</div>
                    <div className="mt-1 text-sm text-foreground/60">{campaigns.length} configured</div>
                  </div>
                  <button onClick={() => { setSelectedCampaignId(""); setCampaignForm(blankCampaign); }} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-primary/30 text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Create campaign">
                    <Plus className="size-4" />
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {campaigns.map((campaign) => (
                    <button key={campaign.id} onClick={() => setSelectedCampaignId(campaign.id)} className={"w-full rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " + (campaign.id === selectedCampaignId ? "border-primary bg-primary/10" : "border-glass-border hover:border-primary/40")}>
                      <div className="flex items-center justify-between gap-2"><span className="font-semibold">{campaign.name}</span><span className={"size-2 rounded-full " + (campaign.is_active ? "bg-emerald-500" : "bg-foreground/25")} /></div>
                      <div className="mt-1 text-xs text-foreground/55">{campaign.opportunities.length} opportunities · {campaign.sources.length} sources</div>
                    </button>
                  ))}
                  {campaigns.length === 0 && <EmptyState icon={<Target className="size-7" />} title="Make your first campaign" text="Describe who you help and the phrases that show they are actively looking." compact />}
                </div>
              </aside>

              <div className="min-w-0">
                <CampaignEditor form={campaignForm} onChange={(key, value) => setCampaignForm((current) => ({ ...current, [key]: value }))} onSave={saveCampaign} saving={saving} isNew={!activeCampaign} />
                {activeCampaign && (
                  <>
                    <SourceManager campaign={activeCampaign} source={source} redditConsent={redditConsent} onRedditConsentChange={setRedditConsent} onChangeSource={(key, value) => setSource((current) => ({ ...current, [key]: value }))} onAdd={addSource} onAddPreset={addPresetSource} saving={saving} />
                    <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/5 p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><Rss className="size-4" />Run discovery</div>
                          <h2 className="mt-2 text-xl font-bold">Look for fresh buyer-intent signals</h2>
                          <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground/60">This reads only the RSS/Atom feeds you added, matches your phrases, and keeps the source link and exact match reason for review.</p>
                        </div>
                        <button onClick={runCampaign} disabled={running || activeCampaign.sources.filter((entry) => entry.is_enabled).length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                          {running ? <RefreshCw className="size-4 animate-spin" /> : <Play className="size-4" />}{running ? "Scanning feeds…" : "Run now"}
                        </button>
                      </div>
                    </div>
                    <OpportunityQueue opportunities={activeCampaign.opportunities} contacts={contactEdits} drafts={draftEdits} drafting={drafting} savingOpportunity={savingOpportunity} savingDraft={savingDraft} onContactChange={(id, key, value) => setContactEdits((current) => ({ ...current, [id]: { ...contactFor(activeCampaign.opportunities.find((entry) => entry.id === id) as Opportunity, current), [key]: value } }))} onDraftChange={(id, key, value) => setDraftEdits((current) => ({ ...current, [id]: { ...(current[id] ?? draftFor(activeCampaign.opportunities, id)), [key]: value } }))} onSaveOpportunity={saveOpportunity} onCreateDraft={makeDraft} onSaveDraft={saveDraft} />
                  </>
                )}
              </div>
            </div>
          </section>
        ) : (
          <WebsiteReview prospects={prospects} websiteUrl={websiteUrl} scanning={scanning} contacts={websiteContacts} drafting={drafting} onWebsiteUrl={setWebsiteUrl} onScan={scanWebsite} onContactChange={(id, key, value) => setWebsiteContacts((current) => ({ ...current, [id]: { ...(current[id] ?? { name: "", email: "" }), [key]: value } }))} onDraft={createWebsiteDraft} />
        )}
      </div>
    </main>
  );
}

function CampaignEditor({ form, onChange, onSave, saving, isNew }: { form: CampaignForm; onChange: (key: keyof CampaignForm, value: string | boolean) => void; onSave: () => void; saving: boolean; isNew: boolean }) {
  return (
    <section className="rounded-2xl border border-glass-border bg-glass p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><Settings2 className="size-4" />Campaign setup</div><h2 className="mt-2 text-xl font-bold">{isNew ? "Set up a buyer-intent campaign" : form.name || "Campaign settings"}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-foreground/60">Use phrases customers naturally write when they are looking for your service. Precise phrases create a smaller, more useful queue.</p></div>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-glass-border px-3 text-sm font-semibold"><input type="checkbox" checked={form.is_active} onChange={(event) => onChange("is_active", event.target.checked)} className="size-4 accent-primary" />Active</label>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Campaign name" value={form.name} onChange={(value) => onChange("name", value)} placeholder="Plumbing emergency signals" required />
        <Field label="Service area" value={form.service_area} onChange={(value) => onChange("service_area", value)} placeholder="Austin, Texas" />
        <TextField label="What you sell" value={form.offer} onChange={(value) => onChange("offer", value)} placeholder="High-converting websites and an AI chatbot for local service businesses" required />
        <TextField label="Ideal customer" value={form.ideal_customer} onChange={(value) => onChange("ideal_customer", value)} placeholder="Local HVAC, plumbing, electrical, and home-service businesses" required />
        <TextField label="Relevant keywords" value={form.match_keywords} onChange={(value) => onChange("match_keywords", value)} placeholder="website, leads, booking, customers" helper="Separate with commas. These identify relevant conversations." required />
        <TextField label="Buyer-intent phrases" value={form.intent_phrases} onChange={(value) => onChange("intent_phrases", value)} placeholder="need a new website, looking for a web designer, website is not getting leads" helper="Separate with commas. These receive the highest signal score." required />
      </div>
      <div className="mt-7 border-t border-glass-border pt-6">
        <div className="text-sm font-bold">Sender and opt-out details</div>
        <p className="mt-1 text-sm leading-6 text-foreground/60">Required before this workspace creates an email draft. Add accurate business details so your manually sent emails can include an opt-out route.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Your name" value={form.sender_name} onChange={(value) => onChange("sender_name", value)} placeholder="Dabi Bryant" />
          <Field label="Your sending email" type="email" value={form.sender_email} onChange={(value) => onChange("sender_email", value)} placeholder="hello@ascendantweb.org" />
          <TextField label="Business postal address" value={form.postal_address} onChange={(value) => onChange("postal_address", value)} placeholder="123 Main St, Austin, TX 78701" />
          <Field label="Opt-out email" type="email" value={form.opt_out_email} onChange={(value) => onChange("opt_out_email", value)} placeholder="privacy@ascendantweb.org" />
        </div>
      </div>
      <button onClick={onSave} disabled={saving} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"><Save className="size-4" />{saving ? "Saving…" : isNew ? "Create campaign" : "Save campaign"}</button>
    </section>
  );
}

function SourceManager({ campaign, source, redditConsent, onRedditConsentChange, onChangeSource, onAdd, onAddPreset, saving }: { campaign: Campaign; source: { name: string; feedUrl: string }; redditConsent: boolean; onRedditConsentChange: (value: boolean) => void; onChangeSource: (key: "name" | "feedUrl", value: string) => void; onAdd: () => void; onAddPreset: (name: string, feedUrl: string) => void; saving: boolean }) {
  const query = [...campaign.intent_phrases, ...campaign.match_keywords].map((term) => term.trim()).filter(Boolean).slice(0, 8).join(" OR ");
  const redditFeed = query ? "https://www.reddit.com/search.rss?q=" + encodeURIComponent(query) + "&sort=new&t=month" : "";

  return (
    <section className="mt-5 rounded-2xl border border-glass-border bg-glass p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><Rss className="size-4" />Approved sources</div><h2 className="mt-2 text-xl font-bold">Public signal feeds</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-foreground/60">Your campaign starts with a free Google News topic feed. Add other RSS or Atom feeds only when their terms allow monitoring for your use case.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{campaign.sources.length} sources</span></div>
      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_auto]"><Field label="Source name" value={source.name} onChange={(value) => onChangeSource("name", value)} placeholder="Local business forum alerts" /><Field label="RSS or Atom URL" value={source.feedUrl} onChange={(value) => onChangeSource("feedUrl", value)} placeholder="https://example.com/feed.xml" /><button onClick={onAdd} disabled={saving || !source.name || !source.feedUrl} className="self-end inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"><Plus className="size-4" />Add source</button></div>
      <div className="mt-5 space-y-2">{campaign.sources.length ? campaign.sources.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-glass-border bg-background/40 p-3"><div className="min-w-0"><div className="font-semibold">{entry.name}</div><a href={entry.feed_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline">{entry.feed_url}<ExternalLink className="size-3 shrink-0" /></a></div><div className="text-right text-xs text-foreground/50"><div>{entry.is_enabled ? "Enabled" : "Paused"}</div><div className="mt-1">{entry.last_run_at ? "Last run " + formatDate(entry.last_run_at) : "Not run yet"}</div></div></div>) : <EmptyState icon={<Rss className="size-7" />} title="No feeds connected" text="Save the campaign to connect the free Google News topic feed, or add another permitted RSS/Atom source." compact />}</div>
      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="text-sm font-bold">Add a free source preset</div>
        <p className="mt-1 text-xs leading-5 text-foreground/60">Google News is connected automatically. Reddit is optional and must only be used when your account and use case are permitted by Reddit’s current terms.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => redditFeed && onAddPreset("Reddit public search RSS", redditFeed)} disabled={!redditFeed || !redditConsent || saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/30 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"><Rss className="size-4" />Add Reddit RSS</button>
          <label className="inline-flex min-h-11 items-center gap-2 text-xs text-foreground/60"><input type="checkbox" checked={redditConsent} onChange={(event) => onRedditConsentChange(event.target.checked)} className="size-4 accent-primary" />I confirmed permission to monitor this public feed.</label>
        </div>
      </div>
    </section>
  );
}

function OpportunityQueue({ opportunities, contacts, drafts, drafting, savingOpportunity, savingDraft, onContactChange, onDraftChange, onSaveOpportunity, onCreateDraft, onSaveDraft }: { opportunities: Opportunity[]; contacts: Record<string, ContactForm>; drafts: Record<string, DraftForm>; drafting: string | null; savingOpportunity: string | null; savingDraft: string | null; onContactChange: (id: string, key: keyof ContactForm, value: string) => void; onDraftChange: (id: string, key: keyof DraftForm, value: string) => void; onSaveOpportunity: (opportunity: Opportunity, status?: Opportunity["status"]) => void; onCreateDraft: (opportunity: Opportunity) => void; onSaveDraft: (draft: OpportunityDraft, status: OpportunityDraft["status"]) => void }) {
  return <section className="mt-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Review queue</h2><p className="mt-1 text-sm text-foreground/60">Every card shows the original public source and the phrases that matched your campaign.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{opportunities.length} opportunities</span></div>{opportunities.length === 0 ? <div className="mt-4"><EmptyState icon={<Radar className="size-8" />} title="Your intent queue is empty" text="Run a campaign after adding a permitted feed. Matching posts will appear here for human review." /></div> : <div className="mt-4 space-y-4">{opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} contact={contactFor(opportunity, contacts)} drafts={drafts} drafting={drafting === opportunity.id} savingOpportunity={savingOpportunity === opportunity.id} savingDraft={savingDraft} onContactChange={onContactChange} onDraftChange={onDraftChange} onSaveOpportunity={onSaveOpportunity} onCreateDraft={onCreateDraft} onSaveDraft={onSaveDraft} />)}</div>}</section>;
}

function OpportunityCard({ opportunity, contact, drafts, drafting, savingOpportunity, savingDraft, onContactChange, onDraftChange, onSaveOpportunity, onCreateDraft, onSaveDraft }: { opportunity: Opportunity; contact: ContactForm; drafts: Record<string, DraftForm>; drafting: boolean; savingOpportunity: boolean; savingDraft: string | null; onContactChange: (id: string, key: keyof ContactForm, value: string) => void; onDraftChange: (id: string, key: keyof DraftForm, value: string) => void; onSaveOpportunity: (opportunity: Opportunity, status?: Opportunity["status"]) => void; onCreateDraft: (opportunity: Opportunity) => void; onSaveDraft: (draft: OpportunityDraft, status: OpportunityDraft["status"]) => void }) {
  const draft = opportunity.drafts[0];
  return <article className="rounded-2xl border border-glass-border bg-glass p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">Signal score {opportunity.score}</span><span className="rounded-full border border-glass-border px-2.5 py-1 text-xs font-bold text-foreground/60">{statusLabel(opportunity.status)}</span></div><h3 className="mt-3 text-lg font-bold">{opportunity.title}</h3><div className="mt-2 flex flex-wrap gap-2">{opportunity.matched_terms.map((term) => <span key={term} className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{term}</span>)}</div></div><div className="text-right text-xs text-foreground/50">{opportunity.posted_at && <div>{formatDate(opportunity.posted_at)}</div>}{opportunity.author_name && <div className="mt-1">By {opportunity.author_name}</div>}</div></div><p className="mt-4 max-w-4xl text-sm leading-6 text-foreground/70">{opportunity.excerpt || "The source did not provide a preview excerpt. Review the original item before taking action."}</p><a href={opportunity.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Open original source<ExternalLink className="size-4" /></a><div className="mt-5 grid gap-3 border-t border-glass-border pt-5 md:grid-cols-2"><Field label="Business contact name" value={contact.name} onChange={(value) => onContactChange(opportunity.id, "name", value)} placeholder="First name" /><Field label="Business email" type="email" value={contact.email} onChange={(value) => onContactChange(opportunity.id, "email", value)} placeholder="name@business.com" /><Field label="Business name" value={contact.company} onChange={(value) => onContactChange(opportunity.id, "company", value)} placeholder="Business name" /><Field label="Business website (optional)" value={contact.website} onChange={(value) => onContactChange(opportunity.id, "website", value)} placeholder="https://business.com" /></div><div className="mt-4 flex flex-wrap items-center gap-3"><label className="text-sm font-semibold">Stage<select value={opportunity.status} onChange={(event) => onSaveOpportunity(opportunity, event.target.value as Opportunity["status"])} disabled={savingOpportunity} className="ml-2 min-h-11 rounded-lg border border-glass-border bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{opportunityStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label><button onClick={() => onSaveOpportunity(opportunity)} disabled={savingOpportunity} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/30 px-4 text-sm font-bold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"><Save className="size-4" />{savingOpportunity ? "Saving…" : "Save lead details"}</button></div>{draft ? <DraftEditor draft={draft} values={drafts[draft.id] ?? { subject: draft.subject, body: draft.body }} contact={contact} onChange={onDraftChange} onSave={onSaveDraft} saving={savingDraft === draft.id} /> : <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="font-semibold">Create a personalized email draft</div><p className="mt-1 max-w-2xl text-sm leading-6 text-foreground/60">Only do this after confirming the business email is appropriate to contact. The draft will cite a public signal without claiming private knowledge.</p></div><button onClick={() => onCreateDraft(opportunity)} disabled={drafting || !contact.name || !contact.email || !contact.company} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"><FilePenLine className="size-4" />{drafting ? "Creating…" : "Create draft"}</button></div></div>}</article>;
}

function DraftEditor({ draft, values, contact, onChange, onSave, saving }: { draft: OpportunityDraft; values: DraftForm; contact: ContactForm; onChange: (id: string, key: keyof DraftForm, value: string) => void; onSave: (draft: OpportunityDraft, status: OpportunityDraft["status"]) => void; saving: boolean }) {
  const mailto = "mailto:" + encodeURIComponent(contact.email) + "?subject=" + encodeURIComponent(values.subject) + "&body=" + encodeURIComponent(values.body);
  return <div className="mt-5 rounded-xl border border-primary/25 bg-primary/5 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-semibold">Editable outreach draft</div><p className="mt-1 text-sm text-foreground/60">Status: {statusLabel(draft.status)}</p></div><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><ShieldCheck className="size-4" />No automatic sending</span></div><div className="mt-4 grid gap-3"><Field label="Subject" value={values.subject} onChange={(value) => onChange(draft.id, "subject", value)} /><TextField label="Email body" value={values.body} onChange={(value) => onChange(draft.id, "body", value)} rows={10} /></div><div className="mt-4 flex flex-wrap gap-3"><button onClick={() => onSave(draft, "draft")} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/30 px-4 text-sm font-bold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"><Save className="size-4" />Save draft</button>{draft.status !== "approved" && draft.status !== "sent" && <button onClick={() => onSave(draft, "approved")} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"><CheckCircle2 className="size-4" />Approve draft</button>}{draft.status === "approved" && <><a href={mailto} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"><MailCheck className="size-4" />Open in my email app</a><button onClick={() => onSave(draft, "sent")} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/30 px-4 text-sm font-bold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60">Mark sent</button></>}</div></div>;
}

function WebsiteReview({ prospects, websiteUrl, scanning, contacts, drafting, onWebsiteUrl, onScan, onContactChange, onDraft }: { prospects: Prospect[]; websiteUrl: string; scanning: boolean; contacts: Record<string, { name: string; email: string }>; drafting: string | null; onWebsiteUrl: (value: string) => void; onScan: () => void; onContactChange: (id: string, key: "name" | "email", value: string) => void; onDraft: (prospect: Prospect) => void }) {
  return <section className="mt-6"><div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><ScanSearch className="size-4" />One-off website review</div><h2 className="mt-2 text-xl font-bold">Research a business you already know</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-foreground/60">This checks one public URL for conversion signals such as missing chat or contact paths. It does not crawl private pages, discover email addresses, or send messages.</p></div><Radar className="size-8 text-primary" /></div><div className="mt-5 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="website-review-url">Public business website URL</label><input id="website-review-url" value={websiteUrl} onChange={(event) => onWebsiteUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onScan(); }} placeholder="https://example-business.com" className="min-h-11 min-w-0 flex-1 rounded-xl border border-glass-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary" /><button onClick={onScan} disabled={scanning || !websiteUrl} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"><ScanSearch className="size-4" />{scanning ? "Scanning…" : "Scan website"}</button></div></div><div className="mt-6 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Website research queue</h2><p className="mt-1 text-sm text-foreground/60">Saved scans stay separate from your intent-feed opportunities.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{prospects.length} saved prospects</span></div>{prospects.length === 0 ? <div className="mt-4"><EmptyState icon={<Radar className="size-8" />} title="No website reviews yet" text="Add one business website you genuinely want to research." /></div> : <div className="mt-4 space-y-4">{prospects.map((prospect) => <WebsiteProspectCard key={prospect.id} prospect={prospect} contact={contacts[prospect.id] ?? { name: prospect.contact_name ?? "", email: prospect.contact_email ?? "" }} drafting={drafting === prospect.id} onContactChange={onContactChange} onDraft={onDraft} />)}</div>}</section>;
}

function WebsiteProspectCard({ prospect, contact, drafting, onContactChange, onDraft }: { prospect: Prospect; contact: { name: string; email: string }; drafting: boolean; onContactChange: (id: string, key: "name" | "email", value: string) => void; onDraft: (prospect: Prospect) => void }) {
  const latestDraft = prospect.drafts[0];
  return <article className="rounded-2xl border border-glass-border bg-glass p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{prospect.company_name || "Untitled business"}</h3><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">Signal score {prospect.score}</span></div><a href={prospect.website_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">{prospect.website_url}<ExternalLink className="size-3" /></a>{prospect.page_title && <p className="mt-2 text-sm text-foreground/60">{prospect.page_title}</p>}</div><div className="text-xs text-foreground/50">{prospect.scanned_at ? "Scanned " + formatDate(prospect.scanned_at) : "Not scanned"}</div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{prospect.signals.length ? prospect.signals.map((signal) => <div key={signal.id} className="rounded-xl border border-glass-border bg-background/40 p-3"><div className="text-sm font-bold">{signal.label}</div><p className="mt-1 text-xs leading-5 text-foreground/60">{signal.detail}</p></div>) : <div className="rounded-xl border border-glass-border p-3 text-sm text-foreground/60">No strong website signals were found. Consider skipping this prospect.</div>}</div>{latestDraft ? <div className="mt-5 rounded-xl border border-glass-border bg-background/40 p-4"><div className="font-semibold">Saved email draft</div><div className="mt-3 text-sm"><span className="font-semibold">Subject:</span> {latestDraft.subject}</div><pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-foreground/70">{latestDraft.body}</pre></div> : <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="font-semibold">Create a review-only email draft</div><p className="mt-1 text-sm leading-6 text-foreground/60">Add a contact you have a legitimate reason to reach. You will still send it yourself from your own email.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Contact first name" value={contact.name} onChange={(value) => onContactChange(prospect.id, "name", value)} placeholder="First name" /><Field label="Business email address" type="email" value={contact.email} onChange={(value) => onContactChange(prospect.id, "email", value)} placeholder="name@business.com" /></div><button onClick={() => onDraft(prospect)} disabled={drafting || !contact.name || !contact.email} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/30 px-4 text-sm font-bold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"><FilePenLine className="size-4" />{drafting ? "Creating…" : "Create email draft"}</button></div>}</article>;
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return <button role="tab" aria-selected={active} onClick={onClick} className={"inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " + (active ? "bg-primary text-white" : "text-foreground/60 hover:bg-primary/10 hover:text-primary")}>{icon}{children}</button>;
}

function Field({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return <label className="block"><span className="text-sm font-semibold">{label}{required && <span className="text-primary"> *</span>}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-11 w-full rounded-xl border border-glass-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary" /></label>;
}

function TextField({ label, value, onChange, placeholder, helper, required = false, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; helper?: string; required?: boolean; rows?: number }) {
  return <label className="block"><span className="text-sm font-semibold">{label}{required && <span className="text-primary"> *</span>}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} className="mt-2 w-full rounded-xl border border-glass-border bg-background px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary" />{helper && <span className="mt-1.5 block text-xs leading-5 text-foreground/50">{helper}</span>}</label>;
}

function EmptyState({ icon, title, text, compact = false }: { icon: ReactNode; title: string; text: string; compact?: boolean }) {
  return <div className={"rounded-2xl border border-dashed border-glass-border text-center " + (compact ? "p-5" : "p-10")}><div className="mx-auto w-fit text-primary">{icon}</div><div className="mt-3 font-semibold">{title}</div><p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-foreground/60">{text}</p></div>;
}

function toCampaignForm(campaign: Campaign): CampaignForm {
  return { id: campaign.id, name: campaign.name, offer: campaign.offer, ideal_customer: campaign.ideal_customer, service_area: campaign.service_area, match_keywords: campaign.match_keywords.join(", "), intent_phrases: campaign.intent_phrases.join(", "), sender_name: campaign.sender_name, sender_email: campaign.sender_email, postal_address: campaign.postal_address, opt_out_email: campaign.opt_out_email, is_active: campaign.is_active };
}

function splitTerms(value: string) {
  return [...new Set(value.split(",").map((term) => term.trim()).filter(Boolean))];
}

function contactFor(opportunity: Opportunity, edits: Record<string, ContactForm>): ContactForm {
  return edits[opportunity.id] ?? { name: opportunity.contact_name ?? "", email: opportunity.contact_email ?? "", company: opportunity.company_name ?? "", website: opportunity.company_website_url ?? "" };
}

function draftFor(opportunities: Opportunity[], id: string): DraftForm {
  const draft = opportunities.flatMap((opportunity) => opportunity.drafts).find((entry) => entry.id === id);
  return { subject: draft?.subject ?? "", body: draft?.body ?? "" };
}

function statusLabel(value: string) {
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
