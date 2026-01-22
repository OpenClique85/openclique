import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CreatorInfo {
  user_id: string;
  slug: string | null;
  display_name: string;
  photo_url: string | null;
  city: string | null;
}

/**
 * Hook to fetch creator profile slugs and basic info for linking
 */
export function useCreatorSlugs(creatorIds: string[]) {
  return useQuery({
    queryKey: ['creator-slugs', creatorIds],
    queryFn: async () => {
      if (creatorIds.length === 0) return new Map<string, CreatorInfo>();
      
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('user_id, slug, display_name, photo_url, city')
        .in('user_id', creatorIds)
        .eq('status', 'active');
      
      if (error) {
        console.error('Error fetching creator slugs:', error);
        return new Map<string, CreatorInfo>();
      }
      
      return new Map(
        data?.map(c => [c.user_id, c as CreatorInfo]) || []
      );
    },
    enabled: creatorIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to fetch a single creator's slug
 */
export function useCreatorSlug(creatorId: string | undefined) {
  return useQuery({
    queryKey: ['creator-slug', creatorId],
    queryFn: async () => {
      if (!creatorId) return null;
      
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('user_id, slug, display_name, photo_url, city')
        .eq('user_id', creatorId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching creator slug:', error);
        return null;
      }
      
      return data as CreatorInfo | null;
    },
    enabled: !!creatorId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch all active creators for filter dropdowns
 */
export function useActiveCreators() {
  return useQuery({
    queryKey: ['active-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('user_id, slug, display_name, photo_url, city')
        .eq('status', 'active')
        .order('display_name');
      
      if (error) {
        console.error('Error fetching active creators:', error);
        return [];
      }
      
      return data as CreatorInfo[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
