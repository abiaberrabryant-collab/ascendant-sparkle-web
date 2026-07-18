DROP POLICY IF EXISTS "Actors insert their org audit logs" ON public.audit_logs;
CREATE POLICY "Actors insert their org audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.organization_memberships m
      WHERE m.organization_id = audit_logs.organization_id
        AND m.user_id = auth.uid()
    )
  );