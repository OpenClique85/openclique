-- Add SLA tracking columns to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS first_response_sla_breached_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolution_sla_breached_at TIMESTAMPTZ;

-- Create ticket satisfaction table for CSAT scores
CREATE TABLE public.ticket_satisfaction (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ticket_id)
);

-- Enable RLS
ALTER TABLE public.ticket_satisfaction ENABLE ROW LEVEL SECURITY;

-- Users can view their own satisfaction ratings
CREATE POLICY "Users can view own satisfaction ratings"
  ON public.ticket_satisfaction FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create satisfaction ratings for their own tickets
CREATE POLICY "Users can create satisfaction ratings for own tickets"
  ON public.ticket_satisfaction FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE id = ticket_id 
      AND user_id = auth.uid()
      AND status = 'resolved'
    )
  );

-- Admins can view all satisfaction ratings
CREATE POLICY "Admins can view all satisfaction ratings"
  ON public.ticket_satisfaction FOR SELECT
  USING (public.is_admin());

-- Enable realtime for satisfaction ratings
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_satisfaction;