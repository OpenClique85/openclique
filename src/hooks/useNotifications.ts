import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  user_id: string;
  type: 'quest_recommendation' | 'quest_shared' | 'referral_accepted' | 'signup_confirmed' | 'quest_reminder' | 'general';
  title: string;
  body: string | null;
  quest_id: string | null;
  referrer_user_id: string | null;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!user) return [];
      
      const session = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications?user_id=eq.${user.id}&order=created_at.desc&limit=50`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          },
        }
      );
      
      if (!response.ok) {
        // Table might not exist yet - return empty array
        console.warn('Notifications table not accessible:', response.status);
        return [];
      }
      
      return await response.json();
    },
    enabled: !!user,
  });
}

export function useUnreadCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      
      const session = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications?user_id=eq.${user.id}&read_at=is.null&select=id`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Prefer': 'count=exact',
          },
        }
      );
      
      if (!response.ok) {
        return 0;
      }
      
      const countHeader = response.headers.get('content-range');
      if (countHeader) {
        const match = countHeader.match(/\/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data.length : 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const session = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications?id=eq.${notificationId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ read_at: new Date().toISOString() }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      const session = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications?user_id=eq.${user.id}&read_at=is.null`,
        {
          method: 'PATCH',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ read_at: new Date().toISOString() }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    },
  });
}
