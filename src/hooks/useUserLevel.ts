/**
 * =============================================================================
 * USER LEVEL HOOK
 * =============================================================================
 * 
 * Purpose: Calculate and display user's current level based on total XP.
 * 
 * Database Dependencies:
 *   - level_thresholds: Defines XP requirements for each level
 *   - user_xp: Stores user's total accumulated XP
 * 
 * Usage:
 *   const { level, name, currentXP, progressPercent, xpToNext } = useUserLevel();
 * 
 * Example Output:
 *   { level: 3, name: "Adventurer", currentXP: 275, progressPercent: 75, xpToNext: 25 }
 * 
 * Related Files:
 *   - src/components/profile/ProfileGamificationSection.tsx (displays level)
 *   - src/components/admin/XPLevelsManager.tsx (manages thresholds)
 *   - supabase/functions: get_user_level() SQL function
 * 
 * @module hooks/useUserLevel
 * =============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface LevelInfo {
  level: number;
  name: string;
  currentXP: number;
  nextLevelXP: number;
  progressPercent: number;
  xpToNext: number;
}

export interface LevelThreshold {
  id: string;
  level: number;
  min_xp: number;
  name: string;
}

export function useUserLevel() {
  const { user } = useAuth();

  const { data: levelThresholds } = useQuery({
    queryKey: ['level-thresholds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('level_thresholds')
        .select('*')
        .order('level', { ascending: true });
      
      if (error) throw error;
      return data as LevelThreshold[];
    },
  });

  const { data: userXP } = useQuery({
    queryKey: ['user-xp-total', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .from('user_xp')
        .select('total_xp')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data?.total_xp ?? 0;
    },
    enabled: !!user?.id,
  });

  const calculateLevel = (): LevelInfo => {
    const xp = userXP ?? 0;
    const thresholds = levelThresholds ?? [];
    
    if (thresholds.length === 0) {
      return {
        level: 1,
        name: 'Explorer',
        currentXP: xp,
        nextLevelXP: 100,
        progressPercent: Math.min(100, (xp / 100) * 100),
        xpToNext: Math.max(0, 100 - xp),
      };
    }

    // Find current level (highest threshold that user has met)
    let currentLevel = thresholds[0];
    let nextLevel: LevelThreshold | null = null;

    for (let i = 0; i < thresholds.length; i++) {
      if (xp >= thresholds[i].min_xp) {
        currentLevel = thresholds[i];
        nextLevel = thresholds[i + 1] ?? null;
      } else {
        break;
      }
    }

    const currentMin = currentLevel.min_xp;
    const nextMin = nextLevel?.min_xp ?? currentMin + 1000;
    const xpInLevel = xp - currentMin;
    const xpNeeded = nextMin - currentMin;
    const progressPercent = Math.min(100, (xpInLevel / xpNeeded) * 100);

    return {
      level: currentLevel.level,
      name: currentLevel.name,
      currentXP: xp,
      nextLevelXP: nextMin,
      progressPercent,
      xpToNext: Math.max(0, nextMin - xp),
    };
  };

  return {
    ...calculateLevel(),
    isLoading: !levelThresholds,
  };
}

// Admin hook to fetch all level thresholds
export function useLevelThresholds() {
  return useQuery({
    queryKey: ['level-thresholds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('level_thresholds')
        .select('*')
        .order('level', { ascending: true });
      
      if (error) throw error;
      return data as LevelThreshold[];
    },
  });
}
