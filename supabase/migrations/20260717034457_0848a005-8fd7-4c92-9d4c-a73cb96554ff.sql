
-- Ensure every existing chatbot owner has an organization
INSERT INTO public.organizations (owner_user_id)
SELECT DISTINCT cc.owner_user_id
FROM public.client_chatbots cc
LEFT JOIN public.organizations o ON o.owner_user_id = cc.owner_user_id
WHERE o.id IS NULL;

INSERT INTO public.organization_memberships (organization_id, user_id, role)
SELECT o.id, o.owner_user_id, 'owner'
FROM public.organizations o
LEFT JOIN public.organization_memberships m
  ON m.organization_id = o.id AND m.user_id = o.owner_user_id
WHERE m.id IS NULL;

-- Backfill organization_id on existing chatbots
UPDATE public.client_chatbots cc
SET organization_id = o.id
FROM public.organizations o
WHERE cc.organization_id IS NULL AND o.owner_user_id = cc.owner_user_id;

-- Drop the per-owner unique so multiple orgs per owner are allowed
ALTER TABLE public.client_chatbots DROP CONSTRAINT IF EXISTS client_chatbots_owner_user_id_key;
