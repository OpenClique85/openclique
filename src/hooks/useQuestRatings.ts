import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QuestRating {
  quest_id: string;
  avg_rating: number | null;
  review_count: number;
}

/**
 * Fetches all quest ratings from the quest_ratings view.
 * Returns a map for efficient lookup by quest_id.
 */
export function useQuestRatings() {
  return useQuery({
    queryKey: ['quest-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_ratings')
        .select('quest_id, avg_rating, review_count');
      
      if (error) {
        console.error('Error fetching quest ratings:', error);
        return new Map<string, QuestRating>();
      }
      
      // Create a map for O(1) lookup
      const ratingsMap = new Map<string, QuestRating>();
      data?.forEach((rating) => {
        if (rating.quest_id) {
          ratingsMap.set(rating.quest_id, {
            quest_id: rating.quest_id,
            avg_rating: rating.avg_rating ? Number(rating.avg_rating) : null,
            review_count: Number(rating.review_count) || 0,
          });
        }
      });
      
      return ratingsMap;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Helper hook to get rating for a specific quest.
 */
export function useQuestRating(questId: string | undefined) {
  const { data: ratingsMap, isLoading } = useQuestRatings();
  
  if (!questId || !ratingsMap) {
    return { rating: null, reviewCount: 0, isLoading };
  }
  
  const rating = ratingsMap.get(questId);
  return {
    rating: rating?.avg_rating ?? null,
    reviewCount: rating?.review_count ?? 0,
    isLoading,
  };
}
