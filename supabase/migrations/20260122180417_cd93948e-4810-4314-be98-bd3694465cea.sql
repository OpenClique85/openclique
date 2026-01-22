-- ============================================
-- OPENCLIQUE V1 MVP DATABASE SCHEMA
-- ============================================

-- 1. Create custom enums
create type public.quest_status as enum ('draft', 'open', 'closed', 'completed', 'cancelled');
create type public.signup_status as enum ('pending', 'confirmed', 'standby', 'dropped', 'no_show', 'completed');
create type public.comms_type as enum ('email_invite', 'email_confirm', 'email_reminder', 'email_followup', 'email_whatsapp');
create type public.app_role as enum ('admin', 'user');

-- 2. Create profiles table (user data, removes signup fatigue)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null,
  preferences jsonb default '{}'::jsonb,
  consent_given_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Create quests table (admin creates quests)
create table public.quests (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  icon text default '🎯',
  start_datetime timestamptz,
  meeting_location_name text,
  meeting_address text,
  briefing_html text,
  capacity_total integer default 6,
  whatsapp_invite_link text,
  status public.quest_status default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Create quest_signups table (state machine for attendance)
create table public.quest_signups (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid references public.quests(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  status public.signup_status default 'pending',
  cancellation_reason text,
  notes_private text,
  signed_up_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(quest_id, user_id)
);

-- 5. Create comms_log table (track emails sent)
create table public.comms_log (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid references public.quests(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  type public.comms_type not null,
  subject text,
  sent_at timestamptz not null default now(),
  provider_message_id text
);

-- 6. Create feedback table (post-quest learning)
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid references public.quests(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  rating_1_5 integer check (rating_1_5 >= 1 and rating_1_5 <= 5),
  belonging_delta integer check (belonging_delta >= -2 and belonging_delta <= 2),
  best_part text,
  friction_point text,
  would_do_again boolean,
  submitted_at timestamptz not null default now(),
  unique(quest_id, user_id)
);

-- 7. Create user_roles table (for admin access)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Function to check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin')
$$;

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger handle_quests_updated_at
  before update on public.quests
  for each row execute function public.handle_updated_at();

create trigger handle_quest_signups_updated_at
  before update on public.quest_signups
  for each row execute function public.handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.quests enable row level security;
alter table public.quest_signups enable row level security;
alter table public.comms_log enable row level security;
alter table public.feedback enable row level security;
alter table public.user_roles enable row level security;

-- PROFILES POLICIES
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- QUESTS POLICIES
create policy "Anyone can view open quests"
  on public.quests for select
  using (status in ('open', 'closed', 'completed') or public.is_admin());

create policy "Admins can insert quests"
  on public.quests for insert
  with check (public.is_admin());

create policy "Admins can update quests"
  on public.quests for update
  using (public.is_admin());

create policy "Admins can delete quests"
  on public.quests for delete
  using (public.is_admin());

-- QUEST_SIGNUPS POLICIES
create policy "Users can view their own signups"
  on public.quest_signups for select
  using (auth.uid() = user_id);

create policy "Users can insert their own signups"
  on public.quest_signups for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own signups"
  on public.quest_signups for update
  using (auth.uid() = user_id);

create policy "Admins can view all signups"
  on public.quest_signups for select
  using (public.is_admin());

create policy "Admins can update all signups"
  on public.quest_signups for update
  using (public.is_admin());

-- COMMS_LOG POLICIES (admin only)
create policy "Admins can view comms_log"
  on public.comms_log for select
  using (public.is_admin());

create policy "Admins can insert comms_log"
  on public.comms_log for insert
  with check (public.is_admin());

-- FEEDBACK POLICIES
create policy "Users can view their own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

create policy "Users can insert their own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all feedback"
  on public.feedback for select
  using (public.is_admin());

-- USER_ROLES POLICIES (admin only via security definer)
create policy "Admins can view user_roles"
  on public.user_roles for select
  using (public.is_admin());

create policy "Admins can manage user_roles"
  on public.user_roles for all
  using (public.is_admin());