import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type InquiryInput = {
  name: string;
  email: string;
  source: "contact" | "audit";
  budget?: string | null;
  message?: string | null;
  website_url?: string | null;
};

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((data: InquiryInput) => {
    if (!data.name || data.name.length > 200) throw new Error("Invalid name");
    if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) throw new Error("Invalid email");
    if (data.source !== "contact" && data.source !== "audit") throw new Error("Invalid source");
    if (data.message && data.message.length > 5000) throw new Error("Message too long");
    if (data.website_url && data.website_url.length > 500) throw new Error("URL too long");
    if (data.budget && data.budget.length > 100) throw new Error("Budget too long");
    return data;
  })
  .handler(async ({ data }) => {
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
    return { ok: true };
  });
