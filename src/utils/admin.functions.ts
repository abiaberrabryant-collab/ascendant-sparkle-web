import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX = 100;

function pageRange(input?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(Math.max(input?.pageSize ?? PAGE_SIZE_DEFAULT, 1), PAGE_SIZE_MAX);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to, pageSize, page };
}

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const listAllOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { page?: number; pageSize?: number } | undefined) => data ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { from, to, pageSize, page } = pageRange(data);
    const { data: rows, error, count } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, tier, amount_cents, currency, status, environment, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page, pageSize };
  });

export const listAllSubscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { page?: number; pageSize?: number } | undefined) => data ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { from, to, pageSize, page } = pageRange(data);
    const cols =
      "id, user_id, status, price_id, cancel_at_period_end, current_period_end, environment, created_at";
    const withProfiles = await supabaseAdmin
      .from("subscriptions")
      .select(`${cols}, profiles:user_id(email, full_name)`, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (withProfiles.error) {
      const fallback = await supabaseAdmin
        .from("subscriptions")
        .select(cols, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
      if (fallback.error) throw new Error(fallback.error.message);
      return { rows: fallback.data ?? [], total: fallback.count ?? 0, page, pageSize };
    }
    return { rows: withProfiles.data ?? [], total: withProfiles.count ?? 0, page, pageSize };
  });

export const listAllInquiries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { page?: number; pageSize?: number } | undefined) => data ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { from, to, pageSize, page } = pageRange(data);
    const { data: rows, error, count } = await supabaseAdmin
      .from("contact_inquiries")
      .select("id, name, email, company, phone, message, status, source, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page, pageSize };
  });

export const updateInquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "new" | "contacted" | "archived" }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("contact_inquiries")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
