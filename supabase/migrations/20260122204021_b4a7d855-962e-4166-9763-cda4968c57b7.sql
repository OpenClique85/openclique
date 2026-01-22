-- Add feedback_request to notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'feedback_request';