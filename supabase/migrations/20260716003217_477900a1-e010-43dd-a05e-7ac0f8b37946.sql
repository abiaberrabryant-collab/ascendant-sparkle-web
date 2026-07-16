-- Safety net: allow subscriptions.user_id to be null (for legacy/guest webhook events)
ALTER TABLE public.subscriptions ALTER COLUMN user_id DROP NOT NULL;

-- Add status tracking to contact_inquiries for admin workflow
ALTER TABLE public.contact_inquiries
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

-- Constrain values
DO $$ BEGIN
  ALTER TABLE public.contact_inquiries
    ADD CONSTRAINT contact_inquiries_status_check
    CHECK (status IN ('new', 'contacted', 'archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow admins to update inquiries (mark contacted / archive)
DROP POLICY IF EXISTS "Admins can update inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can update inquiries"
  ON public.contact_inquiries
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));