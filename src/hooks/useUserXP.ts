/**
 * =============================================================================
 * USER XP HOOK
 * =============================================================================
 * 
 * Purpose: Fetch and manage user XP data including total XP and transaction history.
 *          XP is the core currency of the gamification system.
 * 
 * Database Dependencies:
 *   - user_xp: Stores total XP per user
 *   - xp_transactions: Individual XP awards with source tracking
 * 
 * XP Sources:
 *   - quest_complete: Completing a quest (base_xp from quest)
 *   - feedback_basic/extended/pricing/testimonial: Feedback submissions
 *   - achievement: Bonus XP from unlocking achievements
 *   - streak_bonus: Milestone bonuses for maintaining streaks
 *   - referral: Bonus for successful referrals
 * 
 * Usage:
 *   const { totalXP, recentTransactions, isLoading } = useUserXP();
 * 
 * Related Files:
 *   - src/components/XPBadge.tsx (displays XP in navbar)
 *   - src/components/profile/ProfileGamificationSection.tsx
 *   - DB function: award_xp(user_id, amount, source, source_id)
 * 
 * @module hooks/useUserXP
 * =============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  source_id: string | null;
  created_at: string;
}

export interface UserXP {
  id: string;
  user_id: string;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

export function useUserXP() {
  const { user } = useAuth();

  const { data: userXP, isLoading: xpLoading } = useQuery({
    queryKey: ['user-xp', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserXP | null;
    },
    enabled: !!user?.id,
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['xp-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('xp_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as XPTransaction[];
    },
    enabled: !!user?.id,
  });

  return {
    totalXP: userXP?.total_xp ?? 0,
    recentTransactions: recentTransactions ?? [],
    isLoading: xpLoading || transactionsLoading,
  };
}

export function useAwardXP() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      amount, 
      source, 
      sourceId 
    }: { 
      amount: number; 
      source: string; 
      sourceId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_amount: amount,
        p_source: source,
        p_source_id: sourceId || null,
      });

      if (error) throw error;
      return data as number; // Returns new total
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-xp', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['xp-transactions', user?.id] });
    },
  });
}

/**
 * Format XP source key to human-readable label
 * @param source - The source key from xp_transactions
 * @returns Human-readable label
 */
export function formatXPSource(source: string): string {
  const labels: Record<string, string> = {
    // Quest completion
    quest_complete: 'Quest Completed',
    
    // Feedback submissions
    feedback_basic: 'Quick Feedback',
    feedback_extended: 'Quest Insights',
    feedback_pricing: 'Pricing Survey',
    feedback_testimonial: 'Testimonial',
    
    // Gamification bonuses
    achievement: 'Achievement Bonus',
    streak_bonus: 'Streak Milestone',
    
    // Social/referrals
    referral: 'Referral Bonus',
    referral_signup: 'Friend Joined',
    
    // Admin/manual
    admin_bonus: 'Bonus Award',
    welcome_bonus: 'Welcome Bonus',
    
    // Profile & Tutorial
    profile_first_update: 'Profile Setup Bonus',
    profile_update: 'Profile Updated',
    tutorial_complete: 'Tutorial Complete',
    squad_chat_first: 'First Squad Message',
    first_quest_signup: 'First Quest Signup',
  };
  return labels[source] || source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
