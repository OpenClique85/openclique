import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SponsorInvite {
  id: string;
  email: string;
  expires_at: string;
  redeemed_at: string | null;
}

export function useSponsorInvite(token: string | null) {
  return useQuery({
    queryKey: ['sponsor-invite', token],
    queryFn: async (): Promise<SponsorInvite | null> => {
      if (!token) return null;
      
      const { data, error } = await supabase
        .from('sponsor_invites')
        .select('id, email, expires_at, redeemed_at')
        .eq('token', token)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching sponsor invite:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!token,
  });
}
