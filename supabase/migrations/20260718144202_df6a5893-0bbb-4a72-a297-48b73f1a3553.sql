
-- ============ signal_campaigns ============
CREATE TABLE public.signal_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  offer text NOT NULL,
  ideal_customer text NOT NULL,
  service_area text DEFAULT '',
  match_keywords text[] NOT NULL DEFAULT '{}',
  intent_phrases text[] NOT NULL DEFAULT '{}',
  sender_name text DEFAULT '',
  sender_email text DEFAULT '',
  postal_address text DEFAULT '',
  opt_out_email text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_campaigns TO authenticated;
GRANT ALL ON public.signal_campaigns TO service_role;
ALTER TABLE public.signal_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their campaigns" ON public.signal_campaigns FOR ALL TO authenticated
  USING (organization_id IN (SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()));
CREATE TRIGGER signal_campaigns_updated BEFORE UPDATE ON public.signal_campaigns FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ signal_sources ============
CREATE TABLE public.signal_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.signal_campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'rss',
  feed_url text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX signal_sources_campaign_idx ON public.signal_sources(campaign_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_sources TO authenticated;
GRANT ALL ON public.signal_sources TO service_role;
ALTER TABLE public.signal_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their sources" ON public.signal_sources FOR ALL TO authenticated
  USING (campaign_id IN (SELECT c.id FROM public.signal_campaigns c JOIN public.organizations o ON o.id = c.organization_id WHERE o.owner_user_id = auth.uid()))
  WITH CHECK (campaign_id IN (SELECT c.id FROM public.signal_campaigns c JOIN public.organizations o ON o.id = c.organization_id WHERE o.owner_user_id = auth.uid()));

-- ============ signal_source_runs ============
CREATE TABLE public.signal_source_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.signal_sources(id) ON DELETE CASCADE,
  status text NOT NULL,
  items_found integer DEFAULT 0,
  opportunities_added integer DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX signal_source_runs_source_idx ON public.signal_source_runs(source_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_source_runs TO authenticated;
GRANT ALL ON public.signal_source_runs TO service_role;
ALTER TABLE public.signal_source_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view their source runs" ON public.signal_source_runs FOR ALL TO authenticated
  USING (source_id IN (SELECT s.id FROM public.signal_sources s JOIN public.signal_campaigns c ON c.id = s.campaign_id JOIN public.organizations o ON o.id = c.organization_id WHERE o.owner_user_id = auth.uid()))
  WITH CHECK (source_id IN (SELECT s.id FROM public.signal_sources s JOIN public.signal_campaigns c ON c.id = s.campaign_id JOIN public.organizations o ON o.id = c.organization_id WHERE o.owner_user_id = auth.uid()));

-- ============ signal_opportunities ============
CREATE TABLE public.signal_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.signal_campaigns(id) ON DELETE CASCADE,
  source_id uuid REFERENCES public.signal_sources(id) ON DELETE SET NULL,
  source_url text NOT NULL,
  title text NOT NULL,
  excerpt text DEFAULT '',
  author_name text DEFAULT '',
  posted_at timestamptz,
  matched_terms text[] NOT NULL DEFAULT '{}',
  score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  contact_name text DEFAULT '',
  contact_email text DEFAULT '',
  company_name text DEFAULT '',
  company_website_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, source_url)
);
CREATE INDEX signal_opportunities_campaign_idx ON public.signal_opportunities(campaign_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_opportunities TO authenticated;
GRANT ALL ON public.signal_opportunities TO service_role;
ALTER TABLE public.signal_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their opportunities" ON public.signal_opportunities FOR ALL TO authenticated
  USING (campaign_id IN (SELECT c.id FROM public.signal_campaigns c JOIN public.organizations o ON o.id = c.organization_id WHERE o.owner_user_id = auth.uid()))
  WITH CHECK (campaign_id IN (SELECT c.id FROM public.signal_campaigns c JOIN public.organizations o ON o.id = c.organization_id WHERE o.owner_user_id = auth.uid()));

-- ============ signal_opportunity_drafts ============
CREATE TABLE public.signal_opportunity_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.signal_opportunities(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX signal_opportunity_drafts_opportunity_idx ON public.signal_opportunity_drafts(opportunity_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_opportunity_drafts TO authenticated;
GRANT ALL ON public.signal_opportunity_drafts TO service_role;
ALTER TABLE public.signal_opportunity_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their opportunity drafts" ON public.signal_opportunity_drafts FOR ALL TO authenticated
  USING (opportunity_id IN (SELECT op.id FROM public.signal_opportunities op JOIN public.signal_campaigns c ON c.id = op.campaign_id JOIN public.organizations o ON o.id = c.organization_id WHERE o.owner_user_id = auth.uid()))
  WITH CHECK (opportunity_id IN (SELECT op.id FROM public.signal_opportunities op JOIN public.signal_campaigns c ON c.id = op.campaign_id JOIN public.organizations o ON o.id = c.organization_id WHERE o.owner_user_id = auth.uid()));

-- ============ signal_prospects ============
CREATE TABLE public.signal_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  website_url text NOT NULL,
  page_title text DEFAULT '',
  page_description text DEFAULT '',
  score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  contact_name text DEFAULT '',
  contact_email text DEFAULT '',
  scanned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, website_url)
);
CREATE INDEX signal_prospects_organization_idx ON public.signal_prospects(organization_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_prospects TO authenticated;
GRANT ALL ON public.signal_prospects TO service_role;
ALTER TABLE public.signal_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their prospects" ON public.signal_prospects FOR ALL TO authenticated
  USING (organization_id IN (SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()));

-- ============ prospect_signals ============
CREATE TABLE public.prospect_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.signal_prospects(id) ON DELETE CASCADE,
  kind text NOT NULL,
  label text NOT NULL,
  detail text DEFAULT '',
  weight integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX prospect_signals_prospect_idx ON public.prospect_signals(prospect_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_signals TO authenticated;
GRANT ALL ON public.prospect_signals TO service_role;
ALTER TABLE public.prospect_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their prospect signals" ON public.prospect_signals FOR ALL TO authenticated
  USING (prospect_id IN (SELECT p.id FROM public.signal_prospects p JOIN public.organizations o ON o.id = p.organization_id WHERE o.owner_user_id = auth.uid()))
  WITH CHECK (prospect_id IN (SELECT p.id FROM public.signal_prospects p JOIN public.organizations o ON o.id = p.organization_id WHERE o.owner_user_id = auth.uid()));

-- ============ prospect_email_drafts ============
CREATE TABLE public.prospect_email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.signal_prospects(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX prospect_email_drafts_prospect_idx ON public.prospect_email_drafts(prospect_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_email_drafts TO authenticated;
GRANT ALL ON public.prospect_email_drafts TO service_role;
ALTER TABLE public.prospect_email_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their prospect drafts" ON public.prospect_email_drafts FOR ALL TO authenticated
  USING (prospect_id IN (SELECT p.id FROM public.signal_prospects p JOIN public.organizations o ON o.id = p.organization_id WHERE o.owner_user_id = auth.uid()))
  WITH CHECK (prospect_id IN (SELECT p.id FROM public.signal_prospects p JOIN public.organizations o ON o.id = p.organization_id WHERE o.owner_user_id = auth.uid()));
