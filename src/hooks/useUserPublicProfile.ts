/**
 * Hook for fetching public profile data for a user
 * Respects privacy settings and returns only publicly visible data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicPreferences {
  group_size?: string;
  vibe_preference?: number;
  pace_preference?: number;
  explorer_homebody?: number;
  interests?: string[];
  quest_types?: string[];
  context_tags?: string[];
  new_to_city?: boolean;
  remote_wfh?: boolean;
  area?: string;
  school?: string | null;
}

export interface PublicTrait {
  trait_slug: string;
  display_name: string;
  emoji: string | null;
  category: string;
  importance: number;
}

export interface UserPublicProfile {
  id: string;
  display_name: string;
  username: string | null;
  city: string | null;
  created_at: string;
  visibility_level: 'public' | 'squad-only' | 'private';
  show_xp_and_badges: boolean;
  public_preferences: PublicPreferences | null;
  traits: PublicTrait[];
  xp?: number;
  level?: number;
  badges?: Array<{
    id: string;
    name: string;
    icon: string | null;
    rarity: string | null;
  }>;
}

export function useUserPublicProfile(userId: string | null) {
  return useQuery({
    queryKey: ['user-public-profile', userId],
    queryFn: async (): Promise<UserPublicProfile | null> => {
      if (!userId) return null;

      // Fetch profile from enhanced view
      const { data: profile, error: profileError } = await supabase
        .from('profiles_public')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('Error fetching public profile:', profileError);
        return null;
      }

      // Fetch public traits
      const { data: traits } = await supabase
        .from('user_traits_public')
        .select('*')
        .eq('user_id', userId)
        .order('importance', { ascending: false })
        .limit(6);

      // Fetch XP and badges if privacy allows
      let xpData = null;
      let badgesData = null;
      
      if (profile.show_xp_and_badges) {
        const { data: xp } = await supabase
          .from('user_xp')
          .select('xp_earned')
          .eq('user_id', userId)
          .maybeSingle();
        
        xpData = xp;

        // Fetch featured badges (max 3)
        const { data: badges } = await supabase
          .from('user_badges')
          .select(`
            badge_id,
            badge_templates (
              id,
              name,
              icon,
              rarity
            )
          `)
          .eq('user_id', userId)
          .eq('is_featured', true)
          .limit(3);
        
        badgesData = badges;
      }

      // Calculate level from XP
      const xpTotal = xpData?.xp_earned || 0;
      const level = Math.floor(xpTotal / 100) + 1;

      return {
        id: profile.id,
        display_name: profile.display_name,
        username: profile.username,
        city: profile.city,
        created_at: profile.created_at,
        visibility_level: profile.visibility_level as 'public' | 'squad-only' | 'private',
        show_xp_and_badges: profile.show_xp_and_badges,
        public_preferences: profile.public_preferences as PublicPreferences | null,
        traits: (traits || []).map(t => ({
          trait_slug: t.trait_slug,
          display_name: t.display_name,
          emoji: t.emoji,
          category: t.category,
          importance: t.importance,
        })),
        xp: profile.show_xp_and_badges ? xpTotal : undefined,
        level: profile.show_xp_and_badges ? level : undefined,
        badges: profile.show_xp_and_badges && badgesData 
          ? badgesData.map(b => ({
              id: b.badge_templates?.id || b.badge_id,
              name: b.badge_templates?.name || 'Badge',
              icon: b.badge_templates?.icon || null,
              rarity: b.badge_templates?.rarity || null,
            }))
          : undefined,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
