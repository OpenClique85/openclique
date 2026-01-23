-- PII Access Log for compliance tracking
CREATE TABLE public.pii_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  access_type TEXT NOT NULL, -- 'shadow_mode', 'profile_view', 'export', 'search'
  target_user_id UUID,
  target_table TEXT,
  accessed_fields TEXT[], -- Which PII fields were accessed
  ip_address TEXT,
  user_agent TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_pii_access_admin ON pii_access_log(admin_user_id);
CREATE INDEX idx_pii_access_target ON pii_access_log(target_user_id);
CREATE INDEX idx_pii_access_created ON pii_access_log(created_at DESC);
CREATE INDEX idx_pii_access_type ON pii_access_log(access_type);

-- Enable RLS
ALTER TABLE public.pii_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view PII access logs
CREATE POLICY "Admins can view PII access logs"
ON public.pii_access_log
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only admins can insert PII access logs (when they access data)
CREATE POLICY "Admins can log PII access"
ON public.pii_access_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() AND admin_user_id = auth.uid());

-- Rate limit monitoring table for auth failures
CREATE TABLE public.auth_rate_monitor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- email or IP
  identifier_type TEXT NOT NULL, -- 'email', 'ip'
  event_type TEXT NOT NULL, -- 'login_failed', 'signup_blocked', 'rate_limited'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for rate monitoring
CREATE INDEX idx_auth_rate_identifier ON auth_rate_monitor(identifier);
CREATE INDEX idx_auth_rate_created ON auth_rate_monitor(created_at DESC);
CREATE INDEX idx_auth_rate_type ON auth_rate_monitor(event_type);

-- Enable RLS
ALTER TABLE public.auth_rate_monitor ENABLE ROW LEVEL SECURITY;

-- Only admins can view rate monitor logs
CREATE POLICY "Admins can view rate monitor"
ON public.auth_rate_monitor
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Function to log PII access
CREATE OR REPLACE FUNCTION public.log_pii_access(
  p_access_type TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_target_table TEXT DEFAULT NULL,
  p_accessed_fields TEXT[] DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO pii_access_log (
    admin_user_id,
    access_type,
    target_user_id,
    target_table,
    accessed_fields,
    reason
  ) VALUES (
    auth.uid(),
    p_access_type,
    p_target_user_id,
    p_target_table,
    p_accessed_fields,
    p_reason
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;