import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CreatorAnalytics {
  totalSignups: number;
  completedSignups: number;
  completionRate: number;
  avgRating: number | null;
  totalReviews: number;
  ratingDistribution: { rating: number; count: number }[];
  signupsByMonth: { month: string; count: number }[];
  testimonials: {
    id: string;
    text: string;
    questTitle: string;
    submittedAt: string;
  }[];
}

export function useCreatorAnalytics(userId: string | undefined) {
  return useQuery({
    queryKey: ['creator-analytics', userId],
    queryFn: async (): Promise<CreatorAnalytics> => {
      if (!userId) {
        return {
          totalSignups: 0,
          completedSignups: 0,
          completionRate: 0,
          avgRating: null,
          totalReviews: 0,
          ratingDistribution: [],
          signupsByMonth: [],
          testimonials: [],
        };
      }

      // Get all creator's quest IDs
      const { data: quests } = await supabase
        .from('quests')
        .select('id, title')
        .eq('creator_id', userId);

      const questIds = quests?.map(q => q.id) || [];
      const questMap = new Map(quests?.map(q => [q.id, q.title]) || []);

      if (questIds.length === 0) {
        return {
          totalSignups: 0,
          completedSignups: 0,
          completionRate: 0,
          avgRating: null,
          totalReviews: 0,
          ratingDistribution: [],
          signupsByMonth: [],
          testimonials: [],
        };
      }

      // Get signups for these quests
      const { data: signups } = await supabase
        .from('quest_signups')
        .select('id, status, signed_up_at, quest_id')
        .in('quest_id', questIds);

      const totalSignups = signups?.length || 0;
      const completedSignups = signups?.filter(s => s.status === 'completed').length || 0;
      const countableStatuses = ['confirmed', 'completed', 'no_show'];
      const countableTotal = signups?.filter(s => countableStatuses.includes(s.status || '')).length || 0;
      const completionRate = countableTotal > 0 ? (completedSignups / countableTotal) * 100 : 0;

      // Get signups by month (last 6 months)
      const signupsByMonth: { month: string; count: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const count = signups?.filter(s => {
          const signupDate = new Date(s.signed_up_at);
          return signupDate >= startOfMonth && signupDate <= endOfMonth;
        }).length || 0;
        
        signupsByMonth.push({ month: monthStr, count });
      }

      // Get feedback/ratings for these quests
      const { data: feedback } = await supabase
        .from('feedback')
        .select('id, rating_1_5, testimonial_text, is_testimonial_approved, submitted_at, quest_id')
        .in('quest_id', questIds);

      const ratingsWithValues = feedback?.filter(f => f.rating_1_5 !== null) || [];
      const totalReviews = ratingsWithValues.length;
      const avgRating = totalReviews > 0 
        ? ratingsWithValues.reduce((sum, f) => sum + (f.rating_1_5 || 0), 0) / totalReviews 
        : null;

      // Rating distribution
      const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratingsWithValues.filter(f => f.rating_1_5 === rating).length,
      }));

      // Approved testimonials
      const testimonials = (feedback || [])
        .filter(f => f.is_testimonial_approved && f.testimonial_text)
        .map(f => ({
          id: f.id,
          text: f.testimonial_text!,
          questTitle: questMap.get(f.quest_id) || 'Quest',
          submittedAt: f.submitted_at,
        }))
        .slice(0, 6);

      return {
        totalSignups,
        completedSignups,
        completionRate,
        avgRating,
        totalReviews,
        ratingDistribution,
        signupsByMonth,
        testimonials,
      };
    },
    enabled: !!userId,
  });
}
