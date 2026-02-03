/**
 * useFollows - Hooks for following/unfollowing creators and sponsors
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type FollowTargetType = 'creator' | 'sponsor';

interface FollowRecord {
  id: string;
  follower_id: string;
  creator_id: string | null;
  sponsor_id: string | null;
  notify_new_quests: boolean;
  created_at: string;
}

// Check if current user follows a creator or sponsor
export function useIsFollowing(type: FollowTargetType, targetId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-following', type, targetId, user?.id],
    queryFn: async () => {
      if (!user || !targetId) return false;

      const column = type === 'creator' ? 'creator_id' : 'sponsor_id';
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq(column, targetId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!targetId,
  });
}

// Get follower count for a creator or sponsor
export function useFollowerCount(type: FollowTargetType, targetId: string | undefined) {
  return useQuery({
    queryKey: ['follower-count', type, targetId],
    queryFn: async () => {
      if (!targetId) return 0;

      if (type === 'creator') {
        const { data, error } = await supabase
          .rpc('get_creator_follower_count', { p_creator_id: targetId });
        if (error) throw error;
        return Number(data) || 0;
      } else {
        const { data, error } = await supabase
          .rpc('get_sponsor_follower_count', { p_sponsor_id: targetId });
        if (error) throw error;
        return Number(data) || 0;
      }
    },
    enabled: !!targetId,
  });
}

// Follow a creator
export function useFollowCreator() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (creatorId: string) => {
      if (!user) throw new Error('Must be logged in to follow');

      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          creator_id: creatorId,
        });

      if (error) throw error;
    },
    onSuccess: (_, creatorId) => {
      queryClient.invalidateQueries({ queryKey: ['is-following', 'creator', creatorId] });
      queryClient.invalidateQueries({ queryKey: ['follower-count', 'creator', creatorId] });
      queryClient.invalidateQueries({ queryKey: ['followed-creators'] });
      queryClient.invalidateQueries({ queryKey: ['following-feed'] });
      toast.success('Now following this creator');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.info('Already following this creator');
      } else {
        toast.error('Failed to follow creator');
      }
    },
  });
}

// Unfollow a creator
export function useUnfollowCreator() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (creatorId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('creator_id', creatorId);

      if (error) throw error;
    },
    onSuccess: (_, creatorId) => {
      queryClient.invalidateQueries({ queryKey: ['is-following', 'creator', creatorId] });
      queryClient.invalidateQueries({ queryKey: ['follower-count', 'creator', creatorId] });
      queryClient.invalidateQueries({ queryKey: ['followed-creators'] });
      queryClient.invalidateQueries({ queryKey: ['following-feed'] });
      toast.success('Unfollowed creator');
    },
    onError: () => {
      toast.error('Failed to unfollow');
    },
  });
}

// Follow a sponsor
export function useFollowSponsor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sponsorId: string) => {
      if (!user) throw new Error('Must be logged in to follow');

      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          sponsor_id: sponsorId,
        });

      if (error) throw error;
    },
    onSuccess: (_, sponsorId) => {
      queryClient.invalidateQueries({ queryKey: ['is-following', 'sponsor', sponsorId] });
      queryClient.invalidateQueries({ queryKey: ['follower-count', 'sponsor', sponsorId] });
      queryClient.invalidateQueries({ queryKey: ['followed-sponsors'] });
      queryClient.invalidateQueries({ queryKey: ['following-feed'] });
      toast.success('Now following this brand');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.info('Already following this brand');
      } else {
        toast.error('Failed to follow brand');
      }
    },
  });
}

// Unfollow a sponsor
export function useUnfollowSponsor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sponsorId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('sponsor_id', sponsorId);

      if (error) throw error;
    },
    onSuccess: (_, sponsorId) => {
      queryClient.invalidateQueries({ queryKey: ['is-following', 'sponsor', sponsorId] });
      queryClient.invalidateQueries({ queryKey: ['follower-count', 'sponsor', sponsorId] });
      queryClient.invalidateQueries({ queryKey: ['followed-sponsors'] });
      queryClient.invalidateQueries({ queryKey: ['following-feed'] });
      toast.success('Unfollowed brand');
    },
    onError: () => {
      toast.error('Failed to unfollow');
    },
  });
}

// List all creators the user follows
export function useFollowedCreators() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['followed-creators', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          id,
          creator_id,
          created_at,
          creator_profiles!user_follows_creator_id_fkey (
            id,
            user_id,
            display_name,
            slug,
            photo_url
          )
        `)
        .eq('follower_id', user.id)
        .not('creator_id', 'is', null);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

// List all sponsors the user follows
export function useFollowedSponsors() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['followed-sponsors', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          id,
          sponsor_id,
          created_at,
          sponsor_profiles!user_follows_sponsor_id_fkey (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq('follower_id', user.id)
        .not('sponsor_id', 'is', null);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

// Get IDs of all followed creators and sponsors (for filtering)
export function useFollowedIds() {
  const { data: followedCreators = [] } = useFollowedCreators();
  const { data: followedSponsors = [] } = useFollowedSponsors();

  const creatorIds = new Set(
    followedCreators
      .map(f => (f.creator_profiles as any)?.user_id)
      .filter(Boolean)
  );
  
  const sponsorIds = new Set(
    followedSponsors
      .map(f => f.sponsor_id)
      .filter(Boolean)
  );

  const hasFollows = creatorIds.size > 0 || sponsorIds.size > 0;

  return { creatorIds, sponsorIds, hasFollows };
}
