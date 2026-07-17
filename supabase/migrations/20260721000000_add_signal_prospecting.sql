-- Signal Studio stores only owner-curated business prospects and public-site
-- observations. It never sends email; drafts always require human approval.
CREATE TABLE public.signal_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT '',
  website_url text NOT NULL,
  contact_email text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'draft_ready', 'contacted', 'not_a_fit')),
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  page_title text NOT NULL DEFAULT '',
  page_description text NOT NULL DEFAULT '',
  scanned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, website_url)
);

CREATE TABLE public.prospect_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.signal_prospects(id) ON DELETE CASCADE,
  kind text NOT NULL,
  label text NOT NULL,
  detail text NOT NULL DEFAULT '',
  weight integer NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prospect_email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.signal_prospects(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'discarded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX signal_prospects_organization_score_idx ON public.signal_prospects (organization_id, score DESC, created_at DESC);
CREATE INDEX prospect_signals_prospect_idx ON public.prospect_signals (prospect_id, created_at DESC);
CREATE INDEX prospect_email_drafts_prospect_idx ON public.prospect_email_drafts (prospect_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_prospects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_signals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_email_drafts TO authenticated;

ALTER TABLE public.signal_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_email_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members manage their signal prospects" ON public.signal_prospects FOR ALL TO authenticated
  USING (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[]))
  WITH CHECK (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[]));
CREATE POLICY "Organization members manage their prospect signals" ON public.prospect_signals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.signal_prospects p WHERE p.id = prospect_signals.prospect_id AND public.has_organization_role(p.organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[])))
  WITH CHECK (EXISTS (SELECT 1 FROM public.signal_prospects p WHERE p.id = prospect_signals.prospect_id AND public.has_organization_role(p.organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[])));
CREATE POLICY "Organization members manage their prospect drafts" ON public.prospect_email_drafts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.signal_prospects p WHERE p.id = prospect_email_drafts.prospect_id AND public.has_organization_role(p.organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[])))
  WITH CHECK (EXISTS (SELECT 1 FROM public.signal_prospects p WHERE p.id = prospect_email_drafts.prospect_id AND public.has_organization_role(p.organization_id, auth.uid(), ARRAY['owner','staff']::public.organization_role[])));

CREATE TRIGGER signal_prospects_updated_at BEFORE UPDATE ON public.signal_prospects FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER prospect_email_drafts_updated_at BEFORE UPDATE ON public.prospect_email_drafts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
