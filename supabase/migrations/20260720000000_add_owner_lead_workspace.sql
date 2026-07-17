-- Give each organization owner access only to leads and conversations from
-- their own installed chatbot. This powers the free Owner Dashboard.
ALTER TABLE public.chat_leads
  ADD COLUMN IF NOT EXISTS follow_up_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;

DROP POLICY IF EXISTS "Organization owners view their chatbot conversations" ON public.chat_conversations;
CREATE POLICY "Organization owners view their chatbot conversations"
  ON public.chat_conversations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.client_chatbots c
      JOIN public.organization_memberships m ON m.organization_id = c.organization_id
      WHERE c.id = chat_conversations.chatbot_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'staff')
    )
  );

DROP POLICY IF EXISTS "Organization owners view their chatbot messages" ON public.chat_messages;
CREATE POLICY "Organization owners view their chatbot messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_conversations conversation
      JOIN public.client_chatbots c ON c.id = conversation.chatbot_id
      JOIN public.organization_memberships m ON m.organization_id = c.organization_id
      WHERE conversation.id = chat_messages.conversation_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'staff')
    )
  );

DROP POLICY IF EXISTS "Organization owners view their chatbot leads" ON public.chat_leads;
CREATE POLICY "Organization owners view their chatbot leads"
  ON public.chat_leads FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.client_chatbots c
      JOIN public.organization_memberships m ON m.organization_id = c.organization_id
      WHERE c.id = chat_leads.chatbot_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'staff')
    )
  );

DROP POLICY IF EXISTS "Organization owners update their chatbot leads" ON public.chat_leads;
CREATE POLICY "Organization owners update their chatbot leads"
  ON public.chat_leads FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.client_chatbots c
      JOIN public.organization_memberships m ON m.organization_id = c.organization_id
      WHERE c.id = chat_leads.chatbot_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.client_chatbots c
      JOIN public.organization_memberships m ON m.organization_id = c.organization_id
      WHERE c.id = chat_leads.chatbot_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'staff')
    )
  );
