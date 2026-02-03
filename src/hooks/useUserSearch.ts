/**
 * Hook for searching users by username, name, or friend code
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserSearchResult {
  id: string;
  display_name: string;
  username: string | null;
  city: string | null;
  friend_code: string | null;
}

export function useUserSearch(query: string, debounceMs = 300) {
  const { user } = useAuth();
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [query, debounceMs]);
  
  return useQuery({
    queryKey: ['user-search', debouncedQuery, user?.id],
    queryFn: async (): Promise<UserSearchResult[]> => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }
      
      const { data, error } = await supabase.rpc('search_users', {
        p_query: debouncedQuery,
        p_limit: 20,
        p_requester_id: user?.id || null,
      });
      
      if (error) {
        console.error('User search error:', error);
        return [];
      }
      
      return data as UserSearchResult[];
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });
}
