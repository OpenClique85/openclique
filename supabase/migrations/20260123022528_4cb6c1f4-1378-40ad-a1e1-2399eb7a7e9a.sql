-- Organizations System - MVP Schema

-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Enums
CREATE TYPE public.organization_type AS ENUM ('university', 'fraternity', 'sorority', 'club', 'company', 'nonprofit', 'other');
CREATE TYPE public.org_member_role AS ENUM ('member', 'admin', 'creator');
CREATE TYPE public.quest_visibility AS ENUM ('public', 'org_only', 'invite_only');

-- Organizations Table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type public.organization_type NOT NULL DEFAULT 'club',
  school_affiliation TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#14B8A6',
  description TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  contact_email TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Profile-Organizations Junction
CREATE TABLE public.profile_organizations (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.org_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, org_id)
);

ALTER TABLE public.profile_organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins manage orgs" ON public.organizations FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "View verified orgs" ON public.organizations FOR SELECT USING (is_active = true AND is_verified = true);

CREATE POLICY "Users view own memberships" ON public.profile_organizations FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users join orgs" ON public.profile_organizations FOR INSERT WITH CHECK (profile_id = auth.uid() AND role = 'member');
CREATE POLICY "Users leave orgs" ON public.profile_organizations FOR DELETE USING (profile_id = auth.uid());
CREATE POLICY "Admins manage memberships" ON public.profile_organizations FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Add to quests
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS visibility public.quest_visibility NOT NULL DEFAULT 'public';

-- Trigger
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sample UT org
INSERT INTO public.organizations (name, slug, type, school_affiliation, primary_color, description, is_verified, is_active)
VALUES ('UT Austin Student Community', 'ut-austin-community', 'university', 'ut_austin', '#BF5700', 'Connect with fellow Longhorns!', true, true);