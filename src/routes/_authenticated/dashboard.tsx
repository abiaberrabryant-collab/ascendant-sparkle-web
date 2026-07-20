import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bot, Building2, CheckCircle2, ClipboardList, ExternalLink, Mail, MessageSquare, Phone, Radar, Save, Settings, Users } from "lucide-react";
import { getMyOrganization, getOwnerWorkspace, saveMyOrganization, updateOwnerLead } from "@/utils/organization.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Owner dashboard — AscendantWeb" }, { name: "robots", content: "noindex" }] }),
  component: DashboardPage,
});

type Organization = { name: string; website_url: string; industry: string; service_area: string };
type LeadStatus = "new" | "contacted" | "qualified" | "won" | "closed";
type Lead = { id: string; name: string | null; email: string | null; phone: string | null; budget: string | null; message: string | null; status: LeadStatus; follow_up_note: string; last_contacted_at: string | null; created_at: string };
type Conversation = { id: string; visitor_name: string | null; visitor_email: string | null; page_url: string | null; created_at: string; updated_at: string };
type Workspace = { chatbot: { id: string; business_name: string; website_url: string; is_live: boolean; allowed_domains: string[]; updated_at: string } | null; leads: Lead[]; conversations: Conversation[] };

const blank: Organization = { name: "", website_url: "", industry: "", service_area: "" };
const statuses: LeadStatus[] = ["new", "contacted", "qualified", "won", "closed"];

function DashboardPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingLead, setSavingLead] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const refreshWorkspace = () => getOwnerWorkspace().then((data: any) => setWorkspace(data)).catch((error) => setNotice(error instanceof Error ? error.message : "Could not load your customer activity."));
  useEffect(() => {
    getMyOrganization().then((data: any) => setOrganization(data ?? blank)).catch((error) => setNotice(error instanceof Error ? error.message : "Could not load your business profile."));
    refreshWorkspace();
  }, []);

  const stats = useMemo(() => ({
    newLeads: workspace?.leads.filter((lead) => lead.status === "new").length ?? 0,
    activeLeads: workspace?.leads.filter((lead) => !["won", "closed"].includes(lead.status)).length ?? 0,
    chats: workspace?.conversations.length ?? 0,
  }), [workspace]);

  const update = (key: keyof Organization, value: string) => setOrganization((current) => current ? { ...current, [key]: value } : current);
  const saveProfile = async () => {
    if (!organization) return;
    setSaving(true); setNotice("");
    try { await saveMyOrganization({ data: organization }); setNotice("Business profile saved."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not save your business profile."); }
    finally { setSaving(false); }
  };
  const saveLead = async (lead: Lead) => {
    setSavingLead(lead.id); setNotice("");
    try {
      await updateOwnerLead({ data: { id: lead.id, status: lead.status, follow_up_note: lead.follow_up_note ?? "" } });
      setNotice("Lead follow-up saved."); refreshWorkspace();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save this lead."); }
    finally { setSavingLead(null); }
  };
  const editLead = (id: string, field: "status" | "follow_up_note", value: string) => setWorkspace((current) => current ? { ...current, leads: current.leads.map((lead) => lead.id === id ? { ...lead, [field]: value } as Lead : lead) } : current);

  if (!organization || !workspace) return <main className="min-h-screen bg-background p-10 text-foreground/60">Loading your dashboard…</main>;

  return <main className="min-h-screen bg-background px-4 py-10 text-foreground"><div className="mx-auto max-w-6xl">
    <Link to="/account" className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">← My account</Link>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-extrabold tracking-tight">Owner dashboard</h1><p className="mt-2 max-w-2xl text-foreground/60">Your free command center for your business profile, chatbot activity, and customer follow-up.</p></div><Link to="/chatbot" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white"><Bot className="size-4" />Open Chatbot Studio</Link></div>
    {notice && <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm"><CheckCircle2 className="mr-2 inline size-4 text-primary" />{notice}</div>}

    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={<Bot />} label="Chatbot" value={workspace.chatbot?.is_live ? "Live" : workspace.chatbot ? "Draft" : "Not set up"} detail={workspace.chatbot?.business_name ?? "Open Studio to begin"} />
      <Stat icon={<Users />} label="New leads" value={String(stats.newLeads)} detail="Needs a reply" />
      <Stat icon={<ClipboardList />} label="Active leads" value={String(stats.activeLeads)} detail="Not won or closed" />
      <Stat icon={<MessageSquare />} label="Recent chats" value={String(stats.chats)} detail="Last 50 conversations" />
    </section>

    <section className="mt-6 grid gap-4 lg:grid-cols-3">
      <Link to="/chatbot" className="rounded-2xl border border-glass-border bg-glass p-5 transition hover:border-primary/40"><Bot className="size-5 text-primary"/><h2 className="mt-3 font-bold">Chatbot Studio</h2><p className="mt-1 text-sm text-foreground/60">Train it, control its status, and copy the website install code.</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Manage chatbot <ExternalLink className="size-3" /></span></Link>
      <a href="#leads" className="rounded-2xl border border-glass-border bg-glass p-5 transition hover:border-primary/40"><ClipboardList className="size-5 text-primary"/><h2 className="mt-3 font-bold">Leads & follow-up</h2><p className="mt-1 text-sm text-foreground/60">Track every captured lead, add a note, and mark their next stage.</p><span className="mt-4 inline-flex text-sm font-semibold text-primary">View leads below</span></a>
 agent/chatbot-studio-changes
      <Link to="/signals" className="rounded-2xl border border-glass-border bg-glass p-5 transition hover:border-primary/40"><Radar className="size-5 text-primary"/><h2 className="mt-3 font-bold">Signal Studio</h2><p className="mt-1 text-sm text-foreground/60">Watch public buyer-intent feeds, then review and edit personalized drafts before sending.</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Find opportunities <ExternalLink className="size-3" /></span></Link>
 
      <div className="rounded-2xl border border-glass-border bg-glass p-5"><Settings className="size-5 text-primary"/><h2 className="mt-3 font-bold">No-cost workflow</h2><p className="mt-1 text-sm text-foreground/60">Use the email and phone buttons below to follow up personally. This requires no CRM, automations, or monthly tools.</p></div>
    </section>

    <section id="leads" className="mt-6 rounded-2xl border border-glass-border bg-glass p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Leads & follow-up queue</h2><p className="mt-1 text-sm text-foreground/60">Your lead data stays private to your organization. Update a stage after each interaction.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{workspace.leads.length} captured</span></div>
      {workspace.leads.length === 0 ? <Empty title="No leads yet" text="When a visitor gives their contact details through your installed chatbot, they will show up here." /> : <div className="mt-5 space-y-4">{workspace.leads.map((lead) => <LeadCard key={lead.id} lead={lead} onChange={editLead} onSave={saveLead} saving={savingLead === lead.id} />)}</div>}
    </section>

    <section className="mt-6 rounded-2xl border border-glass-border bg-glass p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Recent conversations</h2><p className="mt-1 text-sm text-foreground/60">A simple activity view of visitor chats on your connected website.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{workspace.conversations.length} chats</span></div>
      {workspace.conversations.length === 0 ? <Empty title="No conversations yet" text="Once your chatbot is live and installed, visitor chats will appear here." /> : <div className="mt-5 divide-y divide-glass-border">{workspace.conversations.slice(0, 12).map((conversation) => <div key={conversation.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><div className="font-semibold">{conversation.visitor_name || conversation.visitor_email || "Website visitor"}</div><div className="mt-1 max-w-xl truncate text-sm text-foreground/60">{conversation.page_url || "Website chat"}</div></div><div className="text-right text-xs text-foreground/50"><div>Last active {formatDate(conversation.updated_at)}</div>{conversation.visitor_email && <a href={`mailto:${conversation.visitor_email}`} className="mt-1 inline-flex items-center gap-1 text-primary"><Mail className="size-3" />Email visitor</a>}</div></div>)}</div>}
    </section>

    <section className="mt-6 rounded-2xl border border-glass-border bg-glass p-6"><div className="flex items-center gap-2"><Building2 className="size-5 text-primary"/><h2 className="text-xl font-bold">Business profile</h2></div><p className="mt-1 text-sm text-foreground/60">Use accurate details here, then copy the same essentials into Chatbot Studio so your assistant represents you well.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Business name" value={organization.name} onChange={(value) => update("name", value)} placeholder="Acme Plumbing"/><Field label="Website URL" value={organization.website_url} onChange={(value) => update("website_url", value)} placeholder="https://example.com"/><Field label="Industry" value={organization.industry} onChange={(value) => update("industry", value)} placeholder="Plumbing"/><Field label="Service area" value={organization.service_area} onChange={(value) => update("service_area", value)} placeholder="Austin, Texas"/></div><div className="mt-5 flex items-center gap-3"><button onClick={saveProfile} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-60"><Save className="size-4" />{saving ? "Saving…" : "Save business profile"}</button></div></section>
  </div></main>;
}

function Stat({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) { return <div className="rounded-2xl border border-glass-border bg-glass p-5"><div className="text-primary">{icon}</div><div className="mt-4 text-xs font-bold uppercase tracking-wider text-foreground/50">{label}</div><div className="mt-1 text-2xl font-extrabold">{value}</div><div className="mt-1 text-xs text-foreground/60">{detail}</div></div>; }
function Empty({ title, text }: { title: string; text: string }) { return <div className="mt-5 rounded-xl border border-dashed border-glass-border p-6 text-center"><div className="font-semibold">{title}</div><p className="mx-auto mt-1 max-w-lg text-sm text-foreground/60">{text}</p></div>; }
function LeadCard({ lead, onChange, onSave, saving }: { lead: Lead; onChange: (id: string, field: "status" | "follow_up_note", value: string) => void; onSave: (lead: Lead) => void; saving: boolean }) { return <article className="rounded-xl border border-glass-border bg-background/40 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{lead.name || "New website lead"}</h3><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-foreground/60">{lead.email && <a className="inline-flex items-center gap-1 text-primary" href={`mailto:${lead.email}`}><Mail className="size-3" />{lead.email}</a>}{lead.phone && <a className="inline-flex items-center gap-1 text-primary" href={`tel:${lead.phone}`}><Phone className="size-3" />{lead.phone}</a>}{lead.budget && <span>Budget: {lead.budget}</span>}</div></div><div className="text-xs text-foreground/50">Captured {formatDate(lead.created_at)}</div></div>{lead.message && <p className="mt-3 rounded-lg bg-black/5 p-3 text-sm text-foreground/70">{lead.message}</p>}<div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]"><label><span className="text-xs font-semibold">Stage</span><select value={lead.status} onChange={(event) => onChange(lead.id, "status", event.target.value)} className="mt-1 w-full rounded-lg border border-glass-border bg-background px-3 py-2 text-sm">{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></label><label><span className="text-xs font-semibold">Follow-up note</span><input value={lead.follow_up_note ?? ""} onChange={(event) => onChange(lead.id, "follow_up_note", event.target.value)} placeholder="What happened next?" className="mt-1 w-full rounded-lg border border-glass-border bg-background px-3 py-2 text-sm" /></label><button onClick={() => onSave(lead)} disabled={saving} className="self-end rounded-lg border border-primary/30 px-4 py-2 text-sm font-bold text-primary disabled:opacity-60">{saving ? "Saving…" : "Save"}</button></div></article>; }
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="block"><span className="text-sm font-semibold">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-glass-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"/></label>; }
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
