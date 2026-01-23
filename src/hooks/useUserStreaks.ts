/**
 * =============================================================================
 * USER STREAKS HOOK - Track active streaks and consistency rewards
 * =============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface StreakRule {
  id: string;
  name: string;
  interval: 'weekly' | 'monthly';
  grace_periods: number;
  xp_bonus: number;
  is_active: boolean;
}

export interface UserStreak {
  id: string;
  user_id: string;
  streak_rule_id: string;
  current_count: number;
  longest_count: number;
  last_activity_at: string | null;
  streak_broken_at: string | null;
  streak_rule: StreakRule;
}

export function useUserStreaks() {
  const { user } = useAuth();

  // Fetch active streak rules
  const { data: streakRules } = useQuery({
    queryKey: ['streak-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streak_rules')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as StreakRule[];
    },
  });

  // Fetch user's streaks
  const { data: userStreaks, isLoading } = useQuery({
    queryKey: ['user-streaks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*, streak_rule:streak_rules(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserStreak[];
    },
    enabled: !!user?.id,
  });

  // Combine rules with user data, showing all active rules
  const streaks = streakRules?.map(rule => {
    const userStreak = userStreaks?.find(us => us.streak_rule_id === rule.id);
    
    return {
      ...rule,
      currentCount: userStreak?.current_count ?? 0,
      longestCount: userStreak?.longest_count ?? 0,
      lastActivityAt: userStreak?.last_activity_at ?? null,
      isActive: (userStreak?.current_count ?? 0) > 0,
    };
  }) ?? [];

  const totalActiveStreaks = streaks.filter(s => s.isActive).length;
  const longestStreak = Math.max(...streaks.map(s => s.longestCount), 0);

  return {
    streaks,
    totalActiveStreaks,
    longestStreak,
    isLoading,
  };
}

// Get encouraging message based on streak status
export function getStreakMessage(currentCount: number, interval: 'weekly' | 'monthly'): string {
  if (currentCount === 0) {
    return interval === 'weekly' 
      ? 'Complete a quest this week to start your streak!'
      : 'Complete a quest this month to start your streak!';
  }
  if (currentCount === 1) {
    return 'Great start! Keep it going!';
  }
  if (currentCount < 4) {
    return `${currentCount} ${interval === 'weekly' ? 'weeks' : 'months'} strong!`;
  }
  return `Amazing! ${currentCount} ${interval === 'weekly' ? 'weeks' : 'months'} and counting! 🔥`;
}
