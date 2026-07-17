import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Bot, ClipboardList, Settings } from "lucide-react";
import { getMyOrganization, saveMyOrganization } from "@/utils/organization.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Owner dashboard — AscendantWeb" }, { name: "robots", content: "noindex" }] }),
  component: DashboardPage,
});

type Organization = { name: string; website_url: string; industry: string; service_area: string };
const blank: Organization = { name: "", website_url: "", industry: "", service_area: "" };

function DashboardPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => { getMyOrganization().then((data: any) => setOrganization(data ?? blank)).catch((error) => setNotice(error instanceof Error ? error.message : "Could not load your business profile.")); }, []);
  const update = (key: keyof Organization, value: string) => setOrganization((current) => current ? { ...current, [key]: value } : current);
  const save = async () => {
    if (!organization) return;
    setSaving(true); setNotice("");
    try { await saveMyOrganization({ data: organization }); setNotice("Business profile saved."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not save your business profile."); }
    finally { setSaving(false); }
  };
  if (!organization) return <main className="min-h-screen bg-background p-10 text-foreground/60">Loading your dashboard…</main>;
  return <main className="min-h-screen bg-background px-4 py-10"><div className="mx-auto max-w-5xl"><Link to="/account" className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">← My account</Link><h1 className="mt-3 text-4xl font-extrabold tracking-tight">Owner dashboard</h1><p className="mt-2 max-w-2xl text-foreground/60">Your business profile powers your website, chatbot, and future sales tools. Only information you approve is used.</p>
    <section className="mt-8 grid gap-4 md:grid-cols-3"><Link to="/chatbot" className="rounded-2xl border border-glass-border bg-glass p-5 transition hover:border-primary/40"><Bot className="size-5 text-primary"/><h2 className="mt-3 font-bold">Chatbot Studio</h2><p className="mt-1 text-sm text-foreground/60">Train, publish, and install your website chatbot.</p></Link><div className="rounded-2xl border border-glass-border bg-glass p-5"><ClipboardList className="size-5 text-primary"/><h2 className="mt-3 font-bold">Leads & conversations</h2><p className="mt-1 text-sm text-foreground/60">Coming next: your customer conversations, captured leads, and follow-up queue.</p></div><div className="rounded-2xl border border-glass-border bg-glass p-5"><Settings className="size-5 text-primary"/><h2 className="mt-3 font-bold">Automation</h2><p className="mt-1 text-sm text-foreground/60">Coming later with explicit approval, limits, and opt-out controls.</p></div></section>
    <section className="mt-6 rounded-2xl border border-glass-border bg-glass p-6"><div className="flex items-center gap-2"><Building2 className="size-5 text-primary"/><h2 className="text-xl font-bold">Business profile</h2></div><p className="mt-1 text-sm text-foreground/60">This creates the secure organization used to separate your data from every other customer.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Business name" value={organization.name} onChange={(value) => update("name", value)} placeholder="Acme Plumbing"/><Field label="Website URL" value={organization.website_url} onChange={(value) => update("website_url", value)} placeholder="https://example.com"/><Field label="Industry" value={organization.industry} onChange={(value) => update("industry", value)} placeholder="Plumbing"/><Field label="Service area" value={organization.service_area} onChange={(value) => update("service_area", value)} placeholder="Austin, Texas"/></div><div className="mt-5 flex items-center gap-3"><button onClick={save} disabled={saving} className="rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-60">{saving ? "Saving…" : "Save business profile"}</button>{notice && <span className="text-sm text-foreground/60">{notice}</span>}</div></section>
  </div></main>;
}
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="block"><span className="text-sm font-semibold">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-glass-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"/></label>; }
