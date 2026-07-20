import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — AscendantWeb" },
      { name: "description", content: "How AscendantWeb collects, uses, and protects your information." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="July 2026">
      <p>
        This Privacy Policy explains how AscendantWeb ("AscendantWeb," "we," "us," or "our") collects, uses, and
        protects information when you visit our website, contact us, or use our services — including website builds,
        the AI chatbot, the owner dashboard, Signal Studio, and the Instant Website Demo. By using our services, you
        agree to this policy.
      </p>

      <Section title="Information we collect">
        <p>We collect the following categories of information:</p>
        <ul>
          <li>
            <strong>Information you provide.</strong> Your name, email, phone number, business name, website URL,
            project details, and any message you send through our contact, audit, or checkout forms, or through the
            chatbot.
          </li>
          <li>
            <strong>Account information.</strong> Details you provide when you create an account, and content you add
            to your business profile or chatbot configuration.
          </li>
          <li>
            <strong>Payment information.</strong> Payments are processed by Stripe. We do not store full card numbers;
            Stripe handles card data under its own security standards.
          </li>
          <li>
            <strong>Chatbot conversations.</strong> Messages exchanged with a chatbot, and any contact details a
            visitor chooses to submit for follow-up.
          </li>
          <li>
            <strong>Public website content.</strong> When you use the demo or audit tools, we read one public page of
            the website URL you provide in order to generate a concept or report. We only access publicly available
            pages.
          </li>
          <li>
            <strong>Usage and device information.</strong> Standard technical data such as IP address, browser type,
            pages viewed, and performance metrics, collected to operate and improve the service.
          </li>
        </ul>
      </Section>

      <Section title="How we use your information">
        <ul>
          <li>To provide, operate, and improve our services;</li>
          <li>To respond to inquiries and provide customer support;</li>
          <li>To process payments and manage subscriptions;</li>
          <li>To generate website concepts, audits, and lead opportunities you request;</li>
          <li>To secure our services and prevent abuse; and</li>
          <li>To comply with legal obligations.</li>
        </ul>
      </Section>

      <Section title="AI processing">
        <p>
          Our chatbot, demo, and Signal Studio features use third-party AI models (via the Lovable AI Gateway). Content
          you submit to these features may be processed by AI providers to generate responses, concepts, or drafts. We
          do not sell your personal information, and we instruct our AI features not to fabricate facts about you or
          your business.
        </p>
      </Section>

      <Section title="How we share information">
        <p>We share information only as needed to run the service:</p>
        <ul>
          <li>
            <strong>Service providers</strong> that help us operate — including Supabase (database and hosting),
            Stripe (payments), the Lovable AI Gateway (AI processing), and our email provider (notifications);
          </li>
          <li>
            <strong>Legal and safety</strong> — when required by law or to protect our rights, users, or the public;
            and
          </li>
          <li>
            <strong>Business transfers</strong> — in connection with a merger, acquisition, or sale of assets.
          </li>
        </ul>
        <p>We do not sell your personal information.</p>
      </Section>

      <Section title="Cookies">
        <p>
          We use essential cookies to run the site and keep you signed in, and limited analytics to understand usage
          and improve performance. You can control cookies through your browser settings.
        </p>
      </Section>

      <Section title="Data retention">
        <p>
          We keep personal information for as long as needed to provide the service and for legitimate business or
          legal purposes. You may request deletion of your information as described below.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, delete, or restrict use of your
          personal information, and to opt out of certain communications. To make a request, email us at the address
          below. We will respond within the time required by applicable law.
        </p>
      </Section>

      <Section title="Security">
        <p>
          We use industry-standard measures — including encryption in transit, access controls, and reputable
          infrastructure providers — to protect your information. No method of transmission or storage is completely
          secure, so we cannot guarantee absolute security.
        </p>
      </Section>

      <Section title="Children's privacy">
        <p>Our services are not directed to children under 16, and we do not knowingly collect their information.</p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We may update this policy from time to time. Material changes will be posted on this page with an updated
          date.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          Questions about this policy or your information? Email{" "}
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
        <div className="legal mt-10 space-y-8 text-[15px] leading-7 text-foreground/80">{children}</div>
        <div className="mt-14 border-t border-glass-border pt-6 text-sm text-foreground/50">
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
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
