-- Add first_response_at column to track admin response time
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ;