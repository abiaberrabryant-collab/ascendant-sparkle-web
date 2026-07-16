
DROP POLICY IF EXISTS "Anyone can create conversation" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can update conversation" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can insert lead" ON public.chat_leads;
REVOKE INSERT, UPDATE ON public.chat_conversations FROM anon, authenticated;
REVOKE INSERT ON public.chat_messages FROM anon, authenticated;
REVOKE INSERT ON public.chat_leads FROM anon, authenticated;
