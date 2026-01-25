/**
 * =============================================================================
 * useYourAlgorithm Hook - Fetches and manages user traits for "Your Algorithm"
 * =============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type TraitLibrary = Tables<'trait_library'>;
type UserTrait = Tables<'user_traits'>;
type DraftTrait = Tables<'draft_traits'>;

export type Visibility = 'public' | 'squad_only' | 'private';

export interface UserTraitWithLibrary extends UserTrait {
  trait_library: TraitLibrary | null;
}

export interface DraftTraitWithLibrary extends DraftTrait {
  trait_library: TraitLibrary | null;
}

// Category color mapping for visual styling
export const CATEGORY_COLORS: Record<string, { gradient: string; accent: string }> = {
  social_energy: { gradient: 'from-amber-500/20 to-orange-500/20', accent: 'text-amber-500' },
  planning_style: { gradient: 'from-emerald-500/20 to-teal-500/20', accent: 'text-emerald-500' },
  conversation_style: { gradient: 'from-blue-500/20 to-cyan-500/20', accent: 'text-blue-500' },
  pace_intensity: { gradient: 'from-slate-500/20 to-gray-500/20', accent: 'text-slate-500' },
  adventure_preference: { gradient: 'from-green-500/20 to-teal-500/20', accent: 'text-green-500' },
  risk_novelty: { gradient: 'from-rose-500/20 to-pink-500/20', accent: 'text-rose-500' },
  group_role: { gradient: 'from-purple-500/20 to-pink-500/20', accent: 'text-purple-500' },
};

export const CATEGORY_LABELS: Record<string, string> = {
  social_energy: 'Social Energy',
  planning_style: 'Planning Style',
  conversation_style: 'Conversation Style',
  pace_intensity: 'Pace & Intensity',
  adventure_preference: 'Adventure Preference',
  risk_novelty: 'Risk & Novelty',
  group_role: 'Group Role',
};

export function useYourAlgorithm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch accepted traits
  const { data: acceptedTraits = [], isLoading: isLoadingTraits } = useQuery({
    queryKey: ['user-traits', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_traits')
        .select('*, trait_library(*)')
        .eq('user_id', user.id)
        .order('importance', { ascending: false });
      
      if (error) throw error;
      return (data || []) as UserTraitWithLibrary[];
    },
    enabled: !!user?.id,
  });

  // Fetch pending draft traits
  const { data: pendingDrafts = [], isLoading: isLoadingDrafts } = useQuery({
    queryKey: ['draft-traits', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('draft_traits')
        .select('*, trait_library(*)')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('confidence', { ascending: false });
      
      if (error) throw error;
      return (data || []) as DraftTraitWithLibrary[];
    },
    enabled: !!user?.id,
  });

  // Group traits by category
  const traitsByCategory = acceptedTraits.reduce((acc, trait) => {
    const category = trait.trait_library?.category || 'uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(trait);
    return acc;
  }, {} as Record<string, UserTraitWithLibrary[]>);

  // Top traits by importance
  const topTraits = [...acceptedTraits]
    .sort((a, b) => (b.importance || 50) - (a.importance || 50))
    .slice(0, 5);

  // Accept draft mutation
  const acceptDraftMutation = useMutation({
    mutationFn: async (draft: DraftTraitWithLibrary) => {
      if (!user?.id) throw new Error('Not authenticated');

      // 1. Update draft status
      const { error: draftError } = await supabase
        .from('draft_traits')
        .update({ 
          status: 'accepted', 
          decided_at: new Date().toISOString() 
        })
        .eq('id', draft.id);
      
      if (draftError) throw draftError;

      // 2. Insert into user_traits
      const { error: traitError } = await supabase
        .from('user_traits')
        .insert({
          user_id: user.id,
          trait_slug: draft.trait_slug,
          source: 'ai_inferred',
          source_draft_id: draft.id,
          importance: 50,
          visibility: 'public',
        });
      
      if (traitError) throw traitError;
    },
    onSuccess: (_, draft) => {
      queryClient.invalidateQueries({ queryKey: ['user-traits'] });
      queryClient.invalidateQueries({ queryKey: ['draft-traits'] });
      toast.success(`Added "${draft.trait_library?.display_name}" to your algorithm!`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to accept trait: ${error.message}`);
    },
  });

  // Reject draft mutation
  const rejectDraftMutation = useMutation({
    mutationFn: async (draftId: string) => {
      const { error } = await supabase
        .from('draft_traits')
        .update({ 
          status: 'rejected', 
          decided_at: new Date().toISOString() 
        })
        .eq('id', draftId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-traits'] });
      toast.success("Got it, we'll update your suggestions");
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject trait: ${error.message}`);
    },
  });

  // Update importance mutation
  const updateImportanceMutation = useMutation({
    mutationFn: async ({ traitId, importance }: { traitId: string; importance: number }) => {
      const { error } = await supabase
        .from('user_traits')
        .update({ 
          importance, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', traitId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-traits'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update importance: ${error.message}`);
    },
  });

  // Update visibility mutation
  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ traitId, visibility }: { traitId: string; visibility: Visibility }) => {
      const { error } = await supabase
        .from('user_traits')
        .update({ 
          visibility, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', traitId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-traits'] });
      toast.success('Visibility updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update visibility: ${error.message}`);
    },
  });

  // Remove trait mutation
  const removeTraitMutation = useMutation({
    mutationFn: async (traitId: string) => {
      const { error } = await supabase
        .from('user_traits')
        .delete()
        .eq('id', traitId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-traits'] });
      toast.success('Trait removed from your algorithm');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove trait: ${error.message}`);
    },
  });

  return {
    // Data
    acceptedTraits,
    pendingDrafts,
    traitsByCategory,
    topTraits,
    
    // Stats
    totalAccepted: acceptedTraits.length,
    totalPending: pendingDrafts.length,
    
    // Actions
    acceptDraft: (draft: DraftTraitWithLibrary) => acceptDraftMutation.mutateAsync(draft),
    rejectDraft: (draftId: string) => rejectDraftMutation.mutateAsync(draftId),
    updateImportance: (traitId: string, importance: number) => 
      updateImportanceMutation.mutateAsync({ traitId, importance }),
    updateVisibility: (traitId: string, visibility: Visibility) => 
      updateVisibilityMutation.mutateAsync({ traitId, visibility }),
    removeTrait: (traitId: string) => removeTraitMutation.mutateAsync(traitId),
    
    // Loading states
    isLoading: isLoadingTraits || isLoadingDrafts,
    isUpdating: 
      acceptDraftMutation.isPending || 
      rejectDraftMutation.isPending || 
      updateImportanceMutation.isPending ||
      updateVisibilityMutation.isPending ||
      removeTraitMutation.isPending,
  };
}
