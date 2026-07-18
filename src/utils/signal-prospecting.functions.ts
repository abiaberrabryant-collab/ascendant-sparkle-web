import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const UrlInput = z.object({ website_url: z.string().url().max(500) });
const DraftInput = z.object({
  prospect_id: z.string().uuid(),
  contact_name: z.string().trim().max(120),
  contact_email: z.string().trim().email().max(255),
});

function isPrivateAddress(address: string) {
  return /^(127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|::1$|fc|fd|fe80:)/i.test(
    address,
  );
}

async function validatePublicUrl(value: string) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  const isPrivateHost =
    /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(
      host,
    ) || host === "[::1]";
  if (!/^https?:$/.test(url.protocol) || isPrivateHost)
    throw new Error("Enter a public http or https website URL.");
  const { lookup } = await import("node:dns/promises");
  const records = await lookup(host, { all: true });
  if (!records.length || records.some((record) => isPrivateAddress(record.address)))
    throw new Error("Enter a public website URL.");
  return url;
}

async function getOrganizationId(db: any, userId: string) {
  const { data, error } = await db
    .from("organizations")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Save your business profile before using Signal Studio.");
  return data.id as string;
}

function textFromHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function matchMeta(html: string, name: string) {
  return (
    html
      .match(
        new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
      )?.[1]
      ?.trim() ?? ""
  );
}

export const listSignalProspects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as any;
    const organizationId = await getOrganizationId(db, context.userId);
    const { data: prospects, error } = await db
      .from("signal_prospects")
      .select("*")
      .eq("organization_id", organizationId)
      .order("score", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const ids = (prospects ?? []).map((prospect: any) => prospect.id);
    if (!ids.length) return [];
    const [{ data: signals }, { data: drafts }] = await Promise.all([
      db
        .from("prospect_signals")
        .select("*")
        .in("prospect_id", ids)
        .order("weight", { ascending: false }),
      db
        .from("prospect_email_drafts")
        .select("*")
        .in("prospect_id", ids)
        .order("created_at", { ascending: false }),
    ]);
    return (prospects ?? []).map((prospect: any) => ({
      ...prospect,
      signals: (signals ?? []).filter((signal: any) => signal.prospect_id === prospect.id),
      drafts: (drafts ?? []).filter((draft: any) => draft.prospect_id === prospect.id),
    }));
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
        response = await fetch(url, {
          signal: controller.signal,
          redirect: "manual",
          headers: { "User-Agent": "AscendantWeb-Signal-Scanner/1.0 (+https://ascendantweb.org)" },
        });
        if (![301, 302, 303, 307, 308].includes(response.status)) break;
        const location = response.headers.get("location");
        if (!location) break;
        url = await validatePublicUrl(new URL(location, url).toString());
      }
      if (!response) throw new Error("Could not scan that website.");
      if (!response.ok) throw new Error(`Website returned ${response.status}.`);
      const length = Number(response.headers.get("content-length") ?? "0");
      if (length > 750_000) throw new Error("That page is too large to scan.");
      html = (await response.text()).slice(0, 750_000);
    } catch (error) {
      throw new Error(
        error instanceof Error && error.name === "AbortError"
          ? "The website took too long to respond."
          : error instanceof Error
            ? error.message
            : "Could not scan that website.",
      );
    } finally {
      clearTimeout(timeout);
    }

    const pageText = textFromHtml(html);
    const title =
      html
        .match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
        ?.replace(/\s+/g, " ")
        .trim()
        .slice(0, 240) ?? "";
    const description = matchMeta(html, "description").slice(0, 500);
    const companyName = title.split(/[|—–-]/)[0].trim() || url.hostname.replace(/^www\./, "");
    const hasChat = /(intercom|drift|tawk|crisp|livechat|chatbot|chat-widget)/i.test(html);
    const hasEmail = /mailto:|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(html);
    const hasPhone = /tel:|\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/.test(pageText);
    const hasForm = /<form[\s>]/i.test(html);
    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const oldYear = html.match(/(?:©|copyright)\s*(?:\d{4}\s*[-–]\s*)?(20\d{2})/i)?.[1];
    const signals = [
      !hasChat && {
        kind: "conversion",
        label: "No website chat detected",
        detail: "Visitors do not appear to have an immediate way to ask questions.",
        weight: 28,
      },
      !hasForm && {
        kind: "conversion",
        label: "No contact form detected",
        detail: "The site may be missing a simple lead-capture path.",
        weight: 20,
      },
      !hasEmail &&
        !hasPhone && {
          kind: "trust",
          label: "Contact details are hard to find",
          detail: "No visible email address or phone link was detected on the scanned page.",
          weight: 18,
        },
      !hasViewport && {
        kind: "mobile",
        label: "Mobile setup may be incomplete",
        detail: "No mobile viewport tag was detected.",
        weight: 16,
      },
      oldYear &&
        Number(oldYear) < new Date().getFullYear() - 1 && {
          kind: "freshness",
          label: "Website looks out of date",
          detail: `The page copyright appears to be ${oldYear}.`,
          weight: 12,
        },
    ].filter(Boolean) as Array<{ kind: string; label: string; detail: string; weight: number }>;
    const score = Math.min(
      100,
      signals.reduce((total, signal) => total + signal.weight, 0) + (hasChat ? 0 : 10),
    );
    const { data: prospect, error } = await db
      .from("signal_prospects")
      .upsert(
        {
          organization_id: organizationId,
          company_name: companyName,
          website_url: url.toString(),
          page_title: title,
          page_description: description,
          score,
          status: "new",
          scanned_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,website_url" },
      )
      .select("id")
      .single();
    if (error || !prospect) throw new Error(error?.message ?? "Could not save this prospect.");
    await db.from("prospect_signals").delete().eq("prospect_id", prospect.id);
    if (signals.length) {
      const { error: signalError } = await db
        .from("prospect_signals")
        .insert(signals.map((signal) => ({ ...signal, prospect_id: prospect.id })));
      if (signalError) throw new Error(signalError.message);
    }
    return { id: prospect.id };
  });

