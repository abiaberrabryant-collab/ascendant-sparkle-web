import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { readCappedText } from "@/lib/safe-fetch.server";

const ShowcaseTemplateSchema = z.enum(["auto", "electrical", "plumbing", "law", "restaurant", "realestate"]);
const Input = z.object({ website_url: z.string().url().max(500), template: ShowcaseTemplateSchema.default("auto") });
const DemoSchema = z.object({
  businessName: z.string().min(1).max(100),
  eyebrow: z.string().min(1).max(90),
  headline: z.string().min(1).max(130),
  subheadline: z.string().min(1).max(280),
  primaryCta: z.string().min(1).max(40),
  secondaryCta: z.string().min(1).max(40),
  services: z.array(z.object({ title: z.string().min(1).max(70), description: z.string().min(1).max(150) })).min(3).max(3),
  proof: z.array(z.string().min(1).max(45)).min(3).max(3),
  palette: z.object({ primary: z.string().regex(/^#[0-9a-fA-F]{6}$/), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/) }),
});
type Industry = "electrical" | "plumbing" | "law" | "restaurant" | "realestate" | "generic";
type ShowcaseTemplate = z.infer<typeof ShowcaseTemplateSchema>;
type DemoTemplate = Exclude<ShowcaseTemplate, "auto">;
type Demo = z.infer<typeof DemoSchema> & { sourceUrl: string; generatedWithAi: boolean; industry: Industry; templateId: DemoTemplate };

function detectIndustry(text: string): Industry {
  const t = text.toLowerCase();
  const has = (words: string[]) => words.some((w) => t.includes(w));
  if (has(["electrician", "electrical contractor", "rewiring", "panel upgrade", "circuit", "wiring", "lighting install"])) return "electrical";
  if (has(["plumber", "plumbing", "hvac", "furnace", "air conditioning", "water heater", "drain", "heating and cooling", "boiler"])) return "plumbing";
  if (has(["law firm", "lawyer", "attorney", "legal", "litigation", "counsel", "law office", "practice areas", "personal injury"])) return "law";
  if (has(["restaurant", "menu", "reservation", "cuisine", "bistro", "café", "cafe", "catering", "chef", "dine-in", "eatery"])) return "restaurant";
  if (has(["real estate", "realtor", "listing", "for sale", "homes for sale", "mls", "brokerage", "property", "open house"])) return "realestate";
  return "generic";
}

function privateAddress(address: string) { return /^(127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|::1$|fc|fd|fe80:)/i.test(address); }
async function publicUrl(value: string) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (!/^https?:$/.test(url.protocol) || /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host) || host === "[::1]") throw new Error("Enter a public http or https website URL.");
  const { lookup } = await import("node:dns/promises");
  const records = await lookup(host, { all: true });
  if (!records.length || records.some((record) => privateAddress(record.address))) throw new Error("Enter a public website URL.");
  return url;
}
function visibleText(html: string) { return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function templateFor(industry: Industry, requested: ShowcaseTemplate): DemoTemplate {
  if (requested !== "auto") return requested;
  return industry === "generic" ? "plumbing" : industry;
}

function templateDirection(template: DemoTemplate) {
  const directions: Record<DemoTemplate, string> = {
    electrical: "dark, high-contrast emergency-service layout with electric blue accents, a bold immediate call button, trust badges, and practical service tiles",
    plumbing: "bright, reassuring home-services layout with a booking panel in the hero, deep blue accents, clear availability cues, and service cards",
    law: "calm editorial legal layout with warm ivory space, deep forest ink, elegant serif headlines, restrained gold details, and consultation-focused proof",
    restaurant: "immersive hospitality layout with deep wine tones, refined serif headlines, generous imagery space, menu cards, and a reservation-first call to action",
    realestate: "light, editorial real-estate layout with sage accents, a property-search style hero, an agent card, and listing-inspired proof cards",
  };
  return directions[template];
}

function fallback(url: URL, title: string, description: string, industry: Industry, templateId: DemoTemplate): Demo {
  const businessName = title.split(/[|—–-]/)[0].trim().slice(0, 100) || url.hostname.replace(/^www\./, "");
  return {
    businessName, eyebrow: "A clearer way to choose", headline: `A stronger first impression for ${businessName}.`,
    subheadline: description || `A modern website concept built around making it simple for visitors to understand, trust, and contact ${businessName}.`,
    primaryCta: "Start a conversation", secondaryCta: "See how it works",
    services: [{ title: "Simple next steps", description: "Clear paths help visitors find exactly what they need." }, { title: "Built for trust", description: "Proof, clarity, and helpful details live where decisions happen." }, { title: "Always available", description: "A trained website assistant can answer common questions around the clock." }],
    proof: ["Mobile-first experience", "Clear calls to action", "Fast, modern foundation"], palette: { primary: "#2563eb", accent: "#7c3aed" }, sourceUrl: url.toString(), generatedWithAi: false, industry, templateId,
  };
}

export const createWebsiteDemo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    let url = await publicUrl(data.website_url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let html = "";
    try {
      let response: Response | null = null;
      for (let redirects = 0; redirects < 4; redirects += 1) {
        response = await fetch(url, { signal: controller.signal, redirect: "manual", headers: { "User-Agent": "AscendantWeb-Demo-Preview/1.0 (+https://ascendantweb.org)" } });
        if (![301, 302, 303, 307, 308].includes(response.status)) break;
        const location = response.headers.get("location");
        if (!location) break;
        url = await publicUrl(new URL(location, url).toString());
      }
      if (!response?.ok) throw new Error(response ? `Website returned ${response.status}.` : "Could not reach that website.");
      if (Number(response.headers.get("content-length") ?? "0") > 650_000) throw new Error("That page is too large to preview.");
      html = await readCappedText(response, 650_000);
    } catch (error) { throw new Error(error instanceof Error && error.name === "AbortError" ? "The website took too long to respond." : error instanceof Error ? error.message : "Could not read that website."); }
    finally { clearTimeout(timeout); }

    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
    const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ?? "";
    const context = visibleText(html).slice(0, 8_000);
    const industry = detectIndustry(`${title} ${description} ${context}`);
    const templateId = templateFor(industry, data.template);
    const base = fallback(url, title, description, industry, templateId);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return base;

    try {
      const result = await generateText({
        model: createLovableAiGatewayProvider(key)("google/gemini-2.5-flash"),
        prompt: `Create a premium but believable one-page website concept from this public website content. The business appears to be in the "${industry}" category — tailor the copy to how that kind of business wins customers. The preview will use AscendantWeb's ${templateId} showcase model: ${templateDirection(templateId)}. Match its hierarchy and conversion intent, but do not copy any brand names, claims, images, or text from an example. Return JSON only, no markdown. Do not invent facts, pricing, awards, claims, or contact information. Make copy concise and customer-friendly. Required JSON schema: {"businessName":"","eyebrow":"","headline":"","subheadline":"","primaryCta":"","secondaryCta":"","services":[{"title":"","description":""},{"title":"","description":""},{"title":"","description":""}],"proof":["","", ""],"palette":{"primary":"#RRGGBB","accent":"#RRGGBB"}}. Website URL: ${url}. Existing page title: ${title}. Description: ${description}. Public text: ${context}`,
      });
      const json = result.text.match(/\{[\s\S]*\}/)?.[0];
      if (!json) return base;
      return { ...DemoSchema.parse(JSON.parse(json)), sourceUrl: url.toString(), generatedWithAi: true, industry, templateId } satisfies Demo;
    } catch {
      return base;
    }
  });
