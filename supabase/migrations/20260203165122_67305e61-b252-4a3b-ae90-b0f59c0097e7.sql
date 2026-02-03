-- Add new notification types for contacts and LFG
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'contact_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'contact_accepted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'lfg_broadcast';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'lfg_response';