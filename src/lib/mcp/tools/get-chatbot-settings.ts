import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, isAdmin, textResult, errorResult } from "../_shared";

export default defineTool({
  name: "get_chatbot_settings",
  title: "Get chatbot settings",
  description: "Return the full AscendantWeb chatbot settings row (admin only), including knowledge base.",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    if (!(await isAdmin(ctx))) return errorResult("Forbidden: admin role required");
    const { data, error } = await supabaseForUser(ctx)
      .from("chatbot_settings")
      .select("*")
      .eq("singleton", true)
      .maybeSingle();
    if (error) return errorResult(error.message);
    return textResult(data);
  },
});
