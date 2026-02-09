import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TutorialQuestState {
  completedAt: string | null;
  currentStep: number;
  dismissedCount: number;
}

export function useTutorialQuest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: state, isLoading } = useQuery({
    queryKey: ['tutorial-quest', user?.id],
    queryFn: async (): Promise<TutorialQuestState> => {
      if (!user?.id) return { completedAt: null, currentStep: 0, dismissedCount: 0 };
      const { data, error } = await supabase
        .from('profiles')
        .select('tutorial_quest_completed_at, tutorial_quest_step, tutorial_quest_dismissed_count')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return {
        completedAt: data.tutorial_quest_completed_at,
        currentStep: data.tutorial_quest_step ?? 0,
        dismissedCount: data.tutorial_quest_dismissed_count ?? 0,
      };
    },
    enabled: !!user?.id,
  });

  const updateStep = useMutation({
    mutationFn: async (step: number) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ tutorial_quest_step: step })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tutorial-quest'] }),
  });

  const complete = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      // Mark completed
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          tutorial_quest_completed_at: new Date().toISOString(),
          tutorial_quest_step: 5,
        })
        .eq('id', user.id);
      if (profileError) throw profileError;
      // Award 50 XP
      const { error: xpError } = await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_amount: 50,
        p_source: 'tutorial_quest',
        p_source_id: null,
      });
      if (xpError) console.error('XP award failed:', xpError);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tutorial-quest'] }),
  });

  const dismiss = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ tutorial_quest_dismissed_count: (state?.dismissedCount ?? 0) + 1 })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tutorial-quest'] }),
  });

  const isCompleted = !!state?.completedAt;
  const shouldShowBanner = !isCompleted && (state?.dismissedCount ?? 0) < 3;

  return {
    state: state ?? { completedAt: null, currentStep: 0, dismissedCount: 0 },
    isLoading,
    isCompleted,
    shouldShowBanner,
    updateStep,
    complete,
    dismiss,
  };
}
