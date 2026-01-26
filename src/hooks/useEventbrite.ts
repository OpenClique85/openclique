/**
 * Eventbrite Integration Hook
 * 
 * Provides OAuth connection status, event import, and sync functionality.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface EventbriteConnection {
  id: string;
  eventbrite_user_id: string | null;
  eventbrite_email: string | null;
  connected_at: string;
  last_sync_at: string | null;
  is_active: boolean;
}

interface EventbriteEventData {
  eventbrite_event_id: string;
  name: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  venue_name: string | null;
  venue_address: any;
  image_url: string | null;
  ticket_url: string;
  is_free: boolean;
  capacity: number | null;
  organizer_name: string | null;
}

export function useEventbrite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user has an active Eventbrite connection
  const { data: connection, isLoading: connectionLoading } = useQuery({
    queryKey: ['eventbrite-connection', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('eventbrite_connections')
        .select('id, eventbrite_user_id, eventbrite_email, connected_at, last_sync_at, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching Eventbrite connection:', error);
        return null;
      }
      return data as EventbriteConnection | null;
    },
    enabled: !!user,
  });

  // Import event from Eventbrite
  const importEventMutation = useMutation({
    mutationFn: async (eventbriteUrl: string): Promise<EventbriteEventData> => {
      // Extract event ID from URL
      const eventIdMatch = eventbriteUrl.match(/(\d{10,})/);
      if (!eventIdMatch) {
        throw new Error('Invalid Eventbrite URL. Please provide a valid event URL.');
      }
      const eventbriteEventId = eventIdMatch[1];

      // Call edge function to fetch event data
      const { data, error } = await supabase.functions.invoke('import-eventbrite-event', {
        body: { eventbrite_event_id: eventbriteEventId },
      });

      if (error) throw new Error(error.message || 'Failed to import event');
      return data;
    },
    onSuccess: () => {
      toast.success('Event imported successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to import event');
    },
  });

  // Start OAuth flow
  const startOAuthFlow = () => {
    const clientId = import.meta.env.VITE_EVENTBRITE_CLIENT_ID;
    if (!clientId) {
      toast.error('Eventbrite integration not configured');
      return;
    }
    
    const redirectUri = `${window.location.origin}/auth/eventbrite/callback`;
    const oauthUrl = `https://www.eventbrite.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = oauthUrl;
  };

  // Disconnect Eventbrite
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!connection) throw new Error('No active connection');
      const { error } = await supabase
        .from('eventbrite_connections')
        .update({ is_active: false })
        .eq('id', connection.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventbrite-connection'] });
      toast.success('Eventbrite disconnected');
    },
    onError: () => {
      toast.error('Failed to disconnect Eventbrite');
    },
  });

  return {
    connection,
    isConnected: !!connection?.is_active,
    isLoading: connectionLoading,
    importEvent: importEventMutation.mutate,
    importEventAsync: importEventMutation.mutateAsync,
    isImporting: importEventMutation.isPending,
    startOAuthFlow,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
  };
}
