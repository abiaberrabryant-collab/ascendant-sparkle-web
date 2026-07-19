-- Remove direct authenticated INSERT on audit_logs; funnel writes through a SECURITY DEFINER
-- function that validates the caller owns the referenced entity and constrains action values.

DROP POLICY IF EXISTS "Actors insert their org audit logs" ON public.audit_logs;

REVOKE INSERT ON public.audit_logs FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.log_audit_event(
  _organization_id uuid,
  _action text,
  _entity_type text,
  _entity_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _new_id uuid;
  _owns_org boolean;
  _entity_ok boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Restrict action to a known allow-list to prevent log spoofing.
  IF _action NOT IN (
    'organization.created',
    'organization.updated',
    'chatbot.updated'
  ) THEN
    RAISE EXCEPTION 'invalid action: %', _action;
  END IF;

  IF _entity_type NOT IN ('organization', 'client_chatbot') THEN
    RAISE EXCEPTION 'invalid entity_type: %', _entity_type;
  END IF;

  -- Caller must OWN the organization (not merely a member) to write its audit log.
  SELECT EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = _organization_id AND o.owner_user_id = _uid
  ) INTO _owns_org;

  IF NOT _owns_org THEN
    RAISE EXCEPTION 'not authorized for organization %', _organization_id;
  END IF;

  -- Validate the entity actually belongs to this organization.
  IF _entity_type = 'organization' THEN
    _entity_ok := (_entity_id IS NULL) OR (_entity_id = _organization_id);
  ELSIF _entity_type = 'client_chatbot' THEN
    IF _entity_id IS NULL THEN
      _entity_ok := EXISTS (
        SELECT 1 FROM public.client_chatbots c
        WHERE c.organization_id = _organization_id
      );
    ELSE
      _entity_ok := EXISTS (
        SELECT 1 FROM public.client_chatbots c
        WHERE c.id = _entity_id AND c.organization_id = _organization_id
      );
    END IF;
  END IF;

  IF NOT _entity_ok THEN
    RAISE EXCEPTION 'entity does not belong to organization';
  END IF;

  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id)
  VALUES (_organization_id, _uid, _action, _entity_type, _entity_id)
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit_event(uuid, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, uuid) TO authenticated;
