-- Create waitlist table for email capture
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  interest TEXT,
  referral_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ,
  converted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  CONSTRAINT waitlist_email_unique UNIQUE (email)
);

-- Add index for faster lookups
CREATE INDEX idx_waitlist_email ON public.waitlist(email);
CREATE INDEX idx_waitlist_created_at ON public.waitlist(created_at DESC);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can join the waitlist (insert only)
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view waitlist entries
CREATE POLICY "Admins can view waitlist"
  ON public.waitlist
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update waitlist entries (for notes, conversion tracking)
CREATE POLICY "Admins can update waitlist"
  ON public.waitlist
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete waitlist entries
CREATE POLICY "Admins can delete waitlist"
  ON public.waitlist
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add comment for documentation
COMMENT ON TABLE public.waitlist IS 'Email capture for users interested in joining before full launch. Admins can export for Mailchimp/Gmail.';