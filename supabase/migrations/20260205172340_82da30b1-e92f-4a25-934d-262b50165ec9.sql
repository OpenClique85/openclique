-- Phase 1.1: Add media columns to squad_chat_messages
ALTER TABLE squad_chat_messages 
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image', 'video')),
ADD COLUMN IF NOT EXISTS is_proof_submission boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS proof_status text DEFAULT 'approved' CHECK (proof_status IN ('pending', 'approved', 'rejected'));

-- Phase 1.2: Extend feedback table for NPS & Venue Questions
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS nps_score integer CHECK (nps_score BETWEEN 0 AND 10),
ADD COLUMN IF NOT EXISTS would_invite_friend boolean,
ADD COLUMN IF NOT EXISTS venue_interest_rating integer CHECK (venue_interest_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS venue_revisit_intent text,
ADD COLUMN IF NOT EXISTS sponsor_enhancement text,
ADD COLUMN IF NOT EXISTS venue_improvement_notes text,
ADD COLUMN IF NOT EXISTS preferred_clique_members uuid[];

-- Phase 1.3: Extend feedback_requests for Expiry & Reminders
ALTER TABLE feedback_requests
ADD COLUMN IF NOT EXISTS instance_id uuid REFERENCES quest_instances(id),
ADD COLUMN IF NOT EXISTS expires_at timestamptz,
ADD COLUMN IF NOT EXISTS reminder_sent_3d boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent_6d boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS started_at timestamptz,
ADD COLUMN IF NOT EXISTS completion_time_seconds integer;