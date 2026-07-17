-- Each customer chatbot gets a public embed key and a domain allow-list.
ALTER TABLE public.client_chatbots
  ADD COLUMN IF NOT EXISTS embed_key text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  ADD COLUMN IF NOT EXISTS allowed_domains text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS model text NOT NULL DEFAULT 'google/gemini-2.5-flash';

CREATE UNIQUE INDEX IF NOT EXISTS client_chatbots_embed_key_key
  ON public.client_chatbots (embed_key);

-- Conversations and leads belong to a specific customer chatbot. Existing
-- AscendantWeb conversations remain valid with a null chatbot_id.
ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS chatbot_id uuid REFERENCES public.client_chatbots(id) ON DELETE CASCADE;

ALTER TABLE public.chat_leads
  ADD COLUMN IF NOT EXISTS chatbot_id uuid REFERENCES public.client_chatbots(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS chat_conversations_chatbot_updated_idx
  ON public.chat_conversations (chatbot_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS chat_leads_chatbot_created_idx
  ON public.chat_leads (chatbot_id, created_at DESC);
