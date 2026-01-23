/**
 * usePendingOrgRequests - Hook to fetch pending org request count for creators
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function usePendingOrgRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-org-requests-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // First get the creator profile
      const { data: creatorProfile, error: creatorError } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (creatorError || !creatorProfile) {
        return 0;
      }

      // Count pending requests
      const { count, error } = await supabase
        .from('org_creator_requests')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorProfile.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Failed to count pending requests:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });
}
