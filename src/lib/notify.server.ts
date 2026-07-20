/**
 * Server-only lead notifications via Resend (https://resend.com).
 * No-ops silently unless RESEND_API_KEY and LEAD_NOTIFY_EMAIL are set, so form
 * submissions never fail just because email isn't configured yet.
 *
 * Env:
 *   RESEND_API_KEY    — your Resend API key
 *   LEAD_NOTIFY_EMAIL — where owner notifications are sent
 *   LEAD_FROM_EMAIL   — verified "from" address (optional; defaults to Resend's sandbox sender)
 */
export async function sendLeadNotification(lead: {
  name: string;
  email: string;
  source: string;
  message?: string | null;
  website_url?: string | null;
  budget?: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL || "AscendantWeb Leads <onboarding@resend.dev>";
  if (!apiKey || !to) return;

  const body = [
    `New ${lead.source} lead from the AscendantWeb site.`,
    "",
    `Name:    ${lead.name}`,
    `Email:   ${lead.email}`,
    lead.website_url ? `Website: ${lead.website_url}` : "",
    lead.budget ? `Budget:  ${lead.budget}` : "",
    lead.message ? `\nMessage:\n${lead.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: lead.email,
        subject: `New ${lead.source} lead: ${lead.name}`,
        text: body,
      }),
    });
  } catch {
    // Best-effort only — never block the visitor's submission on email delivery.
  }
}
