import { createFileRoute } from "@tanstack/react-router";
import { checkRateLimit, rateLimitResponse } from "@/lib/request-guard.server";

function hostname(value: string) {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function corsHeaders(request: Request, allowedDomains: string[]) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = allowedDomains.map(hostname).filter(Boolean);
  if (!origin || !allowed.includes(hostname(origin))) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export const Route = createFileRoute("/api/public/client-chatbot")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const key = new URL(request.url).searchParams.get("key");
        if (!key || key.length > 200) return new Response(null, { status: 400 });
        const limit = checkRateLimit(request, "chatbot-config", key, 120, 5 * 60_000);
        if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as any;
        const { data } = await db.from("client_chatbots").select("allowed_domains").eq("embed_key", key).maybeSingle();
        const headers = corsHeaders(request, data?.allowed_domains ?? []);
        return new Response(null, { status: headers ? 204 : 403, headers: headers ?? undefined });
      },
      GET: async ({ request }) => {
        const key = new URL(request.url).searchParams.get("key");
        if (!key || key.length > 200) return new Response("Missing chatbot key", { status: 400 });
        const limit = checkRateLimit(request, "chatbot-config", key, 120, 5 * 60_000);
        if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as any;
        const { data: bot } = await db
          .from("client_chatbots")
          .select("business_name, greeting, brand_color, is_live, allowed_domains")
          .eq("embed_key", key)
          .maybeSingle();
        if (!bot?.is_live) return new Response("Chatbot is unavailable", { status: 404 });
        const headers = corsHeaders(request, bot.allowed_domains ?? []);
        if (!headers) return new Response("This domain is not connected to this chatbot", { status: 403 });
        return Response.json({ businessName: bot.business_name, greeting: bot.greeting, brandColor: bot.brand_color }, { headers: { ...headers, "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
      },
    },
  },
});
