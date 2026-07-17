import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatBody = {
  key?: string; conversationId?: string | null; pageUrl?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  lead?: { name?: string; email?: string; phone?: string; message?: string };
};

function host(value: string) {
  try { return new URL(value).hostname.toLowerCase(); } catch { return ""; }
}
function cors(request: Request, domains: string[]) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = domains.map((domain) => host(domain.includes("://") ? domain : `https://${domain}`));
  if (!origin || !allowed.includes(host(origin))) return null;
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Expose-Headers": "X-Conversation-Id", Vary: "Origin" };
}

export const Route = createFileRoute("/api/public/client-chat")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const key = new URL(request.url).searchParams.get("key");
        if (!key) return new Response(null, { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as any;
        const { data } = await db.from("client_chatbots").select("allowed_domains").eq("embed_key", key).maybeSingle();
        const headers = cors(request, data?.allowed_domains ?? []);
        return new Response(null, { status: headers ? 204 : 403, headers: headers ?? undefined });
      },
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        body.key ??= new URL(request.url).searchParams.get("key") ?? undefined;
        if (!body.key || (!Array.isArray(body.messages) && !body.lead) || (body.messages && (body.messages.length === 0 || body.messages.length > 20))) return new Response("Invalid chat request", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as any;
        const { data: bot } = await db
          .from("client_chatbots")
          .select("id, business_name, business_description, services, hours_and_contact, faq_and_policies, boundaries, handoff_message, greeting, tone, lead_questions, model, is_live, allowed_domains")
          .eq("embed_key", body.key)
          .maybeSingle();
        if (!bot?.is_live) return new Response("Chatbot is unavailable", { status: 404 });
        const headers = cors(request, bot.allowed_domains ?? []);
        if (!headers) return new Response("This domain is not connected to this chatbot", { status: 403 });

        if (body.lead) {
          const email = String(body.lead.email ?? "").trim().slice(0, 255);
          if (!/^\S+@\S+\.\S+$/.test(email)) return new Response("A valid email is required", { status: 400, headers });
          let leadConversationId = body.conversationId ?? null;
          if (leadConversationId) {
            const { data: existing } = await db.from("chat_conversations").select("id").eq("id", leadConversationId).eq("chatbot_id", bot.id).maybeSingle();
            if (!existing) return new Response("Invalid conversation", { status: 400, headers });
          } else {
            const { data: created, error } = await db.from("chat_conversations").insert({ chatbot_id: bot.id, page_url: body.pageUrl?.slice(0, 2000) ?? null }).select("id").single();
            if (error || !created) return new Response("Could not start conversation", { status: 500, headers });
            leadConversationId = created.id;
          }
          const { error } = await db.from("chat_leads").insert({
            chatbot_id: bot.id, conversation_id: leadConversationId, name: String(body.lead.name ?? "").trim().slice(0, 120) || null,
            email, phone: String(body.lead.phone ?? "").trim().slice(0, 40) || null,
            message: String(body.lead.message ?? "").trim().slice(0, 2000) || null,
          });
          if (error) return new Response("Could not save your details", { status: 500, headers });
          await db.from("chat_conversations").update({ visitor_name: String(body.lead.name ?? "").trim().slice(0, 120) || null, visitor_email: email }).eq("id", leadConversationId);
          return Response.json({ ok: true, conversationId: leadConversationId }, { headers });
        }

        const sanitized = body.messages!.map((message) => ({ role: message.role, content: String(message.content).slice(0, 4000) }));
        let conversationId = body.conversationId ?? null;
        if (conversationId) {
          const { data: existing } = await db.from("chat_conversations").select("id").eq("id", conversationId).eq("chatbot_id", bot.id).maybeSingle();
          if (!existing) return new Response("Invalid conversation", { status: 400, headers });
        } else {
          const { data: created, error } = await db.from("chat_conversations").insert({ chatbot_id: bot.id, page_url: body.pageUrl?.slice(0, 2000) ?? null }).select("id").single();
          if (error || !created) return new Response("Could not start conversation", { status: 500, headers });
          conversationId = created.id;
        }
        const latestUser = [...sanitized].reverse().find((message) => message.role === "user");
        if (latestUser) await db.from("chat_messages").insert({ conversation_id: conversationId, role: "user", content: latestUser.content });

        const system = `You are the helpful website assistant for ${bot.business_name}. Tone: ${bot.tone}.\n\nBusiness: ${bot.business_description}\n\nServices: ${bot.services}\n\nHours and contact: ${bot.hours_and_contact}\n\nFAQs and policies: ${bot.faq_and_policies}\n\nBoundaries: ${bot.boundaries}\n\nHandoff: ${bot.handoff_message}\n\nLead questions: ${bot.lead_questions}\n\nNever invent details. Be concise, friendly, and encourage a human handoff when needed.`;
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Chat service is not configured", { status: 500, headers });
        const result = streamText({
          model: createLovableAiGatewayProvider(key)(bot.model || "google/gemini-2.5-flash"),
          messages: [{ role: "system", content: system }, ...sanitized] as ModelMessage[],
          onFinish: async ({ text }) => {
            await db.from("chat_messages").insert({ conversation_id: conversationId, role: "assistant", content: text });
            await db.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
          },
        });
        const response = result.toTextStreamResponse();
        const finalHeaders = new Headers(response.headers);
        Object.entries(headers).forEach(([name, value]) => finalHeaders.set(name, value));
        finalHeaders.set("X-Conversation-Id", conversationId);
        return new Response(response.body, { status: response.status, headers: finalHeaders });
      },
    },
  },
});
