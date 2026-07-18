-- Public signal feed: owner-configured, permitted RSS/Atom sources only.
-- This migration intentionally stores drafts only. There is no send queue or delivery integration.

CREATE TABLE public.signal_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  service_area text NOT NULL DEFAULT '',
  offer text NOT NULL,
  ideal_customer text NOT NULL DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}',
  intent_phrases text[] NOT NULL DEFAULT '{}',
  source_urls text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(name) BETWEEN 2 AND 80),
  CHECK (char_length(offer) BETWEEN 8 AND 320)
);

CREATE TABLE public.signal_feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.signal_campaigns(id) ON DELETE CASCADE,
  source_name text NOT NULL DEFAULT '',
  source_url text NOT NULL,
  item_url text NOT NULL,
  title text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  author text NOT NULL DEFAULT '',
  published_at timestamptz,
  matched_terms text[] NOT NULL DEFAULT '{}',
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'draft_ready', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, item_url)
);

CREATE TABLE public.signal_feed_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  signal_item_id uuid NOT NULL REFERENCES public.signal_feed_items(id) ON DELETE CASCADE,
  recipient_name text NOT NULL DEFAULT '',
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'discarded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX signal_campaigns_organization_idx ON public.signal_campaigns (organization_id, enabled, updated_at DESC);
CREATE INDEX signal_feed_items_campaign_score_idx ON public.signal_feed_items (campaign_id, score DESC, published_at DESC);
CREATE INDEX signal_feed_items_organization_status_idx ON public.signal_feed_items (organization_id, status, score DESC);
CREATE INDEX signal_feed_drafts_item_idx ON public.signal_feed_drafts (signal_item_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_feed_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_feed_drafts TO authenticated;

ALTER TABLE public.signal_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_feed_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members manage signal campaigns" ON public.signal_campaigns FOR ALL TO authenticated
  USING (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[]))
  WITH CHECK (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[]));

CREATE POLICY "Organization members manage signal feed items" ON public.signal_feed_items FOR ALL TO authenticated
  USING (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[]))
  WITH CHECK (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[]));

CREATE POLICY "Organization members manage signal feed drafts" ON public.signal_feed_drafts FOR ALL TO authenticated
  USING (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[]))
  WITH CHECK (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[]));

CREATE TRIGGER signal_campaigns_updated_at BEFORE UPDATE ON public.signal_campaigns FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER signal_feed_items_updated_at BEFORE UPDATE ON public.signal_feed_items FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER signal_feed_drafts_updated_at BEFORE UPDATE ON public.signal_feed_drafts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
