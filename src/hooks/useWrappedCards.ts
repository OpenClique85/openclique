/**
 * =============================================================================
 * useWrappedCards Hook - Manages user's Wrapped-style identity cards
 * =============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type CardType =
  | 'social_energy'
  | 'quest_affinity'
  | 'group_role'
  | 'party_metaphor'
  | 'people_magnet'
  | 'evolution';

export interface WrappedCard {
  id: string;
  user_id: string;
  card_type: CardType;
  card_data: Record<string, unknown>;
  card_narrative: string | null;
  generated_at: string;
  is_included_in_share: boolean;
  milestone_trigger: string | null;
  period_start: string | null;
  period_end: string | null;
}

// Card type metadata
export const CARD_METADATA: Record<CardType, {
  title: string;
  description: string;
  icon: string;
  gradient: string;
}> = {
  social_energy: {
    title: 'Your Social Energy',
    description: 'How you show up in group settings',
    icon: '⚡',
    gradient: 'from-amber-500 to-orange-500',
  },
  quest_affinity: {
    title: 'Quest Explorer',
    description: 'Your adventure preferences',
    icon: '🧭',
    gradient: 'from-emerald-500 to-teal-500',
  },
  group_role: {
    title: 'Role Spotlight',
    description: 'How you contribute to groups',
    icon: '🌟',
    gradient: 'from-purple-500 to-pink-500',
  },
  party_metaphor: {
    title: 'Party Persona',
    description: 'If you were at an OpenClique party...',
    icon: '🎉',
    gradient: 'from-rose-500 to-red-500',
  },
  people_magnet: {
    title: 'People Magnet',
    description: 'Your connection patterns',
    icon: '🧲',
    gradient: 'from-blue-500 to-cyan-500',
  },
  evolution: {
    title: 'Your Evolution',
    description: 'How you\'ve grown over time',
    icon: '🦋',
    gradient: 'from-violet-500 to-purple-500',
  },
};

// Milestone definitions
export const MILESTONES: Record<string, { title: string; requiredQuests?: number }> = {
  first_5_quests: { title: 'First 5 Quests', requiredQuests: 5 },
  first_reenlistment: { title: 'First Re-enlistment' },
  first_testimonial: { title: 'First Testimonial' },
  monthly: { title: 'Monthly Wrapped' },
  quarterly: { title: 'Quarterly Wrapped' },
};

export function useWrappedCards(userId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;

  // Fetch all wrapped cards
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['wrapped-cards', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('wrapped_cards')
        .select('*')
        .eq('user_id', targetUserId)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as WrappedCard[];
    },
    enabled: !!targetUserId,
  });

  // Get latest card of each type
  const latestByType = cards.reduce((acc, card) => {
    if (!acc[card.card_type] || new Date(card.generated_at) > new Date(acc[card.card_type].generated_at)) {
      acc[card.card_type] = card;
    }
    return acc;
  }, {} as Record<CardType, WrappedCard>);

  // Get cards included in share
  const shareableCards = cards.filter((c) => c.is_included_in_share);

  // Toggle card inclusion in share
  const toggleShareMutation = useMutation({
    mutationFn: async ({ cardId, include }: { cardId: string; include: boolean }) => {
      const { error } = await supabase
        .from('wrapped_cards')
        .update({ is_included_in_share: include })
        .eq('id', cardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wrapped-cards', targetUserId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  // Request card generation (triggers edge function)
  const generateCardMutation = useMutation({
    mutationFn: async (cardType: CardType) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('generate-wrapped-card', {
        body: { card_type: cardType },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wrapped-cards', user?.id] });
      toast.success('New card generated!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate card: ${error.message}`);
    },
  });

  // Get available card types based on user data
  const getAvailableCardTypes = (): CardType[] => {
    // For now, return all types - actual eligibility will be checked server-side
    return ['social_energy', 'quest_affinity', 'group_role', 'party_metaphor'];
  };

  return {
    cards,
    latestByType,
    shareableCards,
    availableCardTypes: getAvailableCardTypes(),
    isLoading,
    isOwner: user?.id === targetUserId,

    // Actions
    toggleShare: (cardId: string, include: boolean) =>
      toggleShareMutation.mutateAsync({ cardId, include }),
    generateCard: (cardType: CardType) => generateCardMutation.mutateAsync(cardType),
    isUpdating: toggleShareMutation.isPending || generateCardMutation.isPending,
  };
}
