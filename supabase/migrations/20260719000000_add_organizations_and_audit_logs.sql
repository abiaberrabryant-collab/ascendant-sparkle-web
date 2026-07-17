-- Tenant foundation: every customer-facing resource is owned by an organization.
CREATE TYPE public.organization_role AS ENUM ('owner', 'staff', 'viewer');

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name text NOT NULL,
  website_url text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  service_area text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.organization_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE OR REPLACE FUNCTION public.has_organization_role(_organization_id uuid, _user_id uuid, _roles public.organization_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = _organization_id AND user_id = _user_id AND role = ANY(_roles)
  )
$$;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create their organization" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Members view organization" ON public.organizations FOR SELECT TO authenticated
  USING (public.has_organization_role(id, auth.uid(), ARRAY['owner','staff','viewer']::public.organization_role[]));
CREATE POLICY "Owners update organization" ON public.organizations FOR UPDATE TO authenticated
  USING (public.has_organization_role(id, auth.uid(), ARRAY['owner']::public.organization_role[]));
CREATE POLICY "Members view memberships" ON public.organization_memberships FOR SELECT TO authenticated
  USING (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner','staff','viewer']::public.organization_role[]));
CREATE POLICY "Owners create their membership" ON public.organization_memberships FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'owner');
CREATE POLICY "Owners manage memberships" ON public.organization_memberships FOR ALL TO authenticated
  USING (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner']::public.organization_role[]))
  WITH CHECK (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner']::public.organization_role[]));

-- Backfill one organization for each existing customer chatbot owner.
INSERT INTO public.organizations (owner_user_id, name)
SELECT c.owner_user_id, COALESCE(NULLIF(p.full_name, ''), 'My business')
FROM public.client_chatbots c
LEFT JOIN public.profiles p ON p.id = c.owner_user_id
ON CONFLICT DO NOTHING;

INSERT INTO public.organization_memberships (organization_id, user_id, role)
SELECT o.id, o.owner_user_id, 'owner'
FROM public.organizations o
ON CONFLICT DO NOTHING;

ALTER TABLE public.client_chatbots ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.client_chatbots c SET organization_id = o.id FROM public.organizations o WHERE o.owner_user_id = c.owner_user_id AND c.organization_id IS NULL;
CREATE INDEX IF NOT EXISTS client_chatbots_organization_idx ON public.client_chatbots(organization_id);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_organization_created_idx ON public.audit_logs(organization_id, created_at DESC);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner','staff','viewer']::public.organization_role[]));

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
