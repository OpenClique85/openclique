import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PinnedQuest {
  id: string;
  quest_id: string;
  pinned_at: string;
  notes: string | null;
}

export function usePinnedQuests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pinned-quests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('pinned_quests')
        .select('*')
        .eq('user_id', user.id)
        .order('pinned_at', { ascending: false });
      
      if (error) throw error;
      return data as PinnedQuest[];
    },
    enabled: !!user?.id,
  });
}

export function useIsQuestPinned(questId: string | undefined) {
  const { data: pinnedQuests } = usePinnedQuests();
  
  if (!questId || !pinnedQuests) return false;
  return pinnedQuests.some(p => p.quest_id === questId);
}

export function usePinQuest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('pinned_quests')
        .insert({ user_id: user.id, quest_id: questId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinned-quests'] });
    },
  });
}

export function useUnpinQuest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('pinned_quests')
        .delete()
        .eq('user_id', user.id)
        .eq('quest_id', questId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinned-quests'] });
    },
  });
}

export function useTogglePinQuest() {
  const pinMutation = usePinQuest();
  const unpinMutation = useUnpinQuest();
  const { data: pinnedQuests } = usePinnedQuests();

  return {
    toggle: async (questId: string) => {
      const isPinned = pinnedQuests?.some(p => p.quest_id === questId);
      if (isPinned) {
        await unpinMutation.mutateAsync(questId);
        return false;
      } else {
        await pinMutation.mutateAsync(questId);
        return true;
      }
    },
    isPending: pinMutation.isPending || unpinMutation.isPending,
  };
}
