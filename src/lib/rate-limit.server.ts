/**
 * Server-only rate limiting backed by a Supabase fixed-window counter.
 * Protects the public AI endpoints (demo generator, chatbot chat) from abuse
 * and runaway cost.
 */

/**
 * Returns true when the request is allowed. Fails CLOSED when the counter cannot
 * be reached so a database outage cannot become an uncapped AI-cost attack.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
    }).rpc("consume_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}

/** Best-effort client IP from common proxy headers. */
export function clientIp(request: Request): string {
  // Prefer the address asserted by the platform proxy. Forwarded headers are
  // client-controlled unless the deployment proxy overwrites them.
  const platformIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip");
  if (platformIp) return platformIp.trim().slice(0, 100);
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim().slice(0, 100);
  return "unknown";
}
