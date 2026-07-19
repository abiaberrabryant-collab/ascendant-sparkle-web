import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { readCappedJson } from "@/lib/request-guard.server";

const ChatBodySchema = z.object({
  conversationId: z.string().uuid().nullable().optional(),
  pageUrl: z.string().max(2000).nullable().optional(),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).min(1).max(20),
});

export const Route = createFileRoute("/api/public/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: z.infer<typeof ChatBodySchema>;
        try {
          body = ChatBodySchema.parse(await readCappedJson<unknown>(request, 120_000));
        } catch {
          return new Response("messages required", { status: 400 });
        }
        const { rateLimit, clientIp } = await import("@/lib/rate-limit.server");
        if (!(await rateLimit(`legacy-chat:${clientIp(request)}`, 20, 60))) {
          return new Response("Too many requests. Please slow down.", { status: 429 });
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

        const messages: ModelMessage[] = body.messages.map(
          (m) => ({ role: m.role, content: m.content }) as ModelMessage,
        );

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway(settings.model || "google/gemini-2.5-flash");

        const result = streamText({
          model,
          system: systemPrompt,
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
        headers.set("Cache-Control", "no-store");
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      },
    },
  },
});
