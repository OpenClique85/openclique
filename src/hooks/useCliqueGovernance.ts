/**
 * =============================================================================
 * useCliqueGovernance Hook - Manages clique leadership and governance actions
 * =============================================================================
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCliqueGovernance(cliqueId: string | undefined) {
  const queryClient = useQueryClient();

  // Transfer leadership mutation
  const transferLeadershipMutation = useMutation({
    mutationFn: async (newLeaderId: string) => {
      const { error } = await supabase.rpc('transfer_clique_leadership', {
        p_clique_id: cliqueId,
        p_new_leader_id: newLeaderId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clique', cliqueId] });
      queryClient.invalidateQueries({ queryKey: ['clique-members', cliqueId] });
      toast.success('Leadership transferred successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to transfer leadership: ${error.message}`);
    },
  });

  // Archive clique mutation
  const archiveCliqueMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('archive_clique', {
        p_clique_id: cliqueId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clique', cliqueId] });
      toast.success('Clique archived. It can be reactivated later.');
    },
    onError: (error: Error) => {
      toast.error(`Failed to archive clique: ${error.message}`);
    },
  });

  // Reactivate clique mutation
  const reactivateCliqueMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('reactivate_clique', {
        p_clique_id: cliqueId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clique', cliqueId] });
      toast.success('Clique reactivated!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reactivate clique: ${error.message}`);
    },
  });

  // Rename clique mutation
  const renameCliqueMutation = useMutation({
    mutationFn: async (newName: string) => {
      const { error } = await supabase
        .from('squads')
        .update({ name: newName })
        .eq('id', cliqueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clique', cliqueId] });
      toast.success('Clique renamed!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to rename clique: ${error.message}`);
    },
  });

  // Update clique settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: {
      theme_tags?: string[];
      commitment_style?: string;
      org_code?: string;
      clique_rules?: string;
      lfc_listing_enabled?: boolean;
      application_prompts?: string[];
      role_rotation_mode?: 'manual' | 'per_quest' | 'monthly';
    }) => {
      const { error } = await supabase
        .from('squads')
        .update(settings)
        .eq('id', cliqueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clique', cliqueId] });
      toast.success('Settings updated!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  // Regenerate invite code mutation
  const regenerateInviteCodeMutation = useMutation({
    mutationFn: async () => {
      // Generate new code using the database function
      const { data, error } = await supabase.rpc('generate_invite_code');
      
      if (error) throw error;

      // Update the clique with the new code
      const { error: updateError } = await supabase
        .from('squads')
        .update({ invite_code: data })
        .eq('id', cliqueId);

      if (updateError) throw updateError;
      
      return data;
    },
    onSuccess: (newCode) => {
      queryClient.invalidateQueries({ queryKey: ['clique', cliqueId] });
      toast.success(`New invite code: ${newCode}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to regenerate invite code: ${error.message}`);
    },
  });

  // Remove member mutation (leader only)
  const removeMemberMutation = useMutation({
    mutationFn: async ({ memberId, reason }: { memberId: string; reason?: string }) => {
      const { error } = await supabase
        .from('squad_members')
        .update({ 
          status: 'removed',
          // Store reason in a note field if we add one later
        })
        .eq('persistent_squad_id', cliqueId)
        .eq('user_id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clique-members', cliqueId] });
      toast.success('Member removed from clique');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove member: ${error.message}`);
    },
  });

  return {
    // Actions
    transferLeadership: (newLeaderId: string) => transferLeadershipMutation.mutateAsync(newLeaderId),
    archiveClique: () => archiveCliqueMutation.mutateAsync(),
    reactivateClique: () => reactivateCliqueMutation.mutateAsync(),
    renameClique: (newName: string) => renameCliqueMutation.mutateAsync(newName),
    updateSettings: (settings: Parameters<typeof updateSettingsMutation.mutateAsync>[0]) => 
      updateSettingsMutation.mutateAsync(settings),
    regenerateInviteCode: () => regenerateInviteCodeMutation.mutateAsync(),
    removeMember: (memberId: string, reason?: string) => 
      removeMemberMutation.mutateAsync({ memberId, reason }),

    // Loading states
    isTransferring: transferLeadershipMutation.isPending,
    isArchiving: archiveCliqueMutation.isPending,
    isReactivating: reactivateCliqueMutation.isPending,
    isRenaming: renameCliqueMutation.isPending,
    isUpdatingSettings: updateSettingsMutation.isPending,
    isRegeneratingCode: regenerateInviteCodeMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,
  };
}
