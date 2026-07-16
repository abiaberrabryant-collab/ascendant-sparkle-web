-- One independently configurable chatbot per customer account.
CREATE TABLE public.client_chatbots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL DEFAULT '', website_url text NOT NULL DEFAULT '',
  business_description text NOT NULL DEFAULT '', services text NOT NULL DEFAULT '',
  hours_and_contact text NOT NULL DEFAULT '', faq_and_policies text NOT NULL DEFAULT '',
  boundaries text NOT NULL DEFAULT '',
  handoff_message text NOT NULL DEFAULT 'I want to make sure you get the right answer. I’ll pass this to our team.',
  greeting text NOT NULL DEFAULT 'Hi! How can I help today?', tone text NOT NULL DEFAULT 'Friendly and professional',
  brand_color text NOT NULL DEFAULT '#2563eb', lead_questions text NOT NULL DEFAULT '', is_live boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_chatbots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can view their chatbot" ON public.client_chatbots FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "Customers can create their chatbot" ON public.client_chatbots FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Customers can update their chatbot" ON public.client_chatbots FOR UPDATE TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER set_client_chatbots_updated_at BEFORE UPDATE ON public.client_chatbots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
