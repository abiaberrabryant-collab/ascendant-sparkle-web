import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, FilePenLine, Radar, ScanSearch, ShieldCheck } from "lucide-react";
import { createSignalDraft, listSignalProspects, scanSignalProspect } from "@/utils/signal-prospecting.functions";

export const Route = createFileRoute("/_authenticated/signals")({
  head: () => ({ meta: [{ title: "Signal Studio — AscendantWeb" }, { name: "robots", content: "noindex" }] }),
  component: SignalStudio,
});

type Signal = { id: string; label: string; detail: string; weight: number };
type Draft = { id: string; subject: string; body: string; status: string; created_at: string };
type Prospect = { id: string; company_name: string; website_url: string; contact_name: string; contact_email: string; status: string; score: number; page_title: string; scanned_at: string | null; signals: Signal[]; drafts: Draft[] };

function SignalStudio() {
  const [prospects, setProspects] = useState<Prospect[] | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [contact, setContact] = useState<Record<string, { name: string; email: string }>>({});

  const refresh = () => listSignalProspects().then((data: any) => setProspects(data)).catch((error) => setNotice(error instanceof Error ? error.message : "Could not load Signal Studio."));
  useEffect(() => { refresh(); }, []);
  const scan = async () => {
    setScanning(true); setNotice("");
    try { await scanSignalProspect({ data: { website_url: websiteUrl } }); setWebsiteUrl(""); setNotice("Website scanned and added to your review queue."); refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not scan that website."); }
    finally { setScanning(false); }
  };
  const updateContact = (id: string, field: "name" | "email", value: string) => setContact((current) => ({ ...current, [id]: { name: current[id]?.name ?? "", email: current[id]?.email ?? "", [field]: value } }));
  const draft = async (prospect: Prospect) => {
    const details = contact[prospect.id] ?? { name: prospect.contact_name ?? "", email: prospect.contact_email ?? "" };
    setDrafting(prospect.id); setNotice("");
    try { await createSignalDraft({ data: { prospect_id: prospect.id, contact_name: details.name, contact_email: details.email } }); setNotice("Personalized draft saved. It will not send automatically."); refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not create the draft."); }
    finally { setDrafting(null); }
  };

  if (!prospects) return <main className="min-h-screen bg-background p-10 text-foreground/60">Loading Signal Studio…</main>;
  return <main className="min-h-screen bg-background px-4 py-10 text-foreground"><div className="mx-auto max-w-6xl">
    <Link to="/dashboard" className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">← Owner dashboard</Link>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-extrabold tracking-tight">Signal Studio</h1><p className="mt-2 max-w-3xl text-foreground/60">Find public website signals worth a thoughtful conversation. Every email stays a draft until you personally review and send it.</p></div><div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-bold text-primary"><ShieldCheck className="size-4" />Review-only outreach</div></div>
    {notice && <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm"><CheckCircle2 className="mr-2 inline size-4 text-primary" />{notice}</div>}
    <section className="mt-8 rounded-2xl border border-primary/25 bg-primary/5 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">Public website scan</div><h2 className="mt-2 text-xl font-bold">Add a business website to research</h2><p className="mt-1 max-w-2xl text-sm text-foreground/60">The scanner checks one public URL for practical signals such as missing chat, contact paths, or mobile setup. It does not crawl private pages, guess contacts, or send email.</p></div><Radar className="size-8 text-primary" /></div><div className="mt-5 flex flex-col gap-3 sm:flex-row"><input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") scan(); }} placeholder="https://example-business.com" className="min-w-0 flex-1 rounded-xl border border-glass-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"/><button onClick={scan} disabled={scanning || !websiteUrl} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-60"><ScanSearch className="size-4" />{scanning ? "Scanning…" : "Scan website"}</button></div></section>
    <section className="mt-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Review queue</h2><span className="text-sm text-foreground/60">{prospects.length} saved prospects</span></div>{prospects.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-glass-border p-10 text-center"><Radar className="mx-auto size-8 text-primary"/><div className="mt-3 font-semibold">Start with one business you genuinely want to help</div><p className="mx-auto mt-1 max-w-lg text-sm text-foreground/60">A good signal gives you a relevant reason to write—not a reason to send bulk messages.</p></div> : <div className="mt-4 space-y-4">{prospects.map((prospect) => <ProspectCard key={prospect.id} prospect={prospect} contact={contact[prospect.id] ?? { name: prospect.contact_name ?? "", email: prospect.contact_email ?? "" }} updateContact={updateContact} onDraft={draft} drafting={drafting === prospect.id} />)}</div>}</section>
  </div></main>;
}

function ProspectCard({ prospect, contact, updateContact, onDraft, drafting }: { prospect: Prospect; contact: { name: string; email: string }; updateContact: (id: string, field: "name" | "email", value: string) => void; onDraft: (prospect: Prospect) => void; drafting: boolean }) {
  const latestDraft = prospect.drafts[0];
  return <article className="rounded-2xl border border-glass-border bg-glass p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-3"><h3 className="text-lg font-bold">{prospect.company_name || "Untitled business"}</h3><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">Signal score {prospect.score}</span></div><a href={prospect.website_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-primary">{prospect.website_url}<ExternalLink className="size-3" /></a>{prospect.page_title && <p className="mt-2 text-sm text-foreground/60">{prospect.page_title}</p>}</div><div className="text-xs text-foreground/50">{prospect.scanned_at ? `Scanned ${new Date(prospect.scanned_at).toLocaleDateString()}` : "Not scanned"}</div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{prospect.signals.length ? prospect.signals.map((signal) => <div key={signal.id} className="rounded-xl border border-glass-border bg-background/40 p-3"><div className="text-sm font-bold">{signal.label}</div><p className="mt-1 text-xs leading-5 text-foreground/60">{signal.detail}</p></div>) : <div className="rounded-xl border border-glass-border p-3 text-sm text-foreground/60">No strong website signals were found. Consider skipping this prospect.</div>}</div>{latestDraft ? <DraftPreview draft={latestDraft} /> : <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="font-semibold">Create a review-only email draft</div><p className="mt-1 text-sm text-foreground/60">Add a business contact you have a legitimate reason to reach. You will still send it yourself from your own email.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><input value={contact.name} onChange={(event) => updateContact(prospect.id, "name", event.target.value)} placeholder="Contact first name" className="rounded-lg border border-glass-border bg-background px-3 py-2 text-sm"/><input value={contact.email} onChange={(event) => updateContact(prospect.id, "email", event.target.value)} placeholder="Business email address" className="rounded-lg border border-glass-border bg-background px-3 py-2 text-sm"/></div><button onClick={() => onDraft(prospect)} disabled={drafting || !contact.name || !contact.email} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/30 px-4 py-2 text-sm font-bold text-primary disabled:opacity-60"><FilePenLine className="size-4" />{drafting ? "Creating…" : "Create email draft"}</button></div>}</article>;
}
function DraftPreview({ draft }: { draft: Draft }) { return <div className="mt-5 rounded-xl border border-glass-border bg-background/40 p-4"><div className="flex items-center justify-between gap-3"><div className="font-semibold">Saved email draft</div><span className="text-xs font-bold uppercase tracking-wider text-primary">Not sent</span></div><div className="mt-3 text-sm"><span className="font-semibold">Subject:</span> {draft.subject}</div><pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-foreground/70">{draft.body}</pre></div>; }
