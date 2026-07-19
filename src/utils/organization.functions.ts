import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OrganizationInput = z.object({
  name: z.string().trim().min(2).max(120),
  website_url: z.string().trim().max(500),
  industry: z.string().trim().max(120),
  service_area: z.string().trim().max(500),
});

const LeadUpdateInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "qualified", "won", "closed"]),
  follow_up_note: z.string().trim().max(2000),
});

async function getOwnedChatbot(db: any, userId: string) {
  const { data: organization } = await db
    .from("organizations")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (!organization) return null;
  const { data: chatbot } = await db
    .from("client_chatbots")
    .select("id, business_name, website_url, is_live, allowed_domains, updated_at")
    .eq("organization_id", organization.id)
    .maybeSingle();
  return chatbot ?? null;
}

export const getMyOrganization = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const db = context.supabase as any;
  const { data } = await db.from("organizations").select("*").eq("owner_user_id", context.userId).maybeSingle();
  return data ?? null;
});

export const saveMyOrganization = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data: unknown) => OrganizationInput.parse(data)).handler(async ({ data, context }) => {
  const db = context.supabase as any;
  const { data: existing } = await db.from("organizations").select("id").eq("owner_user_id", context.userId).maybeSingle();
  if (existing) {
    const { error } = await db.from("organizations").update(data).eq("id", existing.id);
    if (error) throw new Error(error.message);
    await db.rpc("log_audit_event", { _organization_id: existing.id, _action: "organization.updated", _entity_type: "organization", _entity_id: existing.id });
    return { id: existing.id };
  }
  const { data: created, error } = await db.from("organizations").insert({ ...data, owner_user_id: context.userId }).select("id").single();
  if (error || !created) throw new Error(error?.message ?? "Could not create organization");
  await db.from("organization_memberships").insert({ organization_id: created.id, user_id: context.userId, role: "owner" });
  await db.from("audit_logs").insert({ organization_id: created.id, actor_user_id: context.userId, action: "organization.created", entity_type: "organization", entity_id: created.id });
  return { id: created.id };
});

export const getOwnerWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as any;
    const chatbot = await getOwnedChatbot(db, context.userId);
    if (!chatbot) return { chatbot: null, leads: [], conversations: [] };

    const [{ data: leads, error: leadsError }, { data: conversations, error: conversationsError }] = await Promise.all([
      db
        .from("chat_leads")
        .select("id, name, email, phone, budget, message, status, follow_up_note, last_contacted_at, created_at")
        .eq("chatbot_id", chatbot.id)
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("chat_conversations")
        .select("id, visitor_name, visitor_email, page_url, created_at, updated_at")
        .eq("chatbot_id", chatbot.id)
        .order("updated_at", { ascending: false })
        .limit(50),
    ]);
    if (leadsError) throw new Error(leadsError.message);
    if (conversationsError) throw new Error(conversationsError.message);
    return { chatbot, leads: leads ?? [], conversations: conversations ?? [] };
  });

export const updateOwnerLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => LeadUpdateInput.parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const chatbot = await getOwnedChatbot(db, context.userId);
    if (!chatbot) throw new Error("No chatbot workspace was found.");
    const { error } = await db
      .from("chat_leads")
      .update({
        status: data.status,
        follow_up_note: data.follow_up_note,
        last_contacted_at: data.status === "contacted" ? new Date().toISOString() : undefined,
      })
      .eq("id", data.id)
      .eq("chatbot_id", chatbot.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
