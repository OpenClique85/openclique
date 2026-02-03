/**
 * useLFG - Hook for Looking For Group broadcasts
 * 
 * Handles creating LFG broadcasts and responding to them
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface LFGBroadcast {
  id: string;
  user_id: string;
  quest_id: string;
  squad_id: string | null;
  spots_available: number;
  message: string | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  // Joined data
  user?: {
    display_name: string;
    username: string | null;
  };
  quest?: {
    title: string;
    start_datetime: string | null;
    meeting_location_name: string | null;
  };
  responses?: LFGResponse[];
}

export interface LFGResponse {
  id: string;
  broadcast_id: string;
  responder_id: string;
  status: string;
  responded_at: string;
  confirmed_at: string | null;
  responder?: {
    display_name: string;
    username: string | null;
  };
}

export function useLFG() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch LFG broadcasts from contacts
  const { data: broadcasts, isLoading } = useQuery({
    queryKey: ['lfg-broadcasts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get the broadcasts
      const { data: broadcastsData, error } = await supabase
        .from('lfg_broadcasts')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching LFG broadcasts:', error);
        return [];
      }
      
      if (!broadcastsData?.length) return [];
      
      // Get unique user and quest IDs
      const userIds = [...new Set(broadcastsData.map(b => b.user_id))];
      const questIds = [...new Set(broadcastsData.map(b => b.quest_id))];
      const broadcastIds = broadcastsData.map(b => b.id);
      
      // Fetch related data in parallel
      const [usersResult, questsResult, responsesResult] = await Promise.all([
        supabase.from('profiles').select('id, display_name, username').in('id', userIds),
        supabase.from('quests').select('id, title, start_datetime, meeting_location_name').in('id', questIds),
        supabase.from('lfg_responses').select('*').in('broadcast_id', broadcastIds),
      ]);
      
      const usersMap = new Map((usersResult.data || []).map(u => [u.id, u]));
      const questsMap = new Map((questsResult.data || []).map(q => [q.id, q]));
      
      // Get responder profiles
      const responderIds = [...new Set((responsesResult.data || []).map(r => r.responder_id))];
      const respondersResult = responderIds.length > 0
        ? await supabase.from('profiles').select('id, display_name, username').in('id', responderIds)
        : { data: [] };
      const respondersMap = new Map((respondersResult.data || []).map(r => [r.id, r]));
      
      // Combine data
      return broadcastsData.map(broadcast => ({
        ...broadcast,
        user: usersMap.get(broadcast.user_id),
        quest: questsMap.get(broadcast.quest_id),
        responses: (responsesResult.data || [])
          .filter(r => r.broadcast_id === broadcast.id)
          .map(r => ({ ...r, responder: respondersMap.get(r.responder_id) })),
      })) as LFGBroadcast[];
    },
    enabled: !!user?.id,
  });

  // Fetch my own broadcasts
  const { data: myBroadcasts } = useQuery({
    queryKey: ['my-lfg-broadcasts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: broadcastsData, error } = await supabase
        .from('lfg_broadcasts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching my broadcasts:', error);
        return [];
      }
      
      if (!broadcastsData?.length) return [];
      
      const questIds = [...new Set(broadcastsData.map(b => b.quest_id))];
      const broadcastIds = broadcastsData.map(b => b.id);
      
      const [questsResult, responsesResult] = await Promise.all([
        supabase.from('quests').select('id, title, start_datetime, meeting_location_name').in('id', questIds),
        supabase.from('lfg_responses').select('*').in('broadcast_id', broadcastIds),
      ]);
      
      const questsMap = new Map((questsResult.data || []).map(q => [q.id, q]));
      
      const responderIds = [...new Set((responsesResult.data || []).map(r => r.responder_id))];
      const respondersResult = responderIds.length > 0
        ? await supabase.from('profiles').select('id, display_name, username').in('id', responderIds)
        : { data: [] };
      const respondersMap = new Map((respondersResult.data || []).map(r => [r.id, r]));
      
      return broadcastsData.map(broadcast => ({
        ...broadcast,
        quest: questsMap.get(broadcast.quest_id),
        responses: (responsesResult.data || [])
          .filter(r => r.broadcast_id === broadcast.id)
          .map(r => ({ ...r, responder: respondersMap.get(r.responder_id) })),
      })) as LFGBroadcast[];
    },
    enabled: !!user?.id,
  });

  // Create LFG broadcast
  const createBroadcast = useMutation({
    mutationFn: async ({ 
      questId, 
      squadId, 
      spotsAvailable, 
      message, 
      expiresAt 
    }: { 
      questId: string; 
      squadId?: string; 
      spotsAvailable: number; 
      message?: string;
      expiresAt: Date;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: broadcast, error } = await supabase
        .from('lfg_broadcasts')
        .insert({
          user_id: user.id,
          quest_id: questId,
          squad_id: squadId || null,
          spots_available: spotsAvailable,
          message: message || null,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Get contacts to notify
      const { data: contacts } = await supabase
        .rpc('get_user_contacts', { p_user_id: user.id });
      
      if (contacts && contacts.length > 0) {
        // Create notifications for all contacts
        const notifications = contacts.map((contact: { contact_id: string }) => ({
          user_id: contact.contact_id,
          type: 'lfg_broadcast' as const,
          title: 'Looking for Group!',
          body: message || 'A contact is looking for people to quest with',
          metadata: { 
            broadcast_id: broadcast.id,
            quest_id: questId,
            broadcaster_id: user.id,
          },
        }));
        
        await supabase.from('notifications').insert(notifications);
      }
      
      return broadcast;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lfg-broadcasts'] });
      queryClient.invalidateQueries({ queryKey: ['my-lfg-broadcasts'] });
      toast({ title: 'LFG sent!', description: 'Your contacts have been notified.' });
    },
    onError: (error: Error) => {
      console.error('Error creating broadcast:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Respond to LFG broadcast
  const respondToBroadcast = useMutation({
    mutationFn: async ({ broadcastId, status }: { broadcastId: string; status: 'interested' | 'confirmed' }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('lfg_responses')
        .upsert({
          broadcast_id: broadcastId,
          responder_id: user.id,
          status,
          confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
        }, { onConflict: 'broadcast_id,responder_id' });
      
      if (error) throw error;
      
      // Notify broadcaster
      const { data: broadcast } = await supabase
        .from('lfg_broadcasts')
        .select('user_id, quest_id')
        .eq('id', broadcastId)
        .single();
      
      if (broadcast) {
        await supabase.from('notifications').insert({
          user_id: broadcast.user_id,
          type: 'lfg_response' as const,
          title: status === 'interested' ? 'Someone is interested!' : 'Spot claimed!',
          body: 'Someone responded to your LFG',
          metadata: { 
            broadcast_id: broadcastId,
            responder_id: user.id,
            status,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lfg-broadcasts'] });
      toast({ title: 'Response sent!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Cancel broadcast
  const cancelBroadcast = useMutation({
    mutationFn: async (broadcastId: string) => {
      const { error } = await supabase
        .from('lfg_broadcasts')
        .update({ is_active: false })
        .eq('id', broadcastId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lfg-broadcasts'] });
      queryClient.invalidateQueries({ queryKey: ['my-lfg-broadcasts'] });
      toast({ title: 'LFG cancelled' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    broadcasts: broadcasts || [],
    myBroadcasts: myBroadcasts || [],
    isLoading,
    createBroadcast,
    respondToBroadcast,
    cancelBroadcast,
  };
}
