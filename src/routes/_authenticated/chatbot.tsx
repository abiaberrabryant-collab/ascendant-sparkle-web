import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, CheckCircle2, Save, ShieldCheck, Sparkles } from "lucide-react";
import { getMyChatbot, saveMyChatbot } from "@/utils/client-chatbot.functions";
import { Skeleton } from "@/components/Skeleton";

export const Route = createFileRoute("/_authenticated/chatbot")({
  head: () => ({ meta: [{ title: "Chatbot Studio — AscendantWeb" }, { name: "robots", content: "noindex" }] }), component: ChatbotStudio,
});

type Form = { business_name: string; website_url: string; business_description: string; services: string; hours_and_contact: string; faq_and_policies: string; boundaries: string; handoff_message: string; greeting: string; tone: string; brand_color: string; lead_questions: string; is_live: boolean };
const sections: Array<{ key: keyof Form; label: string; hint: string; rows: number }> = [
  { key: "business_description", label: "About your business", hint: "What you do, who you serve, and what makes you different.", rows: 5 },
  { key: "services", label: "Services, products & pricing", hint: "Offerings, starting prices, service areas, and what the chatbot should recommend.", rows: 6 },
  { key: "hours_and_contact", label: "Hours & contact details", hint: "Hours, phone, email, location, and your preferred contact method.", rows: 4 },
  { key: "faq_and_policies", label: "Answers, policies & useful links", hint: "Paste FAQs, policies, warranties, scheduling rules, or useful page links.", rows: 6 },
  { key: "boundaries", label: "Boundaries — what the chatbot must not do", hint: "Example: never give medical advice, promise availability, or quote custom work without a person.", rows: 5 },
  { key: "lead_questions", label: "Lead questions", hint: "What should it ask interested visitors? Example: name, email, project type, budget, and timeline.", rows: 4 },
];

function ChatbotStudio() {
  const [form, setForm] = useState<Form | null>(null); const [eligible, setEligible] = useState<boolean | null>(null); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState("");
  useEffect(() => { getMyChatbot().then((result: any) => { setEligible(result.eligible); if (result.chatbot) { const { id, updated_at, created_at, owner_user_id, ...settings } = result.chatbot; setForm(settings); } }).catch((error) => setNotice(error instanceof Error ? error.message : "Could not load your chatbot.")); }, []);
  const update = (key: keyof Form, value: string | boolean) => setForm((current) => current ? { ...current, [key]: value } : current);
  const save = async () => { if (!form) return; setSaving(true); setNotice(""); try { await saveMyChatbot({ data: form }); setNotice("Saved. Your chatbot setup is ready for review."); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save your changes."); } finally { setSaving(false); } };
  if (eligible === null) return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground" aria-busy="true">
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-96" />
        <div className="mt-6 grid gap-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </main>
  );
  if (!eligible) return <main className="min-h-screen bg-background px-4 py-16"><div className="mx-auto max-w-xl rounded-3xl border border-glass-border bg-glass p-8 text-center"><Bot className="mx-auto size-10 text-primary" /><h1 className="mt-4 text-3xl font-extrabold">Chatbot Studio is ready when you are</h1><p className="mt-3 text-foreground/60">This workspace is available to customers with an active chatbot plan.</p><Link to="/account" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-bold text-white">View my account</Link></div></main>;
  if (!form) return null;
  return <main className="min-h-screen bg-background px-4 py-10 text-foreground"><div className="mx-auto max-w-5xl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><Link to="/account" className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">← My account</Link><h1 className="mt-3 text-4xl font-extrabold tracking-tight">Chatbot Studio</h1><p className="mt-2 max-w-2xl text-foreground/60">Give your AI the information and guardrails it needs to represent your business well.</p></div><button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-lg shadow-primary/30 disabled:opacity-60"><Save className="size-4" />{saving ? "Saving…" : "Save changes"}</button></div>
    {notice && <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm"><CheckCircle2 className="mr-2 inline size-4 text-primary" />{notice}</div>}
    <section className="mt-8 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-glass-border bg-glass p-5 md:col-span-2"><div className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">Your chatbot</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Input label="Business name" value={form.business_name} onChange={(v) => update("business_name", v)} placeholder="Acme Plumbing" /><Input label="Website URL" value={form.website_url} onChange={(v) => update("website_url", v)} placeholder="https://yourbusiness.com" /></div></div><div className="rounded-2xl border border-primary/20 bg-primary/5 p-5"><Sparkles className="size-5 text-primary"/><div className="mt-3 font-semibold">Make it yours</div><p className="mt-1 text-sm text-foreground/60">Changes stay in your private workspace—not another customer’s chatbot.</p></div></section>
    <section className="mt-4 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-glass-border bg-glass p-5"><Input label="Welcome message" value={form.greeting} onChange={(v) => update("greeting", v)} /><div className="mt-4"><Input label="Voice & tone" value={form.tone} onChange={(v) => update("tone", v)} placeholder="Friendly and professional" /></div><label className="mt-4 block"><span className="text-sm font-semibold">Brand color</span><div className="mt-2 flex gap-3"><input aria-label="Brand color" type="color" value={form.brand_color} onChange={(e) => update("brand_color", e.target.value)} className="h-10 w-14 rounded border border-glass-border bg-transparent p-1"/><input value={form.brand_color} onChange={(e) => update("brand_color", e.target.value)} className="w-full rounded-lg border border-glass-border bg-background px-3 py-2 text-sm"/></div></label></div><div className="rounded-2xl border border-glass-border bg-glass p-5"><ShieldCheck className="size-5 text-primary"/><h2 className="mt-3 font-semibold">Human handoff</h2><p className="mt-1 text-sm text-foreground/60">When a question needs your team, this is the response visitors receive.</p><textarea value={form.handoff_message} onChange={(e) => update("handoff_message", e.target.value)} rows={5} className="mt-4 w-full rounded-lg border border-glass-border bg-background px-3 py-2 text-sm"/></div></section>
    <section className="mt-4 space-y-4">{sections.map((section) => <label key={section.key} className="block rounded-2xl border border-glass-border bg-glass p-5"><div className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-semibold">{section.label}</span><span className="text-xs text-foreground/50">{section.hint}</span></div><textarea value={String(form[section.key])} onChange={(e) => update(section.key, e.target.value)} rows={section.rows} className="mt-4 w-full rounded-xl border border-glass-border bg-background px-3 py-3 text-sm leading-6 outline-none focus:border-primary"/></label>)}</section>
    <section className="mt-4 flex items-center justify-between rounded-2xl border border-glass-border bg-glass p-5"><div><div className="font-semibold">Chatbot status</div><p className="mt-1 text-sm text-foreground/60">Turn this on after the chatbot is connected to your website.</p></div><button onClick={() => update("is_live", !form.is_live)} className={`rounded-full px-4 py-2 text-sm font-bold ${form.is_live ? "bg-primary text-white" : "bg-black/10 text-foreground/70"}`}>{form.is_live ? "Live" : "Draft"}</button></section>
  </div></main>;
}
function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="block"><span className="text-sm font-semibold">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-lg border border-glass-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"/></label>; }
