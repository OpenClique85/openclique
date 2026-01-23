-- Add new invite code types
ALTER TYPE invite_code_type ADD VALUE IF NOT EXISTS 'creator';
ALTER TYPE invite_code_type ADD VALUE IF NOT EXISTS 'organization';
ALTER TYPE invite_code_type ADD VALUE IF NOT EXISTS 'sponsor';