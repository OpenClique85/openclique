/**
 * =============================================================================
 * useRoleRanking Hook - Manages user's group role ranking (1st to 4th)
 * =============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type RoleType = 'planner' | 'connector' | 'stabilizer' | 'spark';

export interface RoleRanking {
  id: string;
  user_id: string;
  rank_1: RoleType;
  rank_2: RoleType;
  rank_3: RoleType;
  rank_4: RoleType;
  updated_at: string;
  created_at: string;
}

export interface RoleRankingInput {
  rank_1: RoleType;
  rank_2: RoleType;
  rank_3: RoleType;
  rank_4: RoleType;
}

// Role metadata
export const ROLE_METADATA: Record<
  RoleType,
  {
    label: string;
    description: string;
    icon: string;
    examples: string;
  }
> = {
  planner: {
    label: 'Planner Energy',
    description: 'Organizes, coordinates, keeps things on track',
    icon: '📋',
    examples: 'Making reservations, sending reminders, creating itineraries',
  },
  connector: {
    label: 'Connector Energy',
    description: 'Introduces people, includes everyone, bridges groups',
    icon: '🔗',
    examples: 'Introducing strangers, inviting +1s, making sure no one is left out',
  },
  stabilizer: {
    label: 'Stabilizer Energy',
    description: 'Calms tensions, supports others, steady presence',
    icon: '⚓',
    examples: 'Mediating disagreements, checking in on quiet members, being reliable',
  },
  spark: {
    label: 'Spark Energy',
    description: 'Energizes, initiates ideas, brings excitement',
    icon: '⚡',
    examples: 'Suggesting spontaneous adventures, starting games, bringing the hype',
  },
};

export function useRoleRanking(userId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;
  const isOwner = user?.id === targetUserId;

  // Fetch role ranking
  const { data: ranking, isLoading } = useQuery({
    queryKey: ['role-ranking', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('user_role_rankings')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      return data as RoleRanking | null;
    },
    enabled: !!targetUserId,
  });

  // Save ranking mutation
  const saveRankingMutation = useMutation({
    mutationFn: async (input: RoleRankingInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase.from('user_role_rankings').upsert(
        {
          user_id: user.id,
          ...input,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-ranking', user?.id] });
      toast.success('Role ranking saved!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  return {
    ranking,
    isLoading,
    isOwner,
    hasRanking: !!ranking,
    primaryRole: ranking?.rank_1 || null,

    // Actions
    saveRanking: (input: RoleRankingInput) => saveRankingMutation.mutateAsync(input),
    isUpdating: saveRankingMutation.isPending,
  };
}
