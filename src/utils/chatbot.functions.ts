import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// PUBLIC: read widget config (safe fields only)
export const getPublicChatbotSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const url = process.env.SUPABASE_URL!;
  const supa = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data } = await supa.rpc("get_public_chatbot_settings").maybeSingle();
  return data ?? { enabled: false, greeting: "", suggested_prompts: [], brand_color: "#3b82f6" };
});


// PUBLIC: capture a lead from the widget
const LeadSchema = z.object({
  conversationId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional(),
  budget: z.string().trim().max(80).optional(),
  message: z.string().trim().max(2000).optional(),
});
export const captureChatLead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LeadSchema.parse(d))
  .handler(async ({ data }) => {
    const { rateLimit, clientIp } = await import("@/lib/rate-limit.server");
    if (!(await rateLimit(`legacy-lead:${clientIp(getRequest())}`, 8, 900))) throw new Error("Too many lead submissions. Please try again shortly.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("chat_leads").insert({
      conversation_id: data.conversationId ?? null,
      name: data.name ?? null,
      email: data.email,
      phone: data.phone ?? null,
      budget: data.budget ?? null,
      message: data.message ?? null,
    });
    if (error) throw new Error(error.message);
    if (data.conversationId) {
      await supabaseAdmin
        .from("chat_conversations")
        .update({ visitor_name: data.name ?? null, visitor_email: data.email })
        .eq("id", data.conversationId);
    }
    return { ok: true };
  });

// ADMIN
export const getChatbotSettingsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!role) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("chatbot_settings")
      .select("*")
      .eq("singleton", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const UpdateSchema = z.object({
  enabled: z.boolean(),
  model: z.string().min(1),
  system_prompt: z.string().min(1).max(8000),
  business_knowledge: z.string().max(50000),
  greeting: z.string().min(1).max(500),
  suggested_prompts: z.array(z.string().max(120)).max(6),
  brand_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export const updateChatbotSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!role) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("chatbot_settings")
      .update(data)
      .eq("singleton", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!role) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("chat_conversations")
      .select("id, visitor_name, visitor_email, page_url, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getConversationMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!role) throw new Error("Forbidden");
    const { data: msgs, error } = await context.supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return msgs ?? [];
  });

export const listChatLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!role) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("chat_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
