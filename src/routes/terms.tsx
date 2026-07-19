import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — AscendantWeb" },
      { name: "description", content: "The terms that govern your use of AscendantWeb's services." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="July 2026">
      <p>
        These Terms of Service ("Terms") govern your access to and use of AscendantWeb's website and services,
        including website design and development, the AI chatbot, the owner dashboard, Signal Studio, and the Instant
        Website Demo (collectively, the "Services"). By using the Services, you agree to these Terms.
      </p>

      <Section title="The services">
        <p>
          AscendantWeb designs and builds websites and provides related tools — an AI chatbot, a lead and follow-up
          dashboard, signal-based prospect research, and an instant website concept generator. Specific deliverables
          and timelines are described in your chosen plan or a separate proposal.
        </p>
      </Section>

      <Section title="Accounts">
        <p>
          You must provide accurate information when creating an account and keep your credentials secure. You are
          responsible for activity that occurs under your account.
        </p>
      </Section>

      <Section title="Fees and payment">
        <p>
          Paid plans include a one-time build fee plus a recurring monthly subscription covering maintenance and your
          AI chatbot. Payments are processed by Stripe. Subscriptions renew automatically each month until cancelled.
          You can cancel a subscription at any time; cancellation stops future renewals and takes effect at the end of
          the current billing period. Fees already paid are non-refundable except where required by law or expressly
          stated in your plan.
        </p>
      </Section>

      <Section title="Your responsibilities">
        <ul>
          <li>Provide content and materials you have the right to use, and keep them lawful and accurate;</li>
          <li>Use the Services only for lawful purposes; and</li>
          <li>Not misuse, overload, reverse-engineer, or attempt to gain unauthorized access to the Services.</li>
        </ul>
      </Section>

      <Section title="AI features">
        <p>
          Our chatbot and generation tools use AI and may occasionally produce inaccurate or incomplete output. AI
          output is not professional, legal, financial, or medical advice. You are responsible for reviewing AI-
          generated content before relying on or publishing it.
        </p>
      </Section>

      <Section title="Signal Studio and outreach">
        <p>
          Signal Studio monitors permitted public feeds and generates <strong>review-only</strong> draft messages. It
          does not send email on your behalf. If you choose to contact anyone using a draft, you are solely responsible
          for complying with all applicable laws — including anti-spam and privacy laws such as CAN-SPAM, CASL, and
          GDPR — and for honoring opt-out requests. You agree not to use the Services for bulk unsolicited email or
          other abusive outreach.
        </p>
      </Section>

      <Section title="Intellectual property">
        <p>
          Upon full payment, you own the final website content and design deliverables produced specifically for you.
          AscendantWeb retains ownership of its underlying platform, tools, templates, and know-how, and grants you a
          license to use them as part of the Services. You retain ownership of content you provide.
        </p>
      </Section>

      <Section title="Third-party services">
        <p>
          The Services rely on third parties (such as Supabase, Stripe, and AI providers). Their availability and
          terms are outside our control, and your use of them may be subject to their own terms.
        </p>
      </Section>

      <Section title="Disclaimers">
        <p>
          The Services are provided "as is" and "as available," without warranties of any kind, whether express or
          implied, including fitness for a particular purpose and non-infringement, to the fullest extent permitted by
          law.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, AscendantWeb will not be liable for indirect, incidental, special,
          or consequential damages, or for lost profits or revenue. Our total liability for any claim relating to the
          Services will not exceed the amount you paid us in the twelve months before the claim.
        </p>
      </Section>

      <Section title="Termination">
        <p>
          You may stop using the Services at any time. We may suspend or terminate access if you breach these Terms or
          use the Services unlawfully. Sections that by their nature should survive termination will survive.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These Terms are governed by the laws applicable at AscendantWeb's principal place of business, without regard
          to conflict-of-law rules.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>We may update these Terms from time to time. Material changes will be posted here with an updated date.</p>
      </Section>

      <Section title="Contact us">
        <p>
          Questions about these Terms? Email{" "}
          <a href="mailto:hello@ascendantweb.org" className="text-primary hover:underline">
            hello@ascendantweb.org
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}

function LegalLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-glass-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <a href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-tr from-primary to-secondary text-white">
              A
            </span>
            AscendantWeb
          </a>
          <a href="/" className="text-sm text-foreground/60 transition-colors hover:text-foreground">
            Back to site
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-foreground/50">Last updated: {updated}</p>
        <div className="mt-10 space-y-8 text-[15px] leading-7 text-foreground/80">{children}</div>
        <div className="mt-14 border-t border-glass-border pt-6 text-sm text-foreground/50">
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">{children}</div>
    </section>
  );
}