export const createSignalDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => DraftInput.parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const organizationId = await getOrganizationId(db, context.userId);
    const { data: prospect, error } = await db
      .from("signal_prospects")
      .select("id, company_name, website_url, signals:prospect_signals(label, detail)")
      .eq("id", data.prospect_id)
      .eq("organization_id", organizationId)
      .single();
    if (error || !prospect) throw new Error("Prospect not found.");
    const signal = prospect.signals?.[0];
    const reason = signal
      ? `${signal.label.toLowerCase()} — ${signal.detail.toLowerCase()}`
      : "a few practical ways to make it easier for visitors to contact you";
    const subject = `A quick idea for ${prospect.company_name}`;
    const body = `Hi ${data.contact_name},\n\nI was looking at ${prospect.company_name}'s website and noticed ${reason}\n\nAscendantWeb helps businesses turn more website visits into real conversations with focused site improvements and an optional website chatbot.\n\nWould you be open to a short, no-pressure walkthrough of a couple ideas for ${prospect.company_name}?\n\nBest,\nAscendantWeb`;
    const { error: updateError } = await db
      .from("signal_prospects")
      .update({
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        status: "draft_ready",
      })
      .eq("id", prospect.id);
    if (updateError) throw new Error(updateError.message);
    const { data: draft, error: draftError } = await db
      .from("prospect_email_drafts")
      .insert({ prospect_id: prospect.id, subject, body })
      .select("*")
      .single();
    if (draftError) throw new Error(draftError.message);
    return draft;
  });

// ---------------------------------------------------------------------------
// Public signal feed
// ---------------------------------------------------------------------------
// The feed deliberately accepts RSS/Atom URLs instead of crawling arbitrary
// pages. It keeps source boundaries explicit, is cheaper to run, and makes it
// possible for an owner to verify that each source permits automated access.

const CampaignInput = z.object({
  name: z.string().trim().min(2).max(80),
  service_area: z.string().trim().max(120).default(""),
  offer: z.string().trim().min(8).max(320),
  ideal_customer: z.string().trim().max(320).default(""),
  keywords: z.array(z.string().trim().min(2).max(80)).max(20).default([]),
  intent_phrases: z.array(z.string().trim().min(3).max(140)).max(12).default([]),
  source_urls: z.array(z.string().url().max(500)).max(8).default([]),
  terms_confirmed: z.literal(true),
});
const RunCampaignInput = z.object({ campaign_id: z.string().uuid() });
const FeedDraftInput = z.object({
  signal_item_id: z.string().uuid(),
  recipient_name: z.string().trim().max(120).default(""),
  recipient_email: z.string().trim().email().max(255),
});
const FeedStatusInput = z.object({
  signal_item_id: z.string().uuid(),
  status: z.enum(["new", "reviewed", "dismissed"]),
});

type FeedEntry = {
  source_name: string;
  source_url: string;
  item_url: string;
  title: string;
  excerpt: string;
  author: string;
  published_at: string | null;
};

