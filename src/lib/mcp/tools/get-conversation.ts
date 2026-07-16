import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, textResult, errorResult } from "../_shared";

export default defineTool({
  name: "get_conversation",
  title: "Get chatbot conversation",
  description: "Return the messages of a single AscendantWeb chatbot conversation by id.",
  inputSchema: {
    conversation_id: z.string().uuid().describe("Conversation id."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ conversation_id }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const supa = supabaseForUser(ctx);
    const { data: convo, error: cErr } = await supa
      .from("chat_conversations")
      .select("id, visitor_name, visitor_email, created_at, updated_at")
      .eq("id", conversation_id)
      .maybeSingle();
    if (cErr) return errorResult(cErr.message);
    if (!convo) return errorResult("Conversation not found");
    const { data: messages, error: mErr } = await supa
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true });
    if (mErr) return errorResult(mErr.message);
    return textResult({ conversation: convo, messages });
  },
});
