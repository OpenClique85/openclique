/**
 * =============================================================================
 * useSocialEnergy Hook - Manages user's Social Energy Map position with weights
 * =============================================================================
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type Visibility = 'public' | 'squad_only' | 'private';
export type EnergySource = 'default' | 'user_set' | 'ai_suggested' | 'quest_derived';

export interface SocialEnergy {
  id: string;
  user_id: string;
  energy_axis: number;     // 0=Cozy, 100=Lively
  structure_axis: number;  // 0=Spontaneous, 100=Structured
  focus_axis: number;      // 0=Deep Talk, 100=Shared Doing
  energy_weight: number;   // Importance weight (sums to 100)
  structure_weight: number;
  focus_weight: number;
  source: EnergySource;
  is_locked: boolean;
  visibility: Visibility;
  use_for_matching: boolean;
  created_at: string;
  updated_at: string;
}

export interface AxisWeights {
  energy: number;
  structure: number;
  focus: number;
}

// Axis labels and descriptions
export const ENERGY_AXIS = {
  label: 'Energy Level',
  tooltip: 'How much energy you want from social settings',
  low: { name: 'Cozy', description: 'Quiet coffee chats, intimate gatherings', emoji: '☕' },
  high: { name: 'Lively', description: 'High-energy parties, group adventures', emoji: '⚡' },
};

export const STRUCTURE_AXIS = {
  label: 'Structure',
  tooltip: 'How much planning you prefer before events',
  low: { name: 'Spontaneous', description: 'Go with the flow, last-minute plans', emoji: '🎲' },
  high: { name: 'Structured', description: 'Clear plan in advance, set agenda', emoji: '📋' },
};

export const FOCUS_AXIS = {
  label: 'Focus',
  tooltip: 'What you want to be doing when together',
  low: { name: 'Deep Talk', description: 'Meaningful conversations, getting to know people', emoji: '💬' },
  high: { name: 'Shared Doing', description: 'Activity-focused, experiences over talking', emoji: '🎯' },
};

const DEFAULT_ENERGY: Omit<SocialEnergy, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  energy_axis: 50,
  structure_axis: 50,
  focus_axis: 50,
  energy_weight: 34,
  structure_weight: 33,
  focus_weight: 33,
  source: 'default',
  is_locked: false,
  visibility: 'public',
  use_for_matching: true,
};

export function useSocialEnergy(userId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;

  // Fetch social energy data
  const { data: socialEnergy, isLoading } = useQuery({
    queryKey: ['social-energy', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('user_social_energy')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as SocialEnergy | null;
    },
    enabled: !!targetUserId,
  });

  // Initialize default energy if none exists (only for current user)
  const initializeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_social_energy')
        .insert({
          user_id: user.id,
          ...DEFAULT_ENERGY,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SocialEnergy;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['social-energy', user?.id], data);
    },
    onError: (error: Error) => {
      toast.error(`Failed to initialize: ${error.message}`);
    },
  });

  // Update social energy
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<SocialEnergy>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_social_energy')
        .update({
          ...updates,
          source: 'user_set',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as SocialEnergy;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['social-energy', user?.id], data);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  // Update individual axis
  const updateAxis = async (
    axis: 'energy_axis' | 'structure_axis' | 'focus_axis',
    value: number
  ) => {
    if (socialEnergy?.is_locked) {
      toast.error('Your social energy is locked. Unlock it first to make changes.');
      return;
    }
    await updateMutation.mutateAsync({ [axis]: value });
  };

  // Update weights (must total 100)
  const updateWeights = async (weights: AxisWeights) => {
    if (socialEnergy?.is_locked) {
      toast.error('Your social energy is locked. Unlock it first to make changes.');
      return;
    }

    // Normalize to ensure they sum to 100
    const total = weights.energy + weights.structure + weights.focus;
    const normalized = {
      energy_weight: Math.round((weights.energy / total) * 100),
      structure_weight: Math.round((weights.structure / total) * 100),
      focus_weight: Math.round((weights.focus / total) * 100),
    };

    // Adjust for rounding errors
    const sum = normalized.energy_weight + normalized.structure_weight + normalized.focus_weight;
    if (sum !== 100) {
      normalized.energy_weight += 100 - sum;
    }

    await updateMutation.mutateAsync(normalized);
  };

  // Toggle lock
  const toggleLock = async () => {
    if (!socialEnergy) return;
    await updateMutation.mutateAsync({ is_locked: !socialEnergy.is_locked });
    toast.success(socialEnergy.is_locked ? 'Social energy unlocked' : 'Social energy locked');
  };

  // Update visibility
  const updateVisibility = async (visibility: Visibility) => {
    await updateMutation.mutateAsync({ visibility });
    toast.success('Visibility updated');
  };

  // Toggle matching
  const toggleMatching = async () => {
    if (!socialEnergy) return;
    await updateMutation.mutateAsync({ use_for_matching: !socialEnergy.use_for_matching });
    toast.success(
      socialEnergy.use_for_matching
        ? 'Social energy hidden from matching'
        : 'Social energy used for matching'
    );
  };

  // Get position label based on axis values
  const getPositionLabel = () => {
    if (!socialEnergy) return 'Balanced Explorer';

    const labels: string[] = [];

    if (socialEnergy.energy_axis < 35) labels.push('Cozy');
    else if (socialEnergy.energy_axis > 65) labels.push('Lively');

    if (socialEnergy.structure_axis < 35) labels.push('Spontaneous');
    else if (socialEnergy.structure_axis > 65) labels.push('Structured');

    if (socialEnergy.focus_axis < 35) labels.push('Conversationalist');
    else if (socialEnergy.focus_axis > 65) labels.push('Adventurer');

    return labels.length > 0 ? labels.join(' ') : 'Balanced Explorer';
  };

  // Get current weights
  const getWeights = (): AxisWeights => {
    if (!socialEnergy) {
      return { energy: 34, structure: 33, focus: 33 };
    }
    return {
      energy: socialEnergy.energy_weight ?? 34,
      structure: socialEnergy.structure_weight ?? 33,
      focus: socialEnergy.focus_weight ?? 33,
    };
  };

  // IMPORTANT: stabilize the returned weights object.
  // SocialEnergyMap syncs local state from this value; if we return a new object
  // every render, it will constantly reset user edits.
  const weights = useMemo(
    () => getWeights(),
    [
      socialEnergy?.energy_weight,
      socialEnergy?.structure_weight,
      socialEnergy?.focus_weight,
    ]
  );

  return {
    socialEnergy: socialEnergy || {
      ...DEFAULT_ENERGY,
      id: '',
      user_id: targetUserId || '',
      created_at: '',
      updated_at: '',
    },
    isLoading,
    isOwner: user?.id === targetUserId,
    hasData: !!socialEnergy,

    // Weight helpers
    weights,

    // Actions
    initialize: () => initializeMutation.mutateAsync(),
    updateAxis,
    updateWeights,
    toggleLock,
    updateVisibility,
    toggleMatching,
    getPositionLabel,

    // State
    isUpdating: updateMutation.isPending || initializeMutation.isPending,
  };
}
