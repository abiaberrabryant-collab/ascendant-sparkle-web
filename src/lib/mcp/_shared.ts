import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/** Per-request Supabase client that acts as the signed-in MCP user (RLS applies). */
export function supabaseForUser(ctx: ToolContext): SupabaseClient {
  const token = ctx.getToken();
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Returns true when the caller has the 'admin' role. Uses user_roles directly under RLS. */
export async function isAdmin(ctx: ToolContext): Promise<boolean> {
  const supa = supabaseForUser(ctx);
  const { data } = await supa
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.getUserId())
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

export function textResult(obj: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] };
}

export function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}
