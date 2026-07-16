import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, textResult, errorResult } from "../_shared";

export default defineTool({
  name: "list_conversations",
  title: "List chatbot conversations",
  description: "List AscendantWeb chatbot conversations visible to the signed-in user (admins see all).",
  inputSchema: {
    limit: z.number().int().min(1).max(200).default(50).describe("Max rows to return."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("chat_conversations")
      .select("id, visitor_name, visitor_email, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) return errorResult(error.message);
    return textResult(data);
  },
});
