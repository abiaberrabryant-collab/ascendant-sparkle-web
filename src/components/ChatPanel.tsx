import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { captureChatLead } from "@/utils/chatbot.functions";

export type ChatConfig = {
  enabled: boolean;
  greeting: string;
  suggested_prompts: string[];
  brand_color: string;
};

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  config: ChatConfig;
  onClose: () => void;
}

export default function ChatPanel({ config, onClose }: Props) {
  const [messages, setMessages] = useState<Msg[]>(
    config.greeting ? [{ role: "assistant", content: config.greeting }] : [],
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadSent, setLeadSent] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const brand = config.brand_color || "#3b82f6";

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const next = [...messages, { role: "user" as const, content: text.trim() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          pageUrl: typeof window !== "undefined" ? window.location.href : null,
          messages: next.filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0),
        }),
      });
      const cid = res.headers.get("X-Conversation-Id");
      if (cid) setConvId(cid);
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
      if (next.length >= 4 && !leadSent && !showLeadForm) setShowLeadForm(true);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Something went wrong. Try again or email us at hello@ascendantweb.org." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await captureChatLead({
        data: { conversationId: convId, name: leadName || undefined, email: leadEmail },
      });
      setLeadSent(true);
      setShowLeadForm(false);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Got it — we'll be in touch shortly. Anything else you want to ask?" },
      ]);
    } catch {}
  };

  return (
    <div
      className="fixed bottom-24 right-5 z-[100] flex h-[560px] w-[calc(100vw-2.5rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white/90 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4"
      role="dialog"
      aria-label="Chat with AscendantWeb"
    >
      <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: brand }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <MessageCircle size={16} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">AscendantWeb Assistant</div>
          <div className="text-[11px] opacity-80">We usually reply in a few seconds</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="rounded-full p-1 hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-white to-slate-50 px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2 text-sm text-white"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-900"
              }
              style={m.role === "user" ? { background: brand } : undefined}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:my-2">
                  <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-500">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
              </span>
            </div>
          </div>
        )}

        {messages.length <= 1 && config.suggested_prompts?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {config.suggested_prompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {showLeadForm && !leadSent && (
          <form onSubmit={submitLead} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
            <div className="text-xs font-semibold text-slate-700">Want us to follow up?</div>
            <input
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="Name (optional)"
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-slate-400"
            />
            <input
              required
              type="email"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-slate-400"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-md py-1.5 text-xs font-semibold text-white"
                style={{ background: brand }}
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => setShowLeadForm(false)}
                className="rounded-md border border-slate-200 px-3 text-xs text-slate-600"
              >
                Not now
              </button>
            </div>
          </form>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm outline-none focus:bg-slate-50"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-50"
          style={{ background: brand }}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
