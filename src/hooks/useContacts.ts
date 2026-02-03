/**
 * useContacts - Hook for managing user contacts
 * 
 * Handles fetching contacts, pending requests, and CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Contact {
  contact_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  nickname: string | null;
  notes: string | null;
  source: string | null;
  accepted_at: string;
}

export interface ContactRequest {
  request_id: string;
  requester_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  source: string | null;
  requested_at: string;
}

export function useContacts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch accepted contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_user_contacts', { p_user_id: user.id });
      
      if (error) {
        console.error('Error fetching contacts:', error);
        return [];
      }
      
      return (data || []) as Contact[];
    },
    enabled: !!user?.id,
  });

  // Fetch pending incoming requests
  const { data: pendingRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['contact-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_pending_contact_requests', { p_user_id: user.id });
      
      if (error) {
        console.error('Error fetching contact requests:', error);
        return [];
      }
      
      return (data || []) as ContactRequest[];
    },
    enabled: !!user?.id,
  });

  // Fetch outgoing pending requests
  const { data: outgoingRequests } = useQuery({
    queryKey: ['outgoing-contact-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_contacts')
        .select('contact_id')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      
      if (error) {
        console.error('Error fetching outgoing requests:', error);
        return [];
      }
      
      return data.map(r => r.contact_id);
    },
    enabled: !!user?.id,
  });

  // Check if a user is already a contact or has pending request
  const getContactStatus = (targetUserId: string): 'none' | 'pending_sent' | 'pending_received' | 'accepted' => {
    if (contacts?.some(c => c.contact_id === targetUserId)) return 'accepted';
    if (outgoingRequests?.includes(targetUserId)) return 'pending_sent';
    if (pendingRequests?.some(r => r.requester_id === targetUserId)) return 'pending_received';
    return 'none';
  };

  // Send contact request
  const sendRequest = useMutation({
    mutationFn: async ({ contactId, source }: { contactId: string; source?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_contacts')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          source: source || 'search',
          status: 'pending',
        });
      
      if (error) throw error;
      
      // Create notification for recipient
      await supabase.from('notifications').insert({
        user_id: contactId,
        type: 'contact_request' as const,
        title: 'New Contact Request',
        body: 'Someone wants to add you as a contact',
        metadata: { requester_id: user.id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outgoing-contact-requests'] });
      toast({ title: 'Request sent!', description: 'They\'ll be notified of your request.' });
    },
    onError: (error: Error) => {
      console.error('Error sending contact request:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Accept contact request
  const acceptRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from('user_contacts')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', requestId)
        .select('user_id')
        .single();
      
      if (error) throw error;
      
      // Notify the requester
      await supabase.from('notifications').insert({
        user_id: data.user_id,
        type: 'contact_accepted' as const,
        title: 'Contact Request Accepted',
        body: 'Your contact request was accepted!',
        metadata: { contact_id: user?.id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
      toast({ title: 'Contact added!', description: 'You can now see each other\'s LFG broadcasts.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Decline contact request
  const declineRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('user_contacts')
        .update({ status: 'declined' })
        .eq('id', requestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
      toast({ title: 'Request declined' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Remove contact
  const removeContact = useMutation({
    mutationFn: async (contactId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Remove in both directions
      const { error } = await supabase
        .from('user_contacts')
        .delete()
        .or(`and(user_id.eq.${user.id},contact_id.eq.${contactId}),and(user_id.eq.${contactId},contact_id.eq.${user.id})`);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: 'Contact removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    contacts: contacts || [],
    pendingRequests: pendingRequests || [],
    outgoingRequests: outgoingRequests || [],
    isLoading: contactsLoading || requestsLoading,
    getContactStatus,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeContact,
  };
}
