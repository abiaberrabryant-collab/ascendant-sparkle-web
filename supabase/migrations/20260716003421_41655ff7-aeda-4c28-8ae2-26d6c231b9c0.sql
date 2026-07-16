ALTER TABLE public.contact_inquiries
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'contact',
  ADD COLUMN IF NOT EXISTS website_url text;

ALTER TABLE public.contact_inquiries ALTER COLUMN message DROP NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.contact_inquiries
    ADD CONSTRAINT contact_inquiries_source_check
    CHECK (source IN ('contact', 'audit'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;