function cleanText(value: string, max = 700) {
  return decodeXml(value)
    .replace(/<!\[CDATA\[/gi, "")
    .replace(/\]\]>/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function tagValue(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ?? "";
}

function linkValue(block: string, fallback: string) {
  const href = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?\s*>/i)?.[1];
  if (href) return decodeXml(href).trim();
  return cleanText(tagValue(block, "link"), 500) || fallback;
}

function parseFeed(xml: string, source: URL): FeedEntry[] {
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>[\s\S]*?<\/(?:item|entry)>/gi)].map(
    (match) => match[0],
  );
  const entries: FeedEntry[] = [];
  for (const block of blocks.slice(0, 50)) {
    const title = cleanText(tagValue(block, "title"), 220);
    const itemUrl = linkValue(block, source.toString());
    if (!title || !/^https?:\/\//i.test(itemUrl)) continue;
    const excerpt = cleanText(
      tagValue(block, "description") || tagValue(block, "summary") || tagValue(block, "content"),
      700,
    );
    const rawDate = cleanText(
      tagValue(block, "pubDate") || tagValue(block, "published") || tagValue(block, "updated"),
      80,
    );
    const published =
      rawDate && !Number.isNaN(Date.parse(rawDate)) ? new Date(rawDate).toISOString() : null;
    const author = cleanText(
      tagValue(block, "dc:creator") || tagValue(block, "author") || tagValue(block, "name"),
      120,
    );
    entries.push({
      source_name: source.hostname.replace(/^www\./i, ""),
      source_url: source.toString(),
      item_url: itemUrl,
      title,
      excerpt,
      author,
      published_at: published,
    });
  }
  return entries;
}

function campaignQuery(campaign: { intent_phrases: string[]; keywords: string[] }) {
  const terms = [...campaign.intent_phrases, ...campaign.keywords]
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 8);
  return (
    terms.map((term) => `"${term.replace(/"/g, "")}"`).join(" OR ") || "small business website"
  );
}

