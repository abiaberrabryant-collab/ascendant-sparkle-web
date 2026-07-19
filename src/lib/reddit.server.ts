/**
 * Reddit official API (application-only OAuth) for Signal Studio.
 *
 * Uses the client_credentials grant so requests are authenticated and subject
 * to Reddit's real API rate limits (~600 requests / 10 min) instead of the
 * public .rss endpoint, which aggressively returns 429 to datacenter IPs.
 *
 * No-ops (returns []) when REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET are unset,
 * so the rest of Signal Studio keeps working until the owner adds a key.
 */

export type RedditItem = {
  title: string;
  excerpt: string;
  author: string;
  url: string;
  postedAt: string | null;
};

function userAgent() {
  return process.env.REDDIT_USER_AGENT || "web:ascendantweb-signal:1.0 (by AscendantWeb)";
}

function base64(value: string) {
  if (typeof btoa === "function") return btoa(value);
  // Node fallback (Buffer exists off the Cloudflare/browser path).
  return (globalThis as { Buffer?: { from(v: string): { toString(enc: string): string } } }).Buffer!
    .from(value)
    .toString("base64");
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  try {
    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + base64(`${id}:${secret}`),
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": userAgent(),
      },
      body: "grant_type=client_credentials",
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    cachedToken = {
      token: json.access_token,
      expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
    };
    return cachedToken.token;
  } catch {
    return null;
  }
}

/** True when a Reddit API key is configured. */
export function redditConfigured() {
  return Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET);
}

/**
 * Searches Reddit for recent posts matching `query`. When `subreddits` (a
 * "a+b+c" string) is provided the search is restricted to those communities.
 */
export async function searchReddit(
  query: string,
  opts: { subreddits?: string; limit?: number } = {},
): Promise<RedditItem[]> {
  if (!query.trim()) return [];
  const token = await getToken();
  if (!token) return [];
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  const params = new URLSearchParams({
    q: query.slice(0, 500),
    sort: "new",
    limit: String(limit),
    restrict_sr: opts.subreddits ? "1" : "0",
    raw_json: "1",
  });
  const url = opts.subreddits
    ? `https://oauth.reddit.com/r/${opts.subreddits}/search?${params.toString()}`
    : `https://oauth.reddit.com/search?${params.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": userAgent() },
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const json = (await response.json()) as {
      data?: { children?: Array<{ data?: Record<string, unknown> }> };
    };
    const children = json.data?.children ?? [];
    return children
      .map((child): RedditItem => {
        const post = child.data ?? {};
        const permalink = typeof post.permalink === "string" ? post.permalink : "";
        const created = typeof post.created_utc === "number" ? post.created_utc : null;
        return {
          title: String(post.title ?? "").slice(0, 500),
          excerpt: String(post.selftext ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 2500),
          author: typeof post.author === "string" && post.author ? `/u/${post.author}` : "",
          url: permalink ? `https://www.reddit.com${permalink}` : String(post.url ?? ""),
          postedAt: created ? new Date(created * 1000).toISOString() : null,
        };
      })
      .filter((item) => item.url && (item.title || item.excerpt));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
