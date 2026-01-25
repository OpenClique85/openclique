/**
 * =============================================================================
 * useGroupRoles Hook - Manages user's group role signals (self vs others view)
 * =============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type RoleType = 'planner' | 'connector' | 'stabilizer' | 'spark';

export interface RoleSignal {
  id: string;
  user_id: string;
  role_type: RoleType;
  signal_source: string;
  source_id: string | null;
  weight: number;
  created_at: string;
}

export interface RoleTotals {
  planner: number;
  connector: number;
  stabilizer: number;
  spark: number;
}

// Role metadata
export const ROLE_METADATA: Record<RoleType, { 
  label: string; 
  description: string; 
  icon: string;
  color: string;
}> = {
  planner: {
    label: 'Planner Energy',
    description: 'Organizes, coordinates, keeps things on track',
    icon: '📋',
    color: 'text-blue-500',
  },
  connector: {
    label: 'Connector Energy',
    description: 'Introduces people, includes everyone, bridges groups',
    icon: '🔗',
    color: 'text-purple-500',
  },
  stabilizer: {
    label: 'Stabilizer Energy',
    description: 'Calms tensions, supports others, steady presence',
    icon: '⚓',
    color: 'text-emerald-500',
  },
  spark: {
    label: 'Spark Energy',
    description: 'Energizes, initiates ideas, brings excitement',
    icon: '⚡',
    color: 'text-amber-500',
  },
};

// Minimum signals required to show "others" view
const MIN_SIGNALS_THRESHOLD = 5;
const MIN_QUESTS_THRESHOLD = 3;

function calculateRecencyWeight(createdAt: string): number {
  const daysSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  // Decay over 90 days
  return Math.max(0.2, 1 - (daysSince / 90) * 0.8);
}

export function useGroupRoles(userId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;

  // Fetch role signals
  const { data: signals = [], isLoading } = useQuery({
    queryKey: ['role-signals', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_role_signals')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as RoleSignal[];
    },
    enabled: !!targetUserId,
  });

  // Count unique quests that contributed signals
  const uniqueQuestCount = new Set(
    signals.filter((s) => s.source_id).map((s) => s.source_id)
  ).size;

  // Calculate weighted totals for self-reported
  const selfSignals = signals.filter((s) => s.signal_source === 'self');
  const selfTotals: RoleTotals = {
    planner: 0,
    connector: 0,
    stabilizer: 0,
    spark: 0,
  };
  selfSignals.forEach((s) => {
    selfTotals[s.role_type] += s.weight * calculateRecencyWeight(s.created_at);
  });

  // Calculate weighted totals for others (squad members, feedback)
  const othersSignals = signals.filter(
    (s) => s.signal_source !== 'self'
  );
  const othersTotals: RoleTotals = {
    planner: 0,
    connector: 0,
    stabilizer: 0,
    spark: 0,
  };
  othersSignals.forEach((s) => {
    othersTotals[s.role_type] += s.weight * calculateRecencyWeight(s.created_at);
  });

  // Normalize to percentages (0-100)
  const normalizeToPercentage = (totals: RoleTotals): RoleTotals => {
    const max = Math.max(...Object.values(totals), 1);
    return {
      planner: Math.round((totals.planner / max) * 100),
      connector: Math.round((totals.connector / max) * 100),
      stabilizer: Math.round((totals.stabilizer / max) * 100),
      spark: Math.round((totals.spark / max) * 100),
    };
  };

  const selfPercentages = normalizeToPercentage(selfTotals);
  const othersPercentages = normalizeToPercentage(othersTotals);

  // Determine if we can show "others" view
  const canShowOthersView =
    othersSignals.length >= MIN_SIGNALS_THRESHOLD &&
    uniqueQuestCount >= MIN_QUESTS_THRESHOLD;

  // Get dominant role
  const getDominantRole = (totals: RoleTotals): RoleType | null => {
    const maxValue = Math.max(...Object.values(totals));
    if (maxValue === 0) return null;
    return (Object.entries(totals).find(([_, v]) => v === maxValue)?.[0] as RoleType) || null;
  };

  // Add self-reported role signal
  const addSelfRoleMutation = useMutation({
    mutationFn: async (roleType: RoleType) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase.from('user_role_signals').insert({
        user_id: user.id,
        role_type: roleType,
        signal_source: 'self',
        weight: 1.0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-signals', user?.id] });
      toast.success('Role preference saved!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Get positive overlaps (roles where self and others agree)
  const getPositiveOverlaps = (): RoleType[] => {
    if (!canShowOthersView) return [];
    return (['planner', 'connector', 'stabilizer', 'spark'] as RoleType[]).filter(
      (role) => selfPercentages[role] > 30 && othersPercentages[role] > 30
    );
  };

  return {
    signals,
    selfTotals: selfPercentages,
    othersTotals: othersPercentages,
    canShowOthersView,
    signalsUntilOthersView: Math.max(0, MIN_SIGNALS_THRESHOLD - othersSignals.length),
    questsUntilOthersView: Math.max(0, MIN_QUESTS_THRESHOLD - uniqueQuestCount),
    dominantSelfRole: getDominantRole(selfTotals),
    dominantOthersRole: canShowOthersView ? getDominantRole(othersTotals) : null,
    positiveOverlaps: getPositiveOverlaps(),
    isLoading,
    isOwner: user?.id === targetUserId,

    // Actions
    addSelfRole: (role: RoleType) => addSelfRoleMutation.mutateAsync(role),
    isUpdating: addSelfRoleMutation.isPending,
  };
}
