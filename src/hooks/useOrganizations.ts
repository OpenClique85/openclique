/**
 * useOrganizations - Hook for organization and club management
 * Handles umbrella orgs, clubs, memberships, and applications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Tables, Enums } from '@/integrations/supabase/types';

export type Organization = Tables<'organizations'> & {
  member_count?: number;
  club_count?: number;
  parent_org?: { name: string; slug: string } | null;
};

export type OrgApplication = Tables<'org_applications'>;
export type OrgMemberRole = Enums<'org_member_role'>;

interface UseOrganizationsOptions {
  parentOrgId?: string;
  umbrellaOnly?: boolean;
  clubsOnly?: boolean;
}

export function useOrganizations(options: UseOrganizationsOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organizations with optional filtering
  const { data: organizations, isLoading, refetch } = useQuery({
    queryKey: ['organizations', options],
    queryFn: async () => {
      let query = supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (options.parentOrgId) {
        query = query.eq('parent_org_id', options.parentOrgId);
      }
      if (options.umbrellaOnly) {
        query = query.eq('is_umbrella', true);
      }
      if (options.clubsOnly) {
        query = query.not('parent_org_id', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get member counts
      const withCounts = await Promise.all(
        (data || []).map(async (org) => {
          const [{ count: memberCount }, { count: clubCount }] = await Promise.all([
            supabase
              .from('profile_organizations')
              .select('*', { count: 'exact', head: true })
              .eq('org_id', org.id),
            supabase
              .from('organizations')
              .select('*', { count: 'exact', head: true })
              .eq('parent_org_id', org.id),
          ]);

          return {
            ...org,
            member_count: memberCount || 0,
            club_count: clubCount || 0,
          };
        })
      );

      return withCounts as Organization[];
    },
  });

  // Fetch user's memberships
  const { data: userMemberships } = useQuery({
    queryKey: ['user-org-memberships', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('profile_organizations')
        .select(`
          org_id,
          role,
          joined_at,
          organization:organizations(id, name, slug, type, is_umbrella, parent_org_id)
        `)
        .eq('profile_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Check if user is member of an org
  const isMemberOf = (orgId: string) => {
    return userMemberships?.some((m) => m.org_id === orgId) || false;
  };

  // Get user's role in an org
  const getRoleIn = (orgId: string): OrgMemberRole | null => {
    const membership = userMemberships?.find((m) => m.org_id === orgId);
    return membership?.role || null;
  };

  // Join org mutation
  const joinOrg = useMutation({
    mutationFn: async (orgId: string) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase
        .from('profile_organizations')
        .insert({ profile_id: user.id, org_id: orgId, role: 'member' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Joined organization!' });
      queryClient.invalidateQueries({ queryKey: ['user-org-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (err: any) => {
      if (err.code === '23505') {
        toast({ title: 'Already a member' });
      } else {
        toast({ title: 'Failed to join', variant: 'destructive' });
      }
    },
  });

  // Leave org mutation
  const leaveOrg = useMutation({
    mutationFn: async (orgId: string) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase
        .from('profile_organizations')
        .delete()
        .eq('org_id', orgId)
        .eq('profile_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Left organization' });
      queryClient.invalidateQueries({ queryKey: ['user-org-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  // Join via verified email
  const joinViaEmail = useMutation({
    mutationFn: async ({ orgId, email }: { orgId: string; email: string }) => {
      const { data, error } = await supabase.rpc('join_org_via_email', {
        p_org_id: orgId,
        p_email: email,
      });
      if (error) throw error;
      return data as { success: boolean; error?: string; org_name?: string };
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: `Joined ${data.org_name}!` });
        queryClient.invalidateQueries({ queryKey: ['user-org-memberships'] });
      } else {
        toast({ title: data.error || 'Failed to join', variant: 'destructive' });
      }
    },
  });

  // Redeem invite code
  const redeemInvite = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('redeem_org_invite', {
        p_code: code,
      });
      if (error) throw error;
      return data as { success: boolean; error?: string; org_name?: string; org_id?: string };
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: `Joined ${data.org_name}!` });
        queryClient.invalidateQueries({ queryKey: ['user-org-memberships'] });
      } else {
        toast({ title: data.error || 'Invalid code', variant: 'destructive' });
      }
    },
  });

  // Submit club application
  const submitApplication = useMutation({
    mutationFn: async (application: Omit<Partial<OrgApplication>, 'applicant_id'> & { name: string }) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase.from('org_applications').insert([{
        applicant_id: user.id,
        name: application.name,
        type: application.type || 'club',
        description: application.description,
        category: application.category,
        visibility: application.visibility,
        intended_audience: application.intended_audience,
        requested_admins: application.requested_admins,
        parent_org_id: application.parent_org_id,
        agreed_to_terms: application.agreed_to_terms,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Application submitted!', description: 'We\'ll review and get back to you.' });
      queryClient.invalidateQueries({ queryKey: ['org-applications'] });
    },
  });

  return {
    organizations,
    isLoading,
    refetch,
    userMemberships,
    isMemberOf,
    getRoleIn,
    joinOrg,
    leaveOrg,
    joinViaEmail,
    redeemInvite,
    submitApplication,
  };
}

// Hook for fetching clubs under an umbrella org
export function useClubs(umbrellaOrgId: string | undefined) {
  return useQuery({
    queryKey: ['clubs', umbrellaOrgId],
    queryFn: async () => {
      if (!umbrellaOrgId) return [];
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('parent_org_id', umbrellaOrgId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;

      // Get member counts
      const withCounts = await Promise.all(
        (data || []).map(async (org) => {
          const { count } = await supabase
            .from('profile_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id);
          return { ...org, member_count: count || 0 };
        })
      );

      return withCounts as Organization[];
    },
    enabled: !!umbrellaOrgId,
  });
}

// Hook for user's pending applications
export function useMyApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-org-applications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('org_applications')
        .select(`
          *,
          parent_org:organizations!org_applications_parent_org_id_fkey(name, slug)
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
