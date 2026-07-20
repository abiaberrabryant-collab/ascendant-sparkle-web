ALTER TABLE public.chat_leads ADD COLUMN IF NOT EXISTS chatbot_id uuid REFERENCES public.client_chatbots(id) ON DELETE CASCADE;
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS chatbot_id uuid REFERENCES public.client_chatbots(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS chat_leads_chatbot_id_idx ON public.chat_leads(chatbot_id);
CREATE INDEX IF NOT EXISTS chat_conversations_chatbot_id_idx ON public.chat_conversations(chatbot_id);

CREATE POLICY "Owners can view their chatbot leads" ON public.chat_leads
  FOR SELECT TO authenticated USING (
    chatbot_id IN (
      SELECT cb.id FROM public.client_chatbots cb
      JOIN public.organizations o ON o.id = cb.organization_id
      WHERE o.owner_user_id = auth.uid()
    )
  );
CREATE POLICY "Owners can update their chatbot leads" ON public.chat_leads
  FOR UPDATE TO authenticated USING (
    chatbot_id IN (
      SELECT cb.id FROM public.client_chatbots cb
      JOIN public.organizations o ON o.id = cb.organization_id
      WHERE o.owner_user_id = auth.uid()
    )
  );
CREATE POLICY "Owners can view their chatbot conversations" ON public.chat_conversations
  FOR SELECT TO authenticated USING (
    chatbot_id IN (
      SELECT cb.id FROM public.client_chatbots cb
      JOIN public.organizations o ON o.id = cb.organization_id
      WHERE o.owner_user_id = auth.uid()
    )
  );