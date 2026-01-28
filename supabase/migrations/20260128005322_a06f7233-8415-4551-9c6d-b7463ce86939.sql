-- Add input validation CHECK constraints to all application tables
-- This prevents spam, invalid data, and resource exhaustion at the database level

-- Email validation regex pattern (used across all tables)
-- Pattern: basic email format validation

-- =====================
-- partner_applications
-- =====================
ALTER TABLE public.partner_applications
  ADD CONSTRAINT partner_valid_email 
    CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT partner_business_name_length
    CHECK (length(business_name) BETWEEN 1 AND 200),
  ADD CONSTRAINT partner_contact_name_length
    CHECK (length(contact_name) BETWEEN 1 AND 100),
  ADD CONSTRAINT partner_message_length
    CHECK (message IS NULL OR length(message) <= 5000),
  ADD CONSTRAINT partner_category_length
    CHECK (category IS NULL OR length(category) <= 100);

-- =====================
-- creator_applications
-- =====================
ALTER TABLE public.creator_applications
  ADD CONSTRAINT creator_valid_email 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT creator_name_length
    CHECK (length(name) BETWEEN 1 AND 100),
  ADD CONSTRAINT creator_message_length
    CHECK (message IS NULL OR length(message) <= 5000),
  ADD CONSTRAINT creator_type_length
    CHECK (creator_type IS NULL OR length(creator_type) <= 50);

-- =====================
-- sponsor_applications
-- =====================
ALTER TABLE public.sponsor_applications
  ADD CONSTRAINT sponsor_valid_email 
    CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT sponsor_business_name_length
    CHECK (length(business_name) BETWEEN 1 AND 200),
  ADD CONSTRAINT sponsor_contact_name_length
    CHECK (length(contact_name) BETWEEN 1 AND 100),
  ADD CONSTRAINT sponsor_description_length
    CHECK (description IS NULL OR length(description) <= 5000),
  ADD CONSTRAINT sponsor_type_length
    CHECK (length(sponsor_type) BETWEEN 1 AND 50),
  ADD CONSTRAINT sponsor_website_length
    CHECK (website IS NULL OR length(website) <= 500);

-- =====================
-- org_applications
-- =====================
ALTER TABLE public.org_applications
  ADD CONSTRAINT org_name_length
    CHECK (length(name) BETWEEN 1 AND 200),
  ADD CONSTRAINT org_description_length
    CHECK (description IS NULL OR length(description) <= 5000),
  ADD CONSTRAINT org_category_length
    CHECK (category IS NULL OR length(category) <= 100),
  ADD CONSTRAINT org_intended_audience_length
    CHECK (intended_audience IS NULL OR length(intended_audience) <= 500),
  ADD CONSTRAINT org_decline_reason_length
    CHECK (decline_reason IS NULL OR length(decline_reason) <= 1000);

-- Add comment explaining the validation
COMMENT ON CONSTRAINT partner_valid_email ON public.partner_applications IS 'Validates email format to prevent invalid submissions';
COMMENT ON CONSTRAINT creator_valid_email ON public.creator_applications IS 'Validates email format to prevent invalid submissions';
COMMENT ON CONSTRAINT sponsor_valid_email ON public.sponsor_applications IS 'Validates email format to prevent invalid submissions';