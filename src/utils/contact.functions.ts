import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { sendLeadNotification } from "@/lib/notify.server";

const InquirySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  source: z.enum(["contact", "audit"]),
  budget: z.string().trim().max(100).nullable().optional(),
  message: z.string().trim().max(5000).nullable().optional(),
  website_url: z.string().trim().url().max(500).or(z.literal("")).nullable().optional(),
});

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InquirySchema.parse(data))
  .handler(async ({ data }) => {
    const { rateLimit, clientIp } = await import("@/lib/rate-limit.server");
    if (!(await rateLimit(`contact:${clientIp(getRequest())}`, 6, 900))) return { error: "Too many submissions. Please try again shortly." };
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await supabase.from("contact_inquiries").insert({
      name: data.name,
      email: data.email,
      source: data.source,
      budget: data.budget ?? null,
      message: data.message ?? null,
      website_url: data.website_url ?? null,
    });
    if (error) return { error: error.message };
    await sendLeadNotification({
      name: data.name,
      email: data.email,
      source: data.source,
      message: data.message ?? null,
      website_url: data.website_url ?? null,
      budget: data.budget ?? null,
    });
    return { ok: true };
  });
