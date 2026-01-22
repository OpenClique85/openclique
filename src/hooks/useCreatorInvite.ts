import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CreatorInvite {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  redeemed_at: string | null;
}

/**
 * Validates a creator invite token.
 * Returns the invite if valid, null if invalid/expired/redeemed.
 */
export function useCreatorInvite(token: string | null) {
  return useQuery({
    queryKey: ['creator-invite', token],
    queryFn: async (): Promise<CreatorInvite | null> => {
      if (!token) return null;
      
      const { data, error } = await supabase
        .from('creator_invites')
        .select('id, email, token, expires_at, redeemed_at')
        .eq('token', token)
        .maybeSingle();
      
      if (error) {
        console.error('Error validating invite:', error);
        return null;
      }
      
      if (!data) return null;
      
      // Check if expired or already redeemed
      if (data.redeemed_at) return null;
      if (new Date(data.expires_at) < new Date()) return null;
      
      return data as CreatorInvite;
    },
    enabled: !!token,
    staleTime: 0, // Always refetch to ensure token validity
  });
}
