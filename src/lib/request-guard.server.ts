type RateLimitBucket = { count: number; resetAt: number };

const buckets = new Map<string, RateLimitBucket>();

function clientAddress(request: Request) {
  const platformIp = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip");
  if (platformIp) return platformIp.trim().slice(0, 100);
  return (request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ?? "unknown").slice(0, 100);
}

function pruneBuckets(now: number) {
  if (buckets.size < 2000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size >= 2000) {
    const firstKey = buckets.keys().next().value;
    if (firstKey) buckets.delete(firstKey);
  }
}

export function checkRateLimit(
  request: Request,
  namespace: string,
  subject: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  pruneBuckets(now);
  const key = `${namespace}:${clientAddress(request)}:${subject}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  if (current.count <= limit) return { allowed: true, retryAfter: 0 };
  return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}

export function rateLimitResponse(retryAfter: number, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Retry-After", String(retryAfter));
  responseHeaders.set("Cache-Control", "no-store");
  return new Response("Too many requests. Please try again shortly.", { status: 429, headers: responseHeaders });
}

export async function readCappedJson<T>(request: Request, maxBytes: number): Promise<T> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error("Request body is too large.");
  }

  const reader = request.body?.getReader();
  if (!reader) {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new Error("Request body is too large.");
    }
    return JSON.parse(text) as T;
  }

  const decoder = new TextDecoder();
  let text = "";
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value?.byteLength ?? 0;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("Request body is too large.");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock?.();
  }
  return JSON.parse(text) as T;
}

export async function readCappedText(request: Request, maxBytes: number): Promise<string> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error("Request body is too large.");
  const reader = request.body?.getReader();
  if (!reader) {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error("Request body is too large.");
    return text;
  }
  const decoder = new TextDecoder();
  let text = "";
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value?.byteLength ?? 0;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("Request body is too large.");
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock?.();
  }
}
