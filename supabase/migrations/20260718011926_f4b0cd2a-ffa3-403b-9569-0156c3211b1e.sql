DROP POLICY IF EXISTS "Actors insert their audit logs" ON public.audit_logs;

CREATE POLICY "Actors insert their org audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  actor_user_id = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.organization_memberships m WHERE m.organization_id = organization_id AND m.user_id = auth.uid())
  )
);