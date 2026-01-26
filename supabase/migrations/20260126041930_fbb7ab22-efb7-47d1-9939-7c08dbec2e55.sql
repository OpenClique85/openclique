-- Add verification token columns to org_verified_emails
ALTER TABLE public.org_verified_emails
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Create index on verification token for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_verified_emails_token 
ON public.org_verified_emails(verification_token) 
WHERE verification_token IS NOT NULL;