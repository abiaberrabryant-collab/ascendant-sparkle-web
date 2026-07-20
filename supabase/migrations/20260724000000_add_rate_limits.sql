-- Fixed-window rate limiting for public endpoints (instant demo + chatbot chat).
-- Only the service role touches this table, so RLS is enabled with no policies.

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  bucket text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Atomically increments the counter for a bucket within its current window and
-- returns true when the request is still within the allowed limit.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_count integer;
BEGIN
  INSERT INTO public.api_rate_limits (bucket, count, reset_at)
  VALUES (p_key, 1, v_now + make_interval(secs => p_window_seconds))
  ON CONFLICT (bucket) DO UPDATE
    SET count = CASE
          WHEN public.api_rate_limits.reset_at < v_now THEN 1
          ELSE public.api_rate_limits.count + 1
        END,
        reset_at = CASE
          WHEN public.api_rate_limits.reset_at < v_now
            THEN v_now + make_interval(secs => p_window_seconds)
          ELSE public.api_rate_limits.reset_at
        END
  RETURNING count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;
