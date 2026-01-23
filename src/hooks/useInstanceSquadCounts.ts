/**
 * Hook to fetch squad counts for multiple instances
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useInstanceSquadCounts(instanceIds: string[]) {
  return useQuery({
    queryKey: ['instance-squad-counts', instanceIds],
    queryFn: async () => {
      if (instanceIds.length === 0) return {};

      const { data, error } = await supabase
        .from('quest_squads')
        .select('quest_id')
        .in('quest_id', instanceIds);

      if (error) throw error;

      // Count squads per instance
      const counts: Record<string, number> = {};
      instanceIds.forEach(id => { counts[id] = 0; });
      
      (data || []).forEach(squad => {
        if (squad.quest_id) {
          counts[squad.quest_id] = (counts[squad.quest_id] || 0) + 1;
        }
      });

      return counts;
    },
    enabled: instanceIds.length > 0,
    staleTime: 30000, // Cache for 30 seconds
  });
}
