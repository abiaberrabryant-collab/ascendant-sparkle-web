import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OrganizationInput = z.object({
  name: z.string().trim().min(2).max(120),
  website_url: z.string().trim().max(500),
  industry: z.string().trim().max(120),
  service_area: z.string().trim().max(500),
});

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
    await db.from("audit_logs").insert({ organization_id: existing.id, actor_user_id: context.userId, action: "organization.updated", entity_type: "organization", entity_id: existing.id });
    return { id: existing.id };
  }
  const { data: created, error } = await db.from("organizations").insert({ ...data, owner_user_id: context.userId }).select("id").single();
  if (error || !created) throw new Error(error?.message ?? "Could not create organization");
  await db.from("organization_memberships").insert({ organization_id: created.id, user_id: context.userId, role: "owner" });
  await db.from("audit_logs").insert({ organization_id: created.id, actor_user_id: context.userId, action: "organization.created", entity_type: "organization", entity_id: created.id });
  return { id: created.id };
});
