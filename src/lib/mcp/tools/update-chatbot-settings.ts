import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, isAdmin, textResult, errorResult } from "../_shared";

export default defineTool({
  name: "update_chatbot_settings",
  title: "Update chatbot settings",
  description:
    "Update AscendantWeb chatbot settings (admin only). Only provided fields are changed.",
  inputSchema: {
    enabled: z.boolean().optional(),
    greeting: z.string().min(1).max(500).optional(),
    business_knowledge: z.string().max(50000).optional().describe("Knowledge base text."),
    system_prompt: z.string().min(1).max(8000).optional(),
    brand_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    suggested_prompts: z.array(z.string().min(1).max(120)).max(6).optional(),
    model: z.string().min(1).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (patch, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    if (!(await isAdmin(ctx))) return errorResult("Forbidden: admin role required");
    const updates = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    if (Object.keys(updates).length === 0) return errorResult("No fields to update");
    const { data, error } = await supabaseForUser(ctx)
      .from("chatbot_settings")
      .update(updates)
      .eq("singleton", true)
      .select()
      .maybeSingle();
    if (error) return errorResult(error.message);
    return textResult({ updated: data });
  },
});
