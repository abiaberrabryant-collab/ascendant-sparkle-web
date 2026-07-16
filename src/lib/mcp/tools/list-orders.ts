import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, isAdmin, textResult, errorResult } from "../_shared";

export default defineTool({
  name: "list_orders",
  title: "List orders",
  description: "List AscendantWeb Stripe orders (admin only).",
  inputSchema: {
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    if (!(await isAdmin(ctx))) return errorResult("Forbidden: admin role required");
    const { data, error } = await supabaseForUser(ctx)
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return errorResult(error.message);
    return textResult(data);
  },
});
