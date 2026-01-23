-- ============================================
-- SECURITY FIXES MIGRATION
-- ============================================

-- 1. Add unique constraint to prevent duplicate quest signups
ALTER TABLE public.quest_signups 
ADD CONSTRAINT unique_user_quest_signup UNIQUE (user_id, quest_id);

-- 2. Drop overly permissive XP INSERT policies
-- XP should only be managed via SECURITY DEFINER RPC functions
DROP POLICY IF EXISTS "Users can insert their own XP" ON public.user_xp;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.xp_transactions;

-- 3. Create admin audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit log
CREATE POLICY "Only admins can view audit log"
ON public.admin_audit_log FOR SELECT
USING (public.is_admin());

-- Only admins can insert audit entries
CREATE POLICY "Only admins can insert audit entries"
ON public.admin_audit_log FOR INSERT
WITH CHECK (public.is_admin());