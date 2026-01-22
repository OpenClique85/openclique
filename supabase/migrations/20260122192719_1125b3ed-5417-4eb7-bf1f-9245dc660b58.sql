-- Partner applications
CREATE TABLE public.partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  category TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Creator applications
CREATE TABLE public.creator_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  creator_type TEXT,
  social_links JSONB DEFAULT '{}',
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Volunteer applications (work with us)
CREATE TABLE public.volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role_interest TEXT,
  experience TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for partner_applications
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit partner applications"
ON public.partner_applications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view partner applications"
ON public.partner_applications FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update partner applications"
ON public.partner_applications FOR UPDATE
USING (is_admin());

-- RLS for creator_applications
ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit creator applications"
ON public.creator_applications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view creator applications"
ON public.creator_applications FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update creator applications"
ON public.creator_applications FOR UPDATE
USING (is_admin());

-- RLS for volunteer_applications
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit volunteer applications"
ON public.volunteer_applications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view volunteer applications"
ON public.volunteer_applications FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update volunteer applications"
ON public.volunteer_applications FOR UPDATE
USING (is_admin());