import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listConversations from "./tools/list-conversations";
import getConversation from "./tools/get-conversation";
import listLeads from "./tools/list-leads";
import getChatbotSettings from "./tools/get-chatbot-settings";
import updateChatbotSettings from "./tools/update-chatbot-settings";
import listOrders from "./tools/list-orders";
import listSubscriptions from "./tools/list-subscriptions";

// Use the direct supabase.co issuer (mcp-js discovery rejects the .lovable.cloud proxy).
// VITE_SUPABASE_PROJECT_ID is inlined at build time; fallback keeps the issuer well-formed
// during the throwaway manifest extract eval.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ascendantweb-mcp",
  title: "AscendantWeb",
  version: "0.1.0",
  instructions:
    "Tools for the AscendantWeb site: read chatbot conversations and leads, view and update chatbot settings (admin), and inspect orders/subscriptions (admin). All calls act as the signed-in user under RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listConversations,
    getConversation,
    listLeads,
    getChatbotSettings,
    updateChatbotSettings,
    listOrders,
    listSubscriptions,
  ],
});
