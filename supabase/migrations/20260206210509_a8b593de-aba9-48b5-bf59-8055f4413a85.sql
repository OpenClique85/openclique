-- Drop the existing profiles_public view and create an enhanced version
DROP VIEW IF EXISTS public.profiles_public;

-- Create enhanced profiles_public view with rich preference data
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.username,
  p.created_at,
  COALESCE(p.privacy_settings->>'profile_visibility', 'public') AS visibility_level,
  COALESCE(p.privacy_settings->>'show_xp_and_badges', 'true')::boolean AS show_xp_and_badges,
  -- Display name respects privacy
  CASE
    WHEN COALESCE(p.privacy_settings->>'profile_visibility', 'public') = 'private' 
    THEN 'Private User'
    ELSE p.display_name
  END AS display_name,
  -- City only for public profiles
  CASE
    WHEN COALESCE(p.privacy_settings->>'profile_visibility', 'public') = 'public'
    THEN p.city
    ELSE NULL
  END AS city,
  -- Public preferences (filtered for public consumption)
  CASE
    WHEN COALESCE(p.privacy_settings->>'profile_visibility', 'public') = 'private'
    THEN NULL
    ELSE jsonb_build_object(
      -- Social style preferences
      'group_size', p.preferences->'group_size',
      'vibe_preference', p.preferences->'vibe_preference',
      'pace_preference', p.preferences->'pace_preference',
      'explorer_homebody', p.preferences->'explorer_homebody',
      -- Interests
      'interests', p.preferences->'interests',
      'quest_types', p.preferences->'quest_types',
      -- Context tags (new to city, remote, etc)
      'context_tags', p.preferences->'context_tags',
      'new_to_city', p.preferences->'new_to_city',
      'remote_wfh', p.preferences->'remote_wfh',
      -- Demographics (only show school if user allows)
      'area', p.preferences->'demographics'->'area',
      'school', CASE 
        WHEN COALESCE(p.preferences->'demographics'->>'show_school_publicly', 'false')::boolean = true 
        THEN p.preferences->'demographics'->'school'
        ELSE NULL
      END
    )
  END AS public_preferences
FROM public.profiles p;

-- Create public user traits view (only traits marked as public visibility)
CREATE VIEW public.user_traits_public
WITH (security_invoker = true)
AS
SELECT 
  ut.user_id,
  ut.trait_slug,
  tl.display_name,
  tl.emoji,
  tl.category,
  ut.importance
FROM public.user_traits ut
JOIN public.trait_library tl ON ut.trait_slug = tl.slug
WHERE ut.visibility = 'public'
  AND tl.is_active = true
  AND tl.is_negative = false;