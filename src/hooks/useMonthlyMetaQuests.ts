/**
 * =============================================================================
 * MONTHLY META QUESTS HOOK
 * =============================================================================
 * 
 * Manages the monthly meta quest system including:
 * - Fetching available quests for the current month
 * - Tracking/untracking quests (max 5)
 * - Progress tracking
 * - Monthly summaries
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const MAX_TRACKED_QUESTS = 5;

export interface MetaQuestTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  criteria_type: string;
  criteria_target: number;
  criteria_metadata: Record<string, unknown>;
  xp_reward: number;
  coin_reward: number;
}

export interface MonthlyMetaQuest {
  id: string;
  template_id: string;
  month_year: string;
  name: string;
  description: string | null;
  icon: string;
  criteria_type: string;
  criteria_target: number;
  criteria_metadata: Record<string, unknown>;
  xp_reward: number;
  coin_reward: number;
}

export interface UserMetaQuestProgress {
  meta_quest_id: string;
  current_progress: number;
  completed_at: string | null;
  reward_claimed_at: string | null;
}

export interface MetaQuestWithProgress extends MonthlyMetaQuest {
  progress: number;
  isCompleted: boolean;
  isTracked: boolean;
  rewardClaimed: boolean;
}

export interface MonthlySummary {
  id: string;
  month_year: string;
  tracked_completed: number;
  total_completed: number;
  xp_earned: number;
  coins_earned: number;
  summary_shown_at: string | null;
}

function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

export function useMonthlyMetaQuests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentMonth = getCurrentMonthYear();

  // Fetch all meta quests for current month
  const { data: monthlyQuests, isLoading: questsLoading } = useQuery({
    queryKey: ['monthly-meta-quests', currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_meta_quests')
        .select('*')
        .eq('month_year', currentMonth);

      if (error) throw error;
      return (data ?? []) as MonthlyMetaQuest[];
    },
  });

  // Fetch user's tracked quests
  const { data: trackedQuestIds, isLoading: trackedLoading } = useQuery({
    queryKey: ['user-tracked-meta-quests', user?.id, currentMonth],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_tracked_meta_quests')
        .select('meta_quest_id, monthly_meta_quests!inner(month_year)')
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Filter to current month
      return (data ?? [])
        .filter((d: any) => d.monthly_meta_quests?.month_year === currentMonth)
        .map((d: any) => d.meta_quest_id);
    },
    enabled: !!user?.id,
  });

  // Fetch user's progress on all quests
  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['user-meta-quest-progress', user?.id, currentMonth],
    queryFn: async () => {
      if (!user?.id) return {};

      const { data, error } = await supabase
        .from('user_meta_quest_progress')
        .select('*, monthly_meta_quests!inner(month_year)')
        .eq('user_id', user.id);

      if (error) throw error;

      // Convert to map
      const progressMap: Record<string, UserMetaQuestProgress> = {};
      (data ?? [])
        .filter((d: any) => d.monthly_meta_quests?.month_year === currentMonth)
        .forEach((d: any) => {
          progressMap[d.meta_quest_id] = {
            meta_quest_id: d.meta_quest_id,
            current_progress: d.current_progress ?? 0,
            completed_at: d.completed_at,
            reward_claimed_at: d.reward_claimed_at,
          };
        });

      return progressMap;
    },
    enabled: !!user?.id,
  });

  // Combine quests with progress and tracking status
  const questsWithProgress: MetaQuestWithProgress[] = (monthlyQuests ?? []).map((quest) => {
    const progress = userProgress?.[quest.id];
    return {
      ...quest,
      progress: progress?.current_progress ?? 0,
      isCompleted: !!progress?.completed_at,
      isTracked: trackedQuestIds?.includes(quest.id) ?? false,
      rewardClaimed: !!progress?.reward_claimed_at,
    };
  });

  const trackedQuests = questsWithProgress.filter((q) => q.isTracked);
  const availableQuests = questsWithProgress.filter((q) => !q.isTracked);
  const completedCount = trackedQuests.filter((q) => q.isCompleted).length;
  const totalTracked = trackedQuests.length;
  const canTrackMore = totalTracked < MAX_TRACKED_QUESTS;

  // Track a quest
  const trackQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check current count
      const { count } = await supabase
        .from('user_tracked_meta_quests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((count ?? 0) >= MAX_TRACKED_QUESTS) {
        throw new Error(`You can only track ${MAX_TRACKED_QUESTS} quests at a time`);
      }

      const { error } = await supabase
        .from('user_tracked_meta_quests')
        .insert({ user_id: user.id, meta_quest_id: questId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tracked-meta-quests'] });
      toast.success('Quest tracked!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Untrack a quest
  const untrackQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_tracked_meta_quests')
        .delete()
        .eq('user_id', user.id)
        .eq('meta_quest_id', questId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tracked-meta-quests'] });
      toast.success('Quest untracked');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Swap a tracked quest for another
  const swapQuestMutation = useMutation({
    mutationFn: async ({ removeId, addId }: { removeId: string; addId: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Remove old
      await supabase
        .from('user_tracked_meta_quests')
        .delete()
        .eq('user_id', user.id)
        .eq('meta_quest_id', removeId);

      // Add new
      const { error } = await supabase
        .from('user_tracked_meta_quests')
        .insert({ user_id: user.id, meta_quest_id: addId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tracked-meta-quests'] });
      toast.success('Quest swapped!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    // Data
    questsWithProgress,
    trackedQuests,
    availableQuests,
    completedCount,
    totalTracked,
    canTrackMore,
    maxTracked: MAX_TRACKED_QUESTS,
    currentMonth,
    daysRemaining: getDaysRemainingInMonth(),

    // Loading
    isLoading: questsLoading || trackedLoading || progressLoading,

    // Mutations
    trackQuest: trackQuestMutation.mutate,
    untrackQuest: untrackQuestMutation.mutate,
    swapQuest: swapQuestMutation.mutate,
    isUpdating: trackQuestMutation.isPending || untrackQuestMutation.isPending || swapQuestMutation.isPending,
  };
}

export function useUserBadges() {
  const { user } = useAuth();

  const { data: badges, isLoading } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge:badge_templates(*)')
        .eq('user_id', user.id)
        .order('awarded_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const { data: allBadges } = useQuery({
    queryKey: ['badge-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badge_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      return data ?? [];
    },
  });

  const earnedBadgeIds = new Set(badges?.map((b: any) => b.badge_id) ?? []);
  const earnedBadges = badges ?? [];
  const lockedBadges = (allBadges ?? []).filter((b) => !earnedBadgeIds.has(b.id));

  return {
    earnedBadges,
    lockedBadges,
    allBadges: allBadges ?? [],
    earnedCount: earnedBadges.length,
    totalCount: (allBadges ?? []).length,
    isLoading,
  };
}
