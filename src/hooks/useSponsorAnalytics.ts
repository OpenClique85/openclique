import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SponsorAnalytics {
  totalSponsoredQuests: number;
  totalParticipants: number;
  totalRedemptions: number;
  averageRating: number | null;
  questBreakdown: Array<{
    questId: string;
    questTitle: string;
    questDate: string | null;
    participants: number;
    completionRate: number;
    avgRating: number | null;
    redemptions: number;
  }>;
  testimonials: Array<{
    questTitle: string;
    questDate: string | null;
    text: string;
    rating: number | null;
  }>;
  redemptionsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

export function useSponsorAnalytics(sponsorId: string | undefined) {
  return useQuery({
    queryKey: ['sponsor-analytics', sponsorId],
    queryFn: async (): Promise<SponsorAnalytics> => {
      if (!sponsorId) {
        return {
          totalSponsoredQuests: 0,
          totalParticipants: 0,
          totalRedemptions: 0,
          averageRating: null,
          questBreakdown: [],
          testimonials: [],
          redemptionsByMonth: [],
        };
      }

      // Get sponsored quests with quest details
      const { data: sponsoredQuests, error: sqError } = await supabase
        .from('sponsored_quests')
        .select(`
          quest_id,
          quests:quest_id(id, title, start_datetime, status)
        `)
        .eq('sponsor_id', sponsorId);

      if (sqError) throw sqError;

      const questIds = sponsoredQuests?.map(sq => sq.quest_id).filter(Boolean) || [];

      if (questIds.length === 0) {
        return {
          totalSponsoredQuests: 0,
          totalParticipants: 0,
          totalRedemptions: 0,
          averageRating: null,
          questBreakdown: [],
          testimonials: [],
          redemptionsByMonth: [],
        };
      }

      // Get signups for sponsored quests
      const { data: signups } = await supabase
        .from('quest_signups')
        .select('quest_id, status')
        .in('quest_id', questIds);

      // Get feedback/ratings for sponsored quests
      const { data: feedback } = await supabase
        .from('feedback')
        .select('quest_id, rating_1_5, testimonial_text, is_testimonial_approved')
        .in('quest_id', questIds);

      // Get rewards for this sponsor
      const { data: rewards } = await supabase
        .from('rewards')
        .select('id')
        .eq('sponsor_id', sponsorId);

      const rewardIds = rewards?.map(r => r.id) || [];

      // Get redemptions for sponsor's rewards
      const { data: redemptions } = await supabase
        .from('reward_redemptions')
        .select('id, quest_id, redeemed_at')
        .in('reward_id', rewardIds);

      // Calculate metrics
      const totalParticipants = signups?.filter(s => 
        ['confirmed', 'completed'].includes(s.status || '')
      ).length || 0;

      const totalRedemptions = redemptions?.length || 0;

      const ratings = feedback?.filter(f => f.rating_1_5).map(f => f.rating_1_5!) || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : null;

      // Quest breakdown
      const questBreakdown = (sponsoredQuests || []).map(sq => {
        const quest = sq.quests as unknown as { id: string; title: string; start_datetime: string | null; status: string } | null;
        if (!quest) return null;

        const questSignups = signups?.filter(s => s.quest_id === quest.id) || [];
        const confirmed = questSignups.filter(s => ['confirmed', 'completed'].includes(s.status || '')).length;
        const completed = questSignups.filter(s => s.status === 'completed').length;
        
        const questFeedback = feedback?.filter(f => f.quest_id === quest.id) || [];
        const questRatings = questFeedback.filter(f => f.rating_1_5).map(f => f.rating_1_5!);
        const questAvgRating = questRatings.length > 0 
          ? questRatings.reduce((a, b) => a + b, 0) / questRatings.length 
          : null;

        const questRedemptions = redemptions?.filter(r => r.quest_id === quest.id).length || 0;

        return {
          questId: quest.id,
          questTitle: quest.title,
          questDate: quest.start_datetime,
          participants: confirmed,
          completionRate: confirmed > 0 ? (completed / confirmed) * 100 : 0,
          avgRating: questAvgRating,
          redemptions: questRedemptions,
        };
      }).filter(Boolean) as SponsorAnalytics['questBreakdown'];

      // Approved testimonials
      const testimonials = (feedback || [])
        .filter(f => f.testimonial_text && f.is_testimonial_approved)
        .map(f => {
          const sq = sponsoredQuests?.find(s => s.quest_id === f.quest_id);
          const quest = sq?.quests as unknown as { title: string; start_datetime: string | null } | null;
          return {
            questTitle: quest?.title || 'Unknown Quest',
            questDate: quest?.start_datetime || null,
            text: f.testimonial_text!,
            rating: f.rating_1_5,
          };
        });

      // Redemptions by month
      const redemptionsByMonth: Record<string, number> = {};
      (redemptions || []).forEach(r => {
        const month = new Date(r.redeemed_at).toISOString().slice(0, 7); // YYYY-MM
        redemptionsByMonth[month] = (redemptionsByMonth[month] || 0) + 1;
      });

      const sortedMonths = Object.entries(redemptionsByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));

      return {
        totalSponsoredQuests: questIds.length,
        totalParticipants,
        totalRedemptions,
        averageRating,
        questBreakdown,
        testimonials,
        redemptionsByMonth: sortedMonths,
      };
    },
    enabled: !!sponsorId,
  });
}
