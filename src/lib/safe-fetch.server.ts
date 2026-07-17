/**
 * Server-only helpers for safely reading untrusted external web pages
 * (Demo Studio, Signal Studio). Keeps memory bounded regardless of what the
 * remote server claims in its Content-Length header.
 */

/**
 * Read a response body as text but stop after `maxBytes`, cancelling the
 * stream. The Content-Length header can be absent or dishonest, so we enforce
 * the size limit on the actual bytes received rather than trusting the header.
 */
export async function readCappedText(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return (await response.text()).slice(0, maxBytes);

  const decoder = new TextDecoder();
  let out = "";
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        out += decoder.decode(value, { stream: true });
        if (total >= maxBytes) {
          await reader.cancel();
          break;
        }
      }
    }
  } finally {
    reader.releaseLock?.();
  }

  return out.slice(0, maxBytes);
}
