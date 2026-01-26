/**
 * =============================================================================
 * useCliqueRoles Hook - Manages clique soft roles (Navigator, Vibe Curator, etc.)
 * =============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type CliqueRoleType = 'navigator' | 'vibe_curator' | 'timekeeper' | 'archivist';

export interface CliqueRoleAssignment {
  id: string;
  clique_id: string;
  user_id: string;
  role: CliqueRoleType;
  assigned_at: string;
  assigned_by: string | null;
  expires_at: string | null;
  declined_at: string | null;
  rotation_enabled: boolean;
}

// Role metadata for display
export const CLIQUE_ROLE_METADATA: Record<CliqueRoleType, {
  label: string;
  description: string;
  icon: string;
  color: string;
}> = {
  navigator: {
    label: 'Navigator',
    description: 'Handles logistics, picks venues, plans routes',
    icon: '🧭',
    color: 'text-blue-500',
  },
  vibe_curator: {
    label: 'Vibe Curator',
    description: 'Sets the mood, picks music, keeps energy up',
    icon: '✨',
    color: 'text-purple-500',
  },
  timekeeper: {
    label: 'Timekeeper',
    description: 'Manages scheduling, sends reminders, keeps things on track',
    icon: '⏰',
    color: 'text-amber-500',
  },
  archivist: {
    label: 'Archivist',
    description: 'Captures photos, preserves memories, maintains lore',
    icon: '📸',
    color: 'text-emerald-500',
  },
};

export const ALL_CLIQUE_ROLES: CliqueRoleType[] = ['navigator', 'vibe_curator', 'timekeeper', 'archivist'];

export function useCliqueRoles(cliqueId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch role assignments for this clique
  const { data: roleAssignments = [], isLoading } = useQuery({
    queryKey: ['clique-roles', cliqueId],
    queryFn: async () => {
      if (!cliqueId) return [];

      const { data, error } = await supabase
        .from('clique_role_assignments')
        .select('*')
        .eq('clique_id', cliqueId);

      if (error) throw error;
      return (data || []) as CliqueRoleAssignment[];
    },
    enabled: !!cliqueId,
  });

  // Get role assignment for a specific role
  const getRoleAssignment = (role: CliqueRoleType): CliqueRoleAssignment | undefined => {
    return roleAssignments.find(r => r.role === role && !r.declined_at);
  };

  // Get all roles assigned to a specific user
  const getUserRoles = (userId: string): CliqueRoleAssignment[] => {
    return roleAssignments.filter(r => r.user_id === userId && !r.declined_at);
  };

  // Check if current user has a specific role
  const hasRole = (role: CliqueRoleType): boolean => {
    const assignment = getRoleAssignment(role);
    return assignment?.user_id === user?.id;
  };

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role, expiresAt }: { userId: string; role: CliqueRoleType; expiresAt?: string }) => {
      const { data, error } = await supabase.rpc('assign_clique_role', {
        p_clique_id: cliqueId,
        p_user_id: userId,
        p_role: role,
        p_expires_at: expiresAt || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clique-roles', cliqueId] });
      const roleLabel = CLIQUE_ROLE_METADATA[variables.role].label;
      toast.success(`${roleLabel} role assigned!`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign role: ${error.message}`);
    },
  });

  // Decline role mutation
  const declineRoleMutation = useMutation({
    mutationFn: async (role: CliqueRoleType) => {
      const { error } = await supabase.rpc('decline_clique_role', {
        p_clique_id: cliqueId,
        p_role: role,
      });

      if (error) throw error;
    },
    onSuccess: (_, role) => {
      queryClient.invalidateQueries({ queryKey: ['clique-roles', cliqueId] });
      const roleLabel = CLIQUE_ROLE_METADATA[role].label;
      toast.success(`Declined ${roleLabel} role`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to decline role: ${error.message}`);
    },
  });

  // Unassign role (leader only)
  const unassignRoleMutation = useMutation({
    mutationFn: async (role: CliqueRoleType) => {
      const { error } = await supabase
        .from('clique_role_assignments')
        .delete()
        .eq('clique_id', cliqueId)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: (_, role) => {
      queryClient.invalidateQueries({ queryKey: ['clique-roles', cliqueId] });
      const roleLabel = CLIQUE_ROLE_METADATA[role].label;
      toast.success(`${roleLabel} role removed`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove role: ${error.message}`);
    },
  });

  return {
    roleAssignments,
    isLoading,
    
    // Getters
    getRoleAssignment,
    getUserRoles,
    hasRole,
    
    // Check if a role is assigned
    isRoleAssigned: (role: CliqueRoleType) => !!getRoleAssignment(role),
    
    // Actions
    assignRole: (userId: string, role: CliqueRoleType, expiresAt?: string) => 
      assignRoleMutation.mutateAsync({ userId, role, expiresAt }),
    declineRole: (role: CliqueRoleType) => declineRoleMutation.mutateAsync(role),
    unassignRole: (role: CliqueRoleType) => unassignRoleMutation.mutateAsync(role),
    
    // Loading states
    isAssigning: assignRoleMutation.isPending,
    isDeclining: declineRoleMutation.isPending,
    isUnassigning: unassignRoleMutation.isPending,
  };
}
