/**
 * =============================================================================
 * USER ACHIEVEMENTS HOOK - Track achievement progress and unlocks
 * =============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AchievementCriteria {
  type: string;
  count?: number;
  tree?: string;
  amount?: number;
}

export interface AchievementTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  criteria: AchievementCriteria;
  xp_reward: number;
  is_hidden: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: { current: number; target: number } | null;
  unlocked_at: string | null;
  achievement: AchievementTemplate;
}

export function useUserAchievements() {
  const { user } = useAuth();

  // Fetch all active achievement templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['achievement-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data ?? []).map(d => ({
        ...d,
        criteria: d.criteria as unknown as AchievementCriteria,
      })) as AchievementTemplate[];
    },
  });

  // Fetch user's achievement progress
  const { data: userAchievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievement_templates(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return (data ?? []).map(d => ({
        ...d,
        progress: d.progress as { current: number; target: number } | null,
        achievement: {
          ...d.achievement,
          criteria: (d.achievement as any)?.criteria as AchievementCriteria,
        },
      })) as UserAchievement[];
    },
    enabled: !!user?.id,
  });

  // Combine templates with user progress
  const achievements = templates?.map(template => {
    const userProgress = userAchievements?.find(ua => ua.achievement_id === template.id);
    
    // Don't show hidden achievements that aren't unlocked
    if (template.is_hidden && !userProgress?.unlocked_at) {
      return null;
    }
    
    return {
      ...template,
      unlocked: !!userProgress?.unlocked_at,
      unlockedAt: userProgress?.unlocked_at,
      progress: userProgress?.progress ?? null,
    };
  }).filter(Boolean) ?? [];

  const unlockedCount = achievements.filter(a => a?.unlocked).length;
  const totalCount = achievements.length;

  return {
    achievements,
    unlockedCount,
    totalCount,
    isLoading: templatesLoading || achievementsLoading,
  };
}

// Get criteria description for display
export function getCriteriaDescription(criteria: AchievementCriteria): string {
  switch (criteria.type) {
    case 'quest_count':
      return criteria.tree 
        ? `Complete ${criteria.count} ${criteria.tree} quests`
        : `Complete ${criteria.count} quests`;
    case 'tree_xp':
      return `Earn ${criteria.amount} XP in ${criteria.tree}`;
    case 'feedback_count':
      return `Submit ${criteria.count} feedback`;
    case 'streak_weeks':
      return `Maintain ${criteria.count} week streak`;
    case 'first_quest':
      return 'Complete your first quest';
    case 'first_feedback':
      return 'Submit your first feedback';
    default:
      return criteria.type;
  }
}
