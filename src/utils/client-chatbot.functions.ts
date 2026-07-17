import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Settings = z.object({
  business_name: z.string().trim().max(120), website_url: z.string().trim().max(500),
  business_description: z.string().trim().max(8000), services: z.string().trim().max(8000),
  hours_and_contact: z.string().trim().max(4000), faq_and_policies: z.string().trim().max(12000),
  boundaries: z.string().trim().max(8000), handoff_message: z.string().trim().max(1000),
  greeting: z.string().trim().max(500), tone: z.string().trim().max(160),
  brand_color: z.string().regex(/^#[0-9a-fA-F]{6}$/), lead_questions: z.string().trim().max(4000), is_live: z.boolean(),
  allowed_domains: z.array(z.string().trim().min(1).max(255)).max(20),
});

async function hasAccess(db: any, userId: string) {
  const [{ data: role }, { data: subscription }] = await Promise.all([
    db.from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle(),
    db.from("subscriptions").select("id").eq("user_id", userId).in("status", ["active", "trialing"]).limit(1).maybeSingle(),
  ]);
  return Boolean(role || subscription);
}

async function getOrCreateOrganization(db: any, userId: string) {
  const { data: existing } = await db.from("organizations").select("id").eq("owner_user_id", userId).maybeSingle();
  if (existing) return existing.id as string;
  const { data: created, error } = await db.from("organizations").insert({ owner_user_id: userId, name: "My business" }).select("id").single();
  if (error || !created) throw new Error(error?.message ?? "Could not create your organization");
  await db.from("organization_memberships").insert({ organization_id: created.id, user_id: userId, role: "owner" });
  return created.id as string;
}

export const getMyChatbot = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const db = context.supabase as any;
  if (!(await hasAccess(db, context.userId))) return { eligible: false, chatbot: null };
  const organizationId = await getOrCreateOrganization(db, context.userId);
  const { data, error } = await db.from("client_chatbots").select("*").eq("organization_id", organizationId).maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return { eligible: true, chatbot: data };
  const { data: created, error: createError } = await db.from("client_chatbots").insert({ owner_user_id: context.userId, organization_id: organizationId }).select("*").single();
  if (createError) throw new Error(createError.message);
  return { eligible: true, chatbot: created };
});

export const saveMyChatbot = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data: unknown) => Settings.parse(data)).handler(async ({ data, context }) => {
  const db = context.supabase as any;
  if (!(await hasAccess(db, context.userId))) throw new Error("An active chatbot plan is required.");
  const organizationId = await getOrCreateOrganization(db, context.userId);
  const { error } = await db.from("client_chatbots").update(data).eq("organization_id", organizationId);
  if (error) throw new Error(error.message);
  await db.from("audit_logs").insert({ organization_id: organizationId, actor_user_id: context.userId, action: "chatbot.updated", entity_type: "client_chatbot" });
  return { ok: true };
});
