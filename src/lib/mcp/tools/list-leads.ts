import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, textResult, errorResult } from "../_shared";

export default defineTool({
  name: "list_leads",
  title: "List captured leads",
  description: "List leads captured by the AscendantWeb chatbot (admin only under RLS).",
  inputSchema: {
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("chat_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return errorResult(error.message);
    return textResult(data);
  },
});
