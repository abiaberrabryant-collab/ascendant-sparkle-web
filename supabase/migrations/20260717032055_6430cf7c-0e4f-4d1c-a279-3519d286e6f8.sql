CREATE TABLE public.client_chatbots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL DEFAULT '',
  website_url text NOT NULL DEFAULT '',
  business_description text NOT NULL DEFAULT '',
  services text NOT NULL DEFAULT '',
  hours_and_contact text NOT NULL DEFAULT '',
  faq_and_policies text NOT NULL DEFAULT '',
  boundaries text NOT NULL DEFAULT '',
  handoff_message text NOT NULL DEFAULT 'A human will follow up shortly.',
  greeting text NOT NULL DEFAULT 'Hi! How can I help?',
  tone text NOT NULL DEFAULT 'Friendly and professional',
  brand_color text NOT NULL DEFAULT '#3b82f6',
  lead_questions text NOT NULL DEFAULT '',
  is_live boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_chatbots TO authenticated;
GRANT ALL ON public.client_chatbots TO service_role;

ALTER TABLE public.client_chatbots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their chatbot"
  ON public.client_chatbots
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Admins manage all chatbots"
  ON public.client_chatbots
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_client_chatbots_updated_at
  BEFORE UPDATE ON public.client_chatbots
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
