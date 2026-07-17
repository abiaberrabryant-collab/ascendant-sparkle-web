import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readCappedText } from "@/lib/safe-fetch.server";

const UrlInput = z.object({ website_url: z.string().url().max(500) });
const DraftInput = z.object({ prospect_id: z.string().uuid(), contact_name: z.string().trim().max(120), contact_email: z.string().trim().email().max(255) });

function isPrivateAddress(address: string) {
  return /^(127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|::1$|fc|fd|fe80:)/i.test(address);
}

async function validatePublicUrl(value: string) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  const isPrivateHost = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host) || host === "[::1]";
  if (!/^https?:$/.test(url.protocol) || isPrivateHost) throw new Error("Enter a public http or https website URL.");
  const { lookup } = await import("node:dns/promises");
  const records = await lookup(host, { all: true });
  if (!records.length || records.some((record) => isPrivateAddress(record.address))) throw new Error("Enter a public website URL.");
  return url;
}

async function getOrganizationId(db: any, userId: string) {
  const { data, error } = await db.from("organizations").select("id").eq("owner_user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Save your business profile before using Signal Studio.");
  return data.id as string;
}

function textFromHtml(html: string) { return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function matchMeta(html: string, name: string) { return html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1]?.trim() ?? ""; }

export const listSignalProspects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as any;
    const organizationId = await getOrganizationId(db, context.userId);
    const { data: prospects, error } = await db.from("signal_prospects").select("*").eq("organization_id", organizationId).order("score", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    const ids = (prospects ?? []).map((prospect: any) => prospect.id);
    if (!ids.length) return [];
    const [{ data: signals }, { data: drafts }] = await Promise.all([
      db.from("prospect_signals").select("*").in("prospect_id", ids).order("weight", { ascending: false }),
      db.from("prospect_email_drafts").select("*").in("prospect_id", ids).order("created_at", { ascending: false }),
    ]);
    return (prospects ?? []).map((prospect: any) => ({ ...prospect, signals: (signals ?? []).filter((signal: any) => signal.prospect_id === prospect.id), drafts: (drafts ?? []).filter((draft: any) => draft.prospect_id === prospect.id) }));
  });

export const scanSignalProspect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => UrlInput.parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const organizationId = await getOrganizationId(db, context.userId);
    let url = await validatePublicUrl(data.website_url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let html = "";
    try {
      let response: Response | null = null;
      for (let redirects = 0; redirects < 4; redirects += 1) {
        response = await fetch(url, { signal: controller.signal, redirect: "manual", headers: { "User-Agent": "AscendantWeb-Signal-Scanner/1.0 (+https://ascendantweb.org)" } });
        if (![301, 302, 303, 307, 308].includes(response.status)) break;
        const location = response.headers.get("location");
        if (!location) break;
        url = await validatePublicUrl(new URL(location, url).toString());
      }
      if (!response) throw new Error("Could not scan that website.");
      if (!response.ok) throw new Error(`Website returned ${response.status}.`);
      const length = Number(response.headers.get("content-length") ?? "0");
      if (length > 750_000) throw new Error("That page is too large to scan.");
      html = await readCappedText(response, 750_000);
    } catch (error) { throw new Error(error instanceof Error && error.name === "AbortError" ? "The website took too long to respond." : error instanceof Error ? error.message : "Could not scan that website."); }
    finally { clearTimeout(timeout); }

    const pageText = textFromHtml(html);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim().slice(0, 240) ?? "";
    const description = matchMeta(html, "description").slice(0, 500);
    const companyName = title.split(/[|—–-]/)[0].trim() || url.hostname.replace(/^www\./, "");
    const hasChat = /(intercom|drift|tawk|crisp|livechat|chatbot|chat-widget)/i.test(html);
    const hasEmail = /mailto:|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(html);
    const hasPhone = /tel:|\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/.test(pageText);
    const hasForm = /<form[\s>]/i.test(html);
    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const oldYear = html.match(/(?:©|copyright)\s*(?:\d{4}\s*[-–]\s*)?(20\d{2})/i)?.[1];
    const signals = [
      !hasChat && { kind: "conversion", label: "No website chat detected", detail: "Visitors do not appear to have an immediate way to ask questions.", weight: 28 },
      !hasForm && { kind: "conversion", label: "No contact form detected", detail: "The site may be missing a simple lead-capture path.", weight: 20 },
      !hasEmail && !hasPhone && { kind: "trust", label: "Contact details are hard to find", detail: "No visible email address or phone link was detected on the scanned page.", weight: 18 },
      !hasViewport && { kind: "mobile", label: "Mobile setup may be incomplete", detail: "No mobile viewport tag was detected.", weight: 16 },
      oldYear && Number(oldYear) < new Date().getFullYear() - 1 && { kind: "freshness", label: "Website looks out of date", detail: `The page copyright appears to be ${oldYear}.`, weight: 12 },
    ].filter(Boolean) as Array<{ kind: string; label: string; detail: string; weight: number }>;
    const score = Math.min(100, signals.reduce((total, signal) => total + signal.weight, 0) + (hasChat ? 0 : 10));
    const { data: prospect, error } = await db.from("signal_prospects").upsert({ organization_id: organizationId, company_name: companyName, website_url: url.toString(), page_title: title, page_description: description, score, status: "new", scanned_at: new Date().toISOString() }, { onConflict: "organization_id,website_url" }).select("id").single();
    if (error || !prospect) throw new Error(error?.message ?? "Could not save this prospect.");
    await db.from("prospect_signals").delete().eq("prospect_id", prospect.id);
    if (signals.length) { const { error: signalError } = await db.from("prospect_signals").insert(signals.map((signal) => ({ ...signal, prospect_id: prospect.id }))); if (signalError) throw new Error(signalError.message); }
    return { id: prospect.id };
  });

export const createSignalDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => DraftInput.parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const organizationId = await getOrganizationId(db, context.userId);
    const { data: prospect, error } = await db.from("signal_prospects").select("id, company_name, website_url, signals:prospect_signals(label, detail)").eq("id", data.prospect_id).eq("organization_id", organizationId).single();
    if (error || !prospect) throw new Error("Prospect not found.");
    const signal = prospect.signals?.[0];
    const reason = signal ? `${signal.label.toLowerCase()} — ${signal.detail.toLowerCase()}` : "a few practical ways to make it easier for visitors to contact you";
    const subject = `A quick idea for ${prospect.company_name}`;
    const body = `Hi ${data.contact_name},\n\nI was looking at ${prospect.company_name}'s website and noticed ${reason}\n\nAscendantWeb helps businesses turn more website visits into real conversations with focused site improvements and an optional website chatbot.\n\nWould you be open to a short, no-pressure walkthrough of a couple ideas for ${prospect.company_name}?\n\nBest,\nAscendantWeb`;
    const { error: updateError } = await db.from("signal_prospects").update({ contact_name: data.contact_name, contact_email: data.contact_email, status: "draft_ready" }).eq("id", prospect.id);
    if (updateError) throw new Error(updateError.message);
    const { data: draft, error: draftError } = await db.from("prospect_email_drafts").insert({ prospect_id: prospect.id, subject, body }).select("*").single();
    if (draftError) throw new Error(draftError.message);
    return draft;
  });
