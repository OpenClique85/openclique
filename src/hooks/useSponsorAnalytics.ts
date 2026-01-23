import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SponsorAnalytics {
  totalSponsoredQuests: number;
  totalParticipants: number;
  totalRedemptions: number;
  totalRewards: number;
  averageRating: number | null;
  redemptionRate: number;
  completionRate: number;
  questBreakdown: Array<{
    questId: string;
    questTitle: string;
    questDate: string | null;
    participants: number;
    completionRate: number;
    avgRating: number | null;
    redemptions: number;
    rewardsAttached: number;
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
  engagementTrend: Array<{
    month: string;
    participants: number;
    redemptions: number;
  }>;
}

export function useSponsorAnalytics(sponsorId: string | undefined) {
  return useQuery({
    queryKey: ['sponsor-analytics', sponsorId],
    queryFn: async (): Promise<SponsorAnalytics> => {
      const emptyAnalytics: SponsorAnalytics = {
        totalSponsoredQuests: 0,
        totalParticipants: 0,
        totalRedemptions: 0,
        totalRewards: 0,
        averageRating: null,
        redemptionRate: 0,
        completionRate: 0,
        questBreakdown: [],
        testimonials: [],
        redemptionsByMonth: [],
        engagementTrend: [],
      };

      if (!sponsorId) {
        return emptyAnalytics;
      }

      // Get sponsored quests with quest details and rewards attached
      const { data: sponsoredQuests, error: sqError } = await supabase
        .from('sponsored_quests')
        .select(`
          quest_id,
          rewards_attached,
          quests:quest_id(id, title, start_datetime, status)
        `)
        .eq('sponsor_id', sponsorId);

      if (sqError) throw sqError;

      const questIds = sponsoredQuests?.map(sq => sq.quest_id).filter(Boolean) || [];

      if (questIds.length === 0) {
        return emptyAnalytics;
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
      const confirmedSignups = signups?.filter(s => 
        ['confirmed', 'completed'].includes(s.status || '')
      ) || [];
      const completedSignups = signups?.filter(s => s.status === 'completed') || [];
      
      const totalParticipants = confirmedSignups.length;
      const totalRedemptions = redemptions?.length || 0;
      const totalRewards = rewards?.length || 0;

      // Calculate rates
      const redemptionRate = totalParticipants > 0 
        ? (totalRedemptions / totalParticipants) * 100 
        : 0;
      const overallCompletionRate = confirmedSignups.length > 0 
        ? (completedSignups.length / confirmedSignups.length) * 100 
        : 0;

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
        const rewardsAttached = Array.isArray(sq.rewards_attached) ? sq.rewards_attached.length : 0;

        return {
          questId: quest.id,
          questTitle: quest.title,
          questDate: quest.start_datetime,
          participants: confirmed,
          completionRate: confirmed > 0 ? (completed / confirmed) * 100 : 0,
          avgRating: questAvgRating,
          redemptions: questRedemptions,
          rewardsAttached,
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

      // Engagement trend by month (participants + redemptions)
      const engagementByMonth: Record<string, { participants: number; redemptions: number }> = {};
      
      // Add participants by quest date
      questBreakdown.forEach(q => {
        if (q.questDate) {
          const month = new Date(q.questDate).toISOString().slice(0, 7);
          if (!engagementByMonth[month]) {
            engagementByMonth[month] = { participants: 0, redemptions: 0 };
          }
          engagementByMonth[month].participants += q.participants;
        }
      });

      // Add redemptions
      Object.entries(redemptionsByMonth).forEach(([month, count]) => {
        if (!engagementByMonth[month]) {
          engagementByMonth[month] = { participants: 0, redemptions: 0 };
        }
        engagementByMonth[month].redemptions = count;
      });

      const engagementTrend = Object.entries(engagementByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12) // Last 12 months
        .map(([month, data]) => ({ month, ...data }));

      return {
        totalSponsoredQuests: questIds.length,
        totalParticipants,
        totalRedemptions,
        totalRewards,
        averageRating,
        redemptionRate,
        completionRate: overallCompletionRate,
        questBreakdown,
        testimonials,
        redemptionsByMonth: sortedMonths,
        engagementTrend,
      };
    },
    enabled: !!sponsorId,
  });
}
