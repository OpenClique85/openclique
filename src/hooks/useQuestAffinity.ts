import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface QuestAffinity {
  trait_key: string;
  trait_weight: number;
  explanation: string | null;
}

export function useQuestAffinity(questId: string | undefined) {
  return useQuery({
    queryKey: ['quest-affinity', questId],
    queryFn: async () => {
      if (!questId) return [];

      const { data, error } = await supabase
        .from('quest_personality_affinity')
        .select('trait_key, trait_weight, explanation')
        .eq('quest_id', questId)
        .order('trait_weight', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as QuestAffinity[];
    },
    enabled: !!questId,
  });
}
