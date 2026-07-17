import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const MetricSchema = z.object({
  route: z.string().max(200),
  metric: z.enum(["LCP", "INP", "CLS", "TTFB", "FCP"]),
  value: z.number().finite().min(0).max(1_000_000),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
  navigation_type: z.string().max(40).optional(),
});

const BodySchema = z.object({
  metrics: z.array(MetricSchema).min(1).max(20),
});

export const Route = createFileRoute("/api/public/perf")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
          return new Response("Bad payload", { status: 400 });
        }
        const ua = request.headers.get("user-agent")?.slice(0, 500) ?? null;
        const rows = parsed.data.metrics.map((m) => ({
          route: m.route,
          metric: m.metric,
          value: m.value,
          rating: m.rating ?? null,
          navigation_type: m.navigation_type ?? null,
          user_agent: ua,
        }));

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("perf_metrics").insert(rows);
        } catch {
          // never fail the beacon
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
