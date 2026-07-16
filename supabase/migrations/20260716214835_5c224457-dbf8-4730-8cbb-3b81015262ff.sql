
-- Remove overly permissive public read on chatbot_settings
DROP POLICY IF EXISTS "Public can read settings" ON public.chatbot_settings;
REVOKE SELECT ON public.chatbot_settings FROM anon;

-- Keep authenticated admin access (admins already restricted via existing policies). Add SELECT policy for admins.
CREATE POLICY "Admins can read settings" ON public.chatbot_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Safe public accessor exposing only non-sensitive display fields
CREATE OR REPLACE FUNCTION public.get_public_chatbot_settings()
RETURNS TABLE (
  enabled boolean,
  greeting text,
  suggested_prompts jsonb,
  brand_color text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT enabled, greeting, suggested_prompts, brand_color
  FROM public.chatbot_settings
  WHERE singleton = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_chatbot_settings() TO anon, authenticated;
