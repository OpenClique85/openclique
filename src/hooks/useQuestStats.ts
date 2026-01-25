/**
 * Hook to fetch signup counts and squad counts for quests
 * Provides REAL-TIME popularity data for quest cards via Supabase Realtime
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface QuestStats {
  signupCount: number;
  squadCount: number;
  fillPercentage: number;
}

export function useQuestStats(questId: string | undefined) {
  const queryClient = useQueryClient();

  // Set up realtime subscription for this specific quest
  useEffect(() => {
    if (!questId) return;

    const channel = supabase
      .channel(`quest-signups-${questId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'quest_signups',
          filter: `quest_id=eq.${questId}`,
        },
        () => {
          // Invalidate query to refetch fresh counts
          queryClient.invalidateQueries({ queryKey: ['quest-stats', questId] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [questId, queryClient]);

  return useQuery({
    queryKey: ['quest-stats', questId],
    queryFn: async (): Promise<QuestStats> => {
      if (!questId) return { signupCount: 0, squadCount: 0, fillPercentage: 0 };

      // Fetch signup count and squad count
      const [signupsResult, squadsResult] = await Promise.all([
        supabase
          .from('quest_signups')
          .select('id', { count: 'exact', head: true })
          .eq('quest_id', questId)
          .not('status', 'in', '("dropped","no_show")'),
        supabase
          .from('quest_squads')
          .select('id', { count: 'exact', head: true })
          .eq('quest_id', questId)
          .not('status', 'eq', 'cancelled'),
      ]);

      const signupCount = signupsResult.count || 0;
      const squadCount = squadsResult.count || 0;

      return {
        signupCount,
        squadCount,
        fillPercentage: 0, // Would need capacity from quest metadata
      };
    },
    enabled: !!questId,
    staleTime: 30000, // Cache for 30 seconds
    // No refetchInterval - realtime handles updates now
  });
}

// Batch hook for multiple quests (more efficient for list views)
// Uses a single realtime subscription for all quest_signups changes
export function useMultipleQuestStats(questIds: string[]) {
  const queryClient = useQueryClient();

  // Set up single realtime subscription for all quest signups
  useEffect(() => {
    if (questIds.length === 0) return;

    const channel = supabase
      .channel('quest-signups-batch')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quest_signups',
        },
        (payload) => {
          // Check if the affected quest is in our list
          const affectedQuestId = (payload.new as any)?.quest_id || (payload.old as any)?.quest_id;
          if (affectedQuestId && questIds.includes(affectedQuestId)) {
            queryClient.invalidateQueries({ queryKey: ['multiple-quest-stats'] });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [questIds.join(','), queryClient]);

  return useQuery({
    queryKey: ['multiple-quest-stats', questIds.sort().join(',')],
    queryFn: async (): Promise<Record<string, QuestStats>> => {
      if (questIds.length === 0) return {};

      // Batch fetch all signups and squads
      const [signupsResult, squadsResult] = await Promise.all([
        supabase
          .from('quest_signups')
          .select('quest_id')
          .in('quest_id', questIds)
          .not('status', 'in', '("dropped","no_show")'),
        supabase
          .from('quest_squads')
          .select('quest_id')
          .in('quest_id', questIds)
          .not('status', 'eq', 'cancelled'),
      ]);

      // Count signups per quest
      const signupCounts: Record<string, number> = {};
      (signupsResult.data || []).forEach(s => {
        signupCounts[s.quest_id] = (signupCounts[s.quest_id] || 0) + 1;
      });

      // Count squads per quest
      const squadCounts: Record<string, number> = {};
      (squadsResult.data || []).forEach(s => {
        if (s.quest_id) {
          squadCounts[s.quest_id] = (squadCounts[s.quest_id] || 0) + 1;
        }
      });

      // Build result
      const result: Record<string, QuestStats> = {};
      questIds.forEach(id => {
        const signupCount = signupCounts[id] || 0;
        result[id] = {
          signupCount,
          squadCount: squadCounts[id] || 0,
          fillPercentage: 0,
        };
      });

      return result;
    },
    enabled: questIds.length > 0,
    staleTime: 30000,
    // No refetchInterval - realtime handles updates now
  });
}
