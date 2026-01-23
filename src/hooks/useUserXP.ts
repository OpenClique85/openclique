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

// Helper to format XP source for display
export function formatXPSource(source: string): string {
  const labels: Record<string, string> = {
    feedback_basic: 'Quick Feedback',
    feedback_extended: 'Quest Insights',
    feedback_pricing: 'Pricing Survey',
    feedback_testimonial: 'Testimonial',
    quest_complete: 'Quest Completed',
  };
  return labels[source] || source;
}
