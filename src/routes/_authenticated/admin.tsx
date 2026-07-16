import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  listAllOrders,
  listAllSubscriptions,
  listAllInquiries,
  updateInquiryStatus,
} from "@/utils/admin.functions";
import {
  getChatbotSettingsAdmin,
  updateChatbotSettings,
  listConversations,
  getConversationMessages,
  listChatLeads,
} from "@/utils/chatbot.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Admin — AscendantWeb" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

type Tab = "orders" | "subscriptions" | "inquiries" | "chatbot" | "conversations" | "chat-leads";

function AdminPage() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate({ to: "/account", replace: true });
    }
  }, [isLoading, isAdmin, navigate]);

  const load = () => {
    setLoading(true);
    Promise.all([listAllOrders(), listAllSubscriptions(), listAllInquiries()])
      .then(([o, s, i]) => {
        setOrders(o);
        setSubs(s);
        setInquiries(i);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const mrrCents = subs
    .filter((s: any) => s.status === "active" || s.status === "trialing")
    .reduce((sum: number, s: any) => {
      const p = s.price_id || "";
      if (p === "basic_monthly") return sum + 15000;
      if (p === "advanced_monthly") return sum + 20000;
      if (p === "ascendant_monthly") return sum + 25000;
      return sum;
    }, 0);

  const activeSubs = subs.filter(
    (s: any) => s.status === "active" || s.status === "trialing",
  ).length;
  const newLeads = inquiries.filter((i: any) => i.status === "new").length;

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/account" className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            ← My account
          </Link>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight">Admin</h1>
        <p className="mt-2 text-foreground/60">Everything happening on AscendantWeb.</p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="MRR" value={`$${(mrrCents / 100).toFixed(0)}`} />
          <Stat label="Active subs" value={activeSubs} />
          <Stat label="Total orders" value={orders.length} />
          <Stat label="New leads" value={newLeads} />
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-glass-border">
          {(["orders", "subscriptions", "inquiries", "chatbot", "conversations", "chat-leads"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize ${
                tab === t
                  ? "border-b-2 border-primary text-foreground"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {t.replace("-", " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 text-foreground/60">Loading…</div>
        ) : error ? (
          <div className="mt-8 text-red-400">{error}</div>
        ) : (
          <div className="mt-6">
            {tab === "orders" && <div className="overflow-x-auto rounded-2xl border border-glass-border bg-glass"><OrdersTable rows={orders} /></div>}
            {tab === "subscriptions" && <div className="overflow-x-auto rounded-2xl border border-glass-border bg-glass"><SubsTable rows={subs} /></div>}
            {tab === "inquiries" && (
              <div className="overflow-x-auto rounded-2xl border border-glass-border bg-glass">
                <InquiriesTable
                  rows={inquiries}
                  onUpdate={async (id, status) => {
                    await updateInquiryStatus({ data: { id, status } });
                    load();
                  }}
                />
              </div>
            )}
            {tab === "chatbot" && <ChatbotSettingsPanel />}
            {tab === "conversations" && <ConversationsPanel />}
            {tab === "chat-leads" && <ChatLeadsPanel />}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-glass-border bg-glass p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/60">
        {label}
      </div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

function OrdersTable({ rows }: { rows: any[] }) {
  if (!rows.length) return <Empty label="No orders yet." />;
  return (
    <table className="w-full text-sm">
      <thead className="bg-white/5 text-left">
        <tr>
          <Th>Date</Th>
          <Th>Email</Th>
          <Th>Tier</Th>
          <Th>Amount</Th>
          <Th>Status</Th>
          <Th>Env</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => (
          <tr key={o.id} className="border-t border-glass-border/60">
            <Td>{new Date(o.created_at).toLocaleString()}</Td>
            <Td>{o.email ?? "—"}</Td>
            <Td className="capitalize">{o.tier}</Td>
            <Td>
              ${(o.amount_cents / 100).toFixed(2)} {o.currency?.toUpperCase()}
            </Td>
            <Td>{o.status}</Td>
            <Td>{o.environment}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SubsTable({ rows }: { rows: any[] }) {
  if (!rows.length) return <Empty label="No subscriptions yet." />;
  return (
    <table className="w-full text-sm">
      <thead className="bg-white/5 text-left">
        <tr>
          <Th>Created</Th>
          <Th>Customer</Th>
          <Th>Tier</Th>
          <Th>Status</Th>
          <Th>Renews</Th>
          <Th>Env</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.id} className="border-t border-glass-border/60">
            <Td>{new Date(s.created_at).toLocaleDateString()}</Td>
            <Td>{s.profiles?.email ?? s.stripe_customer_id?.slice(0, 14) ?? "—"}</Td>
            <Td className="capitalize">{(s.price_id ?? "").replace("_monthly", "")}</Td>
            <Td>
              {s.status}
              {s.cancel_at_period_end ? " (cancels)" : ""}
            </Td>
            <Td>
              {s.current_period_end
                ? new Date(s.current_period_end).toLocaleDateString()
                : "—"}
            </Td>
            <Td>{s.environment}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InquiriesTable({
  rows,
  onUpdate,
}: {
  rows: any[];
  onUpdate: (id: string, status: "new" | "contacted" | "archived") => void;
}) {
  if (!rows.length) return <Empty label="No inquiries yet." />;
  return (
    <table className="w-full text-sm">
      <thead className="bg-white/5 text-left">
        <tr>
          <Th>Date</Th>
          <Th>Source</Th>
          <Th>Name</Th>
          <Th>Email</Th>
          <Th>Detail</Th>
          <Th>Status</Th>
          <Th>Actions</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((i) => (
          <tr key={i.id} className="border-t border-glass-border/60">
            <Td>{new Date(i.created_at).toLocaleDateString()}</Td>
            <Td className="capitalize">{i.source}</Td>
            <Td>{i.name}</Td>
            <Td>{i.email}</Td>
            <Td className="max-w-xs">
              {i.budget && <div className="text-xs text-foreground/50">{i.budget}</div>}
              {i.website_url && (
                <a
                  href={i.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline"
                >
                  {i.website_url}
                </a>
              )}
              {i.message && <div className="mt-1 line-clamp-2">{i.message}</div>}
            </Td>
            <Td>{i.status}</Td>
            <Td>
              <div className="flex gap-1">
                {i.status !== "contacted" && (
                  <button
                    onClick={() => onUpdate(i.id, "contacted")}
                    className="rounded border border-glass-border px-2 py-1 text-xs hover:bg-white/5"
                  >
                    ✓
                  </button>
                )}
                {i.status !== "archived" && (
                  <button
                    onClick={() => onUpdate(i.id, "archived")}
                    className="rounded border border-glass-border px-2 py-1 text-xs hover:bg-white/5"
                  >
                    Archive
                  </button>
                )}
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-foreground/60">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
function Empty({ label }: { label: string }) {
  return <div className="p-10 text-center text-foreground/50">{label}</div>;
}

function ChatbotSettingsPanel() {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [promptsRaw, setPromptsRaw] = useState("");

  useEffect(() => {
    getChatbotSettingsAdmin().then((s: any) => {
      setSettings(s);
      setPromptsRaw((s?.suggested_prompts ?? []).join("\n"));
    });
  }, []);

  if (!settings) return <div className="text-foreground/60">Loading…</div>;

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await updateChatbotSettings({
        data: {
          enabled: settings.enabled,
          model: settings.model,
          system_prompt: settings.system_prompt,
          business_knowledge: settings.business_knowledge,
          greeting: settings.greeting,
          brand_color: settings.brand_color,
          suggested_prompts: promptsRaw
            .split("\n")
            .map((p) => p.trim())
            .filter(Boolean)
            .slice(0, 6),
        },
      });
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, node: React.ReactNode) => (
    <label className="block">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-foreground/60">{label}</div>
      {node}
    </label>
  );
  const inputCls =
    "w-full rounded-md border border-glass-border bg-white/50 px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-5 rounded-2xl border border-glass-border bg-glass p-6">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={!!settings.enabled}
          onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
        />
        <span className="text-sm">Chatbot enabled on site</span>
      </div>

      {field(
        "Model",
        <select
          value={settings.model}
          onChange={(e) => setSettings({ ...settings, model: e.target.value })}
          className={inputCls}
        >
          <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (fast, cheap)</option>
          <option value="google/gemini-2.5-pro">Gemini 2.5 Pro (smart)</option>
          <option value="google/gemini-3.5-flash">Gemini 3.5 Flash</option>
          <option value="openai/gpt-5.4-mini">GPT-5.4 mini</option>
          <option value="openai/gpt-5.5">GPT-5.5 (best)</option>
        </select>,
      )}
      {field(
        "Greeting (first message visitors see)",
        <textarea
          rows={2}
          className={inputCls}
          value={settings.greeting}
          onChange={(e) => setSettings({ ...settings, greeting: e.target.value })}
        />,
      )}
      {field(
        "Suggested prompts (one per line, max 6)",
        <textarea
          rows={4}
          className={inputCls}
          value={promptsRaw}
          onChange={(e) => setPromptsRaw(e.target.value)}
        />,
      )}
      {field(
        "System prompt (personality + rules)",
        <textarea
          rows={6}
          className={inputCls}
          value={settings.system_prompt}
          onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
        />,
      )}
      {field(
        "Business knowledge (services, pricing, FAQs — the bot uses this to answer)",
        <textarea
          rows={12}
          className={inputCls}
          value={settings.business_knowledge}
          onChange={(e) => setSettings({ ...settings, business_knowledge: e.target.value })}
          placeholder="Paste everything: services, packages, prices, timelines, refund policy, FAQs, past client examples…"
        />,
      )}
      {field(
        "Brand color",
        <input
          type="color"
          value={settings.brand_color}
          onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
          className="h-10 w-20 rounded border border-glass-border"
        />,
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {msg && <span className="text-sm text-foreground/60">{msg}</span>}
      </div>
    </div>
  );
}

function ConversationsPanel() {
  const [convs, setConvs] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);

  useEffect(() => {
    listConversations().then(setConvs);
  }, []);
  useEffect(() => {
    if (selected) getConversationMessages({ data: { id: selected } }).then(setMsgs);
  }, [selected]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
      <div className="max-h-[600px] overflow-y-auto rounded-2xl border border-glass-border bg-glass">
        {convs.length === 0 ? (
          <Empty label="No conversations yet." />
        ) : (
          convs.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`block w-full border-b border-glass-border/60 px-4 py-3 text-left text-sm hover:bg-white/5 ${
                selected === c.id ? "bg-white/10" : ""
              }`}
            >
              <div className="font-semibold">{c.visitor_email ?? c.visitor_name ?? "Anonymous visitor"}</div>
              <div className="text-xs text-foreground/50">{new Date(c.updated_at).toLocaleString()}</div>
              {c.page_url && <div className="mt-1 truncate text-[10px] text-foreground/40">{c.page_url}</div>}
            </button>
          ))
        )}
      </div>
      <div className="max-h-[600px] overflow-y-auto rounded-2xl border border-glass-border bg-glass p-4">
        {!selected ? (
          <div className="text-foreground/50">Select a conversation.</div>
        ) : msgs.length === 0 ? (
          <div className="text-foreground/50">Loading…</div>
        ) : (
          <div className="space-y-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-sm ${
                  m.role === "user" ? "ml-auto max-w-[80%] bg-primary/10" : "mr-auto max-w-[85%] bg-white/5"
                }`}
              >
                <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-foreground/40">
                  {m.role}
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatLeadsPanel() {
  const [leads, setLeads] = useState<any[]>([]);
  useEffect(() => {
    listChatLeads().then(setLeads);
  }, []);
  if (!leads.length) return <div className="rounded-2xl border border-glass-border bg-glass"><Empty label="No chatbot leads yet." /></div>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-glass-border bg-glass">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-left">
          <tr>
            <Th>Date</Th>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Phone</Th>
            <Th>Budget</Th>
            <Th>Message</Th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t border-glass-border/60">
              <Td>{new Date(l.created_at).toLocaleDateString()}</Td>
              <Td>{l.name ?? "—"}</Td>
              <Td>{l.email}</Td>
              <Td>{l.phone ?? "—"}</Td>
              <Td>{l.budget ?? "—"}</Td>
              <Td className="max-w-xs">{l.message ?? "—"}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
