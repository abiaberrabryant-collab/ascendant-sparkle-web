-- Indexes for common ordered lookups
CREATE INDEX IF NOT EXISTS subscriptions_user_env_created_idx
  ON public.subscriptions (user_id, environment, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_user_env_created_idx
  ON public.orders (user_id, environment, created_at DESC);
CREATE INDEX IF NOT EXISTS subscriptions_created_idx
  ON public.subscriptions (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_created_idx
  ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS contact_inquiries_created_idx
  ON public.contact_inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS contact_inquiries_status_idx
  ON public.contact_inquiries (status);

-- Web Vitals / performance telemetry
CREATE TABLE IF NOT EXISTS public.perf_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route TEXT NOT NULL,
  metric TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  rating TEXT,
  navigation_type TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.perf_metrics TO service_role;
-- No anon/authenticated grants: writes go through the webhook using service role,
-- and only admins read via a server function.

ALTER TABLE public.perf_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read perf metrics"
  ON public.perf_metrics
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS perf_metrics_route_metric_created_idx
  ON public.perf_metrics (route, metric, created_at DESC);
CREATE INDEX IF NOT EXISTS perf_metrics_created_idx
  ON public.perf_metrics (created_at DESC);