import { Suspense, lazy, useCallback, useRef, useState } from "react";
import { MessageCircle, X, Loader2 } from "lucide-react";
import { getPublicChatbotSettings } from "@/utils/chatbot.functions";
import type { ChatConfig } from "./ChatPanel";

const ChatPanel = lazy(() => import("./ChatPanel"));

// Module-level cache: fetch settings at most once per page load, and only
// after the user opens the widget.
let cachedConfig: Promise<ChatConfig> | null = null;
function loadConfig(): Promise<ChatConfig> {
  if (!cachedConfig) {
    cachedConfig = getPublicChatbotSettings().then((c) => c as ChatConfig);
  }
  return cachedConfig;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [disabled, setDisabled] = useState(false);
  const loadingRef = useRef(false);

  const handleOpen = useCallback(async () => {
    if (loadingRef.current) return;
    if (config) {
      setOpen(true);
      return;
    }
    loadingRef.current = true;
    try {
      const c = await loadConfig();
      if (!c?.enabled) {
        setDisabled(true);
        return;
      }
      setConfig(c);
      setOpen(true);
    } catch {
      // silent fail — keep launcher usable, user can retry
    } finally {
      loadingRef.current = false;
    }
  }, [config]);

  if (disabled) return null;

  const brand = config?.brand_color || "#3b82f6";

  return (
    <>
      <button
        onClick={() => (open ? setOpen(false) : void handleOpen())}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-5 right-5 z-[100] flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95"
        style={{ background: brand, color: "white" }}
      >
        {open ? (
          <X size={22} />
        ) : loadingRef.current && !config ? (
          <Loader2 size={22} className="animate-spin" />
        ) : (
          <MessageCircle size={22} />
        )}
      </button>

      {open && config && (
        <Suspense fallback={null}>
          <ChatPanel config={config} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
