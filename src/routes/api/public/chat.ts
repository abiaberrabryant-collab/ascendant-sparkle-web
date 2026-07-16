import { createFileRoute } from "@tanstack/react-router";
import { streamText, type CoreMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatBody = {
  conversationId?: string | null;
  pageUrl?: string | null;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
};

export const Route = createFileRoute("/api/public/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        if (!Array.isArray(body.messages) || body.messages.length === 0) {
          return new Response("messages required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Load settings
        const { data: settings } = await supabaseAdmin
          .from("chatbot_settings")
          .select("enabled, model, system_prompt, business_knowledge")
          .eq("singleton", true)
          .maybeSingle();

        if (!settings?.enabled) {
          return new Response("Chatbot is disabled", { status: 503 });
        }

        // Ensure conversation
        let conversationId = body.conversationId ?? null;
        if (!conversationId) {
          const { data: conv, error } = await supabaseAdmin
            .from("chat_conversations")
            .insert({ page_url: body.pageUrl ?? null })
            .select("id")
            .single();
          if (error || !conv) return new Response("Could not create conversation", { status: 500 });
          conversationId = conv.id;
        }

        // Persist the latest user message
        const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
        if (lastUser) {
          await supabaseAdmin.from("chat_messages").insert({
            conversation_id: conversationId,
            role: "user",
            content: lastUser.content.slice(0, 8000),
          });
        }

        const systemPrompt = [
          settings.system_prompt,
          settings.business_knowledge
            ? `\n\n--- BUSINESS KNOWLEDGE ---\n${settings.business_knowledge}\n--- END KNOWLEDGE ---`
            : "",
          `\n\nRules: Be concise, warm, and helpful. If you don't know something, say so — never invent facts. If the visitor shows buying intent, ask for their name and email so a human can follow up. Use the /contact page for anything you can't handle.`,
        ].join("");

        const messages: CoreMessage[] = [
          { role: "system", content: systemPrompt },
          ...body.messages.map((m) => ({ role: m.role, content: m.content }) as CoreMessage),
        ];

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway(settings.model || "google/gemini-2.5-flash");

        const result = streamText({
          model,
          messages,
          onFinish: async ({ text }) => {
            await supabaseAdmin.from("chat_messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: text,
            });
            await supabaseAdmin
              .from("chat_conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversationId);
          },
        });

        const response = result.toTextStreamResponse();
        const headers = new Headers(response.headers);
        headers.set("X-Conversation-Id", conversationId);
        headers.set("Access-Control-Expose-Headers", "X-Conversation-Id");
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      },
    },
  },
});
