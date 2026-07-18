-- Signal campaigns monitor only RSS/Atom feeds the organization is allowed to
-- use. Results become review-only opportunities; the app never sends email.

CREATE TABLE public.signal_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  offer text NOT NULL DEFAULT '',
  ideal_customer text NOT NULL DEFAULT '',
  service_area text NOT NULL DEFAULT '',
  match_keywords text[] NOT NULL DEFAULT '{}',
  intent_phrases text[] NOT NULL DEFAULT '{}',
  sender_name text NOT NULL DEFAULT '',
  sender_email text NOT NULL DEFAULT '',
  postal_address text NOT NULL DEFAULT '',
  opt_out_email text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.signal_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.signal_campaigns(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  source_type text NOT NULL DEFAULT 'rss' CHECK (source_type IN ('rss')),
  feed_url text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, feed_url)
);

CREATE TABLE public.signal_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.signal_campaigns(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.signal_sources(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  title text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  author_name text NOT NULL DEFAULT '',
  posted_at timestamptz,
  matched_terms text[] NOT NULL DEFAULT '{}',
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'draft_ready', 'approved', 'contacted', 'not_a_fit')),
  contact_name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  company_website_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, source_url)
);

CREATE TABLE public.signal_opportunity_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.signal_opportunities(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'discarded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.signal_source_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.signal_sources(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  items_found integer NOT NULL DEFAULT 0,
  opportunities_added integer NOT NULL DEFAULT 0,
  error_message text NOT NULL DEFAULT '',
  ran_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX signal_campaigns_org_idx ON public.signal_campaigns (organization_id, is_active, created_at DESC);
CREATE INDEX signal_sources_campaign_idx ON public.signal_sources (campaign_id, is_enabled);
CREATE INDEX signal_opportunities_campaign_idx ON public.signal_opportunities (campaign_id, score DESC, posted_at DESC, created_at DESC);
CREATE INDEX signal_opportunity_drafts_opportunity_idx ON public.signal_opportunity_drafts (opportunity_id, created_at DESC);
CREATE INDEX signal_source_runs_source_idx ON public.signal_source_runs (source_id, ran_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_opportunity_drafts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_source_runs TO authenticated;

ALTER TABLE public.signal_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_opportunity_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_source_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members manage signal campaigns" ON public.signal_campaigns FOR ALL TO authenticated
  USING (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[]))
  WITH CHECK (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[]));

CREATE POLICY "Organization members manage signal sources" ON public.signal_sources FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.signal_campaigns c WHERE c.id = signal_sources.campaign_id AND public.has_organization_role(c.organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[])))
  WITH CHECK (EXISTS (SELECT 1 FROM public.signal_campaigns c WHERE c.id = signal_sources.campaign_id AND public.has_organization_role(c.organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[])));

CREATE POLICY "Organization members manage signal opportunities" ON public.signal_opportunities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.signal_campaigns c WHERE c.id = signal_opportunities.campaign_id AND public.has_organization_role(c.organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[])))
  WITH CHECK (EXISTS (SELECT 1 FROM public.signal_campaigns c WHERE c.id = signal_opportunities.campaign_id AND public.has_organization_role(c.organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[])));

CREATE POLICY "Organization members manage signal opportunity drafts" ON public.signal_opportunity_drafts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.signal_opportunities o JOIN public.signal_campaigns c ON c.id = o.campaign_id WHERE o.id = signal_opportunity_drafts.opportunity_id AND public.has_organization_role(c.organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[])))
  WITH CHECK (EXISTS (SELECT 1 FROM public.signal_opportunities o JOIN public.signal_campaigns c ON c.id = o.campaign_id WHERE o.id = signal_opportunity_drafts.opportunity_id AND public.has_organization_role(c.organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[])));

CREATE POLICY "Organization members manage signal source runs" ON public.signal_source_runs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.signal_sources s JOIN public.signal_campaigns c ON c.id = s.campaign_id WHERE s.id = signal_source_runs.source_id AND public.has_organization_role(c.organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[])));

CREATE TRIGGER signal_campaigns_updated_at BEFORE UPDATE ON public.signal_campaigns FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER signal_sources_updated_at BEFORE UPDATE ON public.signal_sources FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER signal_opportunities_updated_at BEFORE UPDATE ON public.signal_opportunities FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER signal_opportunity_drafts_updated_at BEFORE UPDATE ON public.signal_opportunity_drafts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