function googleNewsUrl(campaign: { intent_phrases: string[]; keywords: string[] }) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(campaignQuery(campaign))}&hl=en-US&gl=US&ceid=US:en`;
}

function scoreFeedEntry(
  entry: FeedEntry,
  campaign: { intent_phrases: string[]; keywords: string[] },
) {
  const haystack = `${entry.title} ${entry.excerpt}`.toLowerCase();
  const intent = campaign.intent_phrases.filter((term) => haystack.includes(term.toLowerCase()));
  const keywords = campaign.keywords.filter((term) => haystack.includes(term.toLowerCase()));
  const age = entry.published_at
    ? Date.now() - new Date(entry.published_at).getTime()
    : Number.POSITIVE_INFINITY;
  const recentBonus = age >= 0 && age <= 14 * 24 * 60 * 60 * 1000 ? 10 : 0;
  const score = Math.min(100, intent.length * 28 + keywords.length * 9 + recentBonus);
  return { score, matched_terms: [...intent, ...keywords] };
}

async function fetchFeed(sourceValue: string) {
  let source = await validatePublicUrl(sourceValue);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9_000);
  try {
    let response: Response | null = null;
    for (let redirects = 0; redirects < 3; redirects += 1) {
      response = await fetch(source, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9",
          "User-Agent": "AscendantWeb-Signal-Feed/1.0 (+https://ascendantweb.org)",
        },
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get("location");
      if (!location) break;
      source = await validatePublicUrl(new URL(location, source).toString());
    }
    if (!response?.ok) throw new Error(`Source returned ${response?.status ?? "an error"}.`);
    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > 1_000_000) throw new Error("Source feed is larger than 1 MB.");
    const body = (await response.text()).slice(0, 1_000_000);
    return { source, entries: parseFeed(body, source) };
  } catch (error) {
    throw new Error(
      error instanceof Error && error.name === "AbortError"
        ? "Source timed out."
        : error instanceof Error
          ? error.message
          : "Could not read this source.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function getCampaignOrganization(db: any, userId: string, campaignId: string) {
  const organizationId = await getOrganizationId(db, userId);
  const { data: campaign, error } = await db
    .from("signal_campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("organization_id", organizationId)
    .single();
  if (error || !campaign) throw new Error("Signal campaign not found.");
  return { organizationId, campaign };
}

export const listSignalWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as any;
    const organizationId = await getOrganizationId(db, context.userId);
    const [{ data: campaigns, error: campaignError }, { data: items, error: itemError }] =
      await Promise.all([
        db
          .from("signal_campaigns")
          .select("*")
          .eq("organization_id", organizationId)
          .order("updated_at", { ascending: false }),
        db
          .from("signal_feed_items")
          .select("*")
          .eq("organization_id", organizationId)
          .order("score", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(120),
      ]);
    if (campaignError || itemError)
      throw new Error(
        campaignError?.message ?? itemError?.message ?? "Could not load signal feed.",
      );
    const itemIds = (items ?? []).map((item: any) => item.id);
    const { data: drafts, error: draftError } = itemIds.length
      ? await db
          .from("signal_feed_drafts")
          .select("*")
          .in("signal_item_id", itemIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };
    if (draftError) throw new Error(draftError.message);
    return {
      campaigns: campaigns ?? [],
      items: (items ?? []).map((item: any) => ({
        ...item,
        draft: (drafts ?? []).find((draft: any) => draft.signal_item_id === item.id) ?? null,
      })),
    };
  });

export const createSignalCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CampaignInput.parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const organizationId = await getOrganizationId(db, context.userId);
    const sourceUrls = [...new Set(data.source_urls.map((url) => new URL(url).toString()))];
    for (const url of sourceUrls) await validatePublicUrl(url);
    const { data: campaign, error } = await db
      .from("signal_campaigns")
      .insert({
        organization_id: organizationId,
        name: data.name,
        service_area: data.service_area,
        offer: data.offer,
        ideal_customer: data.ideal_customer,
        keywords: data.keywords,
        intent_phrases: data.intent_phrases,
        source_urls: sourceUrls,
        enabled: true,
      })
      .select("*")
      .single();
    if (error || !campaign) throw new Error(error?.message ?? "Could not create campaign.");
    return campaign;
  });

export const runSignalCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RunCampaignInput.parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const { organizationId, campaign } = await getCampaignOrganization(
      db,
      context.userId,
      data.campaign_id,
    );
    const sourceUrls = [
      ...new Set([googleNewsUrl(campaign), ...(campaign.source_urls ?? [])]),
    ].slice(0, 8);
    const results = await Promise.allSettled(sourceUrls.map((source) => fetchFeed(source)));
    const entries = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value.entries : [],
    );
    const ranked = entries
      .map((entry) => ({ entry, ...scoreFeedEntry(entry, campaign) }))
      .filter((value) => value.score >= 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);
    let saved = 0;
    for (const value of ranked) {
      const { error } = await db.from("signal_feed_items").upsert(
        {
          organization_id: organizationId,
          campaign_id: campaign.id,
          source_name: value.entry.source_name,
          source_url: value.entry.source_url,
          item_url: value.entry.item_url,
          title: value.entry.title,
          excerpt: value.entry.excerpt,
          author: value.entry.author,
          published_at: value.entry.published_at,
          matched_terms: value.matched_terms,
          score: value.score,
        },
        { onConflict: "campaign_id,item_url" },
      );
      if (!error) saved += 1;
    }
    await db
      .from("signal_campaigns")
      .update({ last_run_at: new Date().toISOString() })
      .eq("id", campaign.id)
      .eq("organization_id", organizationId);
    const failedSources = results.filter((result) => result.status === "rejected").length;
    return { saved, total: ranked.length, failedSources };
  });

export const createPublicSignalDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => FeedDraftInput.parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const organizationId = await getOrganizationId(db, context.userId);
    const { data: item, error } = await db
      .from("signal_feed_items")
      .select("*, campaign:signal_campaigns(name, offer, service_area)")
      .eq("id", data.signal_item_id)
      .eq("organization_id", organizationId)
      .single();
    if (error || !item) throw new Error("Signal not found.");
    const recipient = data.recipient_name || "there";
    const subject = `A thoughtful idea for ${item.source_name || "your business"}`;
    const sourceLine = item.title
      ? `I came across “${item.title}” and it made me think there may be a useful opportunity here.`
      : "I came across a recent public signal that made me think there may be a useful opportunity here.";
    const body = `Hi ${recipient},\n\n${sourceLine}\n\n${item.excerpt ? `The relevant detail was: “${item.excerpt.slice(0, 360)}”\n\n` : ""}${item.campaign?.offer ?? "AscendantWeb helps businesses turn more website visits into real conversations with focused site improvements and an optional website chatbot."}\n\nIf improving this is on your radar, I can send over a short, no-pressure walkthrough tailored to your business.\n\nBest,\nAscendantWeb\n\nSource: ${item.item_url}`;
    const { data: draft, error: draftError } = await db
      .from("signal_feed_drafts")
      .insert({
        organization_id: organizationId,
        signal_item_id: item.id,
        recipient_name: data.recipient_name,
        recipient_email: data.recipient_email,
        subject,
        body,
      })
      .select("*")
      .single();
    if (draftError || !draft) throw new Error(draftError?.message ?? "Could not create draft.");
    await db
      .from("signal_feed_items")
      .update({ status: "draft_ready" })
      .eq("id", item.id)
      .eq("organization_id", organizationId);
    return draft;
  });

export const updatePublicSignalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => FeedStatusInput.parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as any;
    const organizationId = await getOrganizationId(db, context.userId);
    const { error } = await db
      .from("signal_feed_items")
      .update({ status: data.status })
      .eq("id", data.signal_item_id)
      .eq("organization_id", organizationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
