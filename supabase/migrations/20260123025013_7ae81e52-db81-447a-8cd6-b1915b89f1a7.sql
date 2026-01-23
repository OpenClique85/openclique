-- Add org_creator_message to the notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'org_creator_message';