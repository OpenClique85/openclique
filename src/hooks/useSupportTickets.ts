/**
 * =============================================================================
 * SUPPORT TICKETS HOOKS
 * Fetching, creating, and managing support tickets with realtime updates
 * =============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type IssueCategory = Tables<'issue_categories'>;
export type SupportTicket = Tables<'support_tickets'>;
export type TicketMessage = Tables<'ticket_messages'>;
export type TicketAttachment = Tables<'ticket_attachments'>;
export type AdminDirectMessage = Tables<'admin_direct_messages'>;

// ============================================================================
// Issue Categories
// ============================================================================
export function useIssueCategories() {
  return useQuery({
    queryKey: ['issue-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as IssueCategory[];
    },
  });
}

// ============================================================================
// User's Support Tickets
// ============================================================================
export function useMyTickets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-tickets', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          category:issue_categories(id, name, severity_default, requires_escalation),
          quest:quests(id, title, slug),
          squad:quest_squads(id, squad_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// ============================================================================
// Single Ticket with Messages
// ============================================================================
export function useTicketDetail(ticketId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const ticketQuery = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;

      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          category:issue_categories(id, name, severity_default, requires_escalation),
          quest:quests(id, title, slug),
          squad:quest_squads(id, squad_name)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!ticketId && !!user,
  });

  const messagesQuery = useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];

      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!ticketId && !!user,
  });

  const attachmentsQuery = useQuery({
    queryKey: ['ticket-attachments', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];

      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TicketAttachment[];
    },
    enabled: !!ticketId && !!user,
  });

  // Realtime subscription for messages
  useEffect(() => {
    if (!ticketId) return;

    const channel = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  return {
    ticket: ticketQuery.data,
    messages: messagesQuery.data || [],
    attachments: attachmentsQuery.data || [],
    isLoading: ticketQuery.isLoading || messagesQuery.isLoading,
    error: ticketQuery.error || messagesQuery.error,
  };
}

// ============================================================================
// Create Ticket Mutation
// ============================================================================
interface CreateTicketParams {
  category_id: string;
  urgency: 'low' | 'medium' | 'urgent';
  description: string;
  related_quest_id?: string | null;
  related_squad_id?: string | null;
  related_user_id?: string | null;
  submitted_from_page?: string;
  metadata?: Record<string, unknown>;
}

export function useCreateTicket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTicketParams) => {
      if (!user) throw new Error('Must be logged in to create a ticket');

      const insertData: {
        user_id: string;
        category_id: string;
        urgency: 'low' | 'medium' | 'urgent';
        description: string;
        related_quest_id: string | null;
        related_squad_id: string | null;
        related_user_id: string | null;
        submitted_from_page: string | null;
        metadata: Record<string, unknown>;
      } = {
        user_id: user.id,
        category_id: params.category_id,
        urgency: params.urgency,
        description: params.description,
        related_quest_id: params.related_quest_id || null,
        related_squad_id: params.related_squad_id || null,
        related_user_id: params.related_user_id || null,
        submitted_from_page: params.submitted_from_page || null,
        metadata: params.metadata || {},
      };

      const { data, error } = await supabase
        .from('support_tickets')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data as SupportTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    },
  });
}

// ============================================================================
// Add Message to Ticket
// ============================================================================
export function useAddTicketMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          sender_role: 'user',
          message,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TicketMessage;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
    },
  });
}

// ============================================================================
// Upload Attachment
// ============================================================================
export function useUploadAttachment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, file }: { ticketId: string; file: File }) => {
      if (!user) throw new Error('Must be logged in');

      // Upload to storage
      const filePath = `${user.id}/${ticketId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('support-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(filePath);

      // Create attachment record
      const { data, error } = await supabase
        .from('ticket_attachments')
        .insert({
          ticket_id: ticketId,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size_bytes: file.size,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TicketAttachment;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', ticketId] });
    },
  });
}

// ============================================================================
// Admin Direct Messages (for users)
// ============================================================================
export function useMyAdminMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['my-admin-messages', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('admin_direct_messages')
        .select(`
          *,
          from_admin:profiles!admin_direct_messages_from_admin_id_fkey(id, display_name)
        `)
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`admin-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_direct_messages',
          filter: `to_user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['my-admin-messages', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}

export function useMarkAdminMessageRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('admin_direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-admin-messages', user?.id] });
    },
  });
}

// ============================================================================
// Feedback Pulses
// ============================================================================
export function useSubmitFeedbackPulse() {
  return useMutation({
    mutationFn: async ({
      pagePath,
      reaction,
      contextQuestId,
      contextSquadId,
      metadata,
    }: {
      pagePath: string;
      reaction: 'positive' | 'negative' | 'confused';
      contextQuestId?: string | null;
      contextSquadId?: string | null;
      metadata?: Record<string, unknown>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const insertData: {
        user_id: string | null;
        page_path: string;
        reaction: string;
        context_quest_id: string | null;
        context_squad_id: string | null;
        metadata: Record<string, unknown>;
      } = {
        user_id: user?.id || null,
        page_path: pagePath,
        reaction,
        context_quest_id: contextQuestId || null,
        context_squad_id: contextSquadId || null,
        metadata: metadata || {},
      };

      const { error } = await supabase.from('feedback_pulses').insert(insertData as any);

      if (error) throw error;
    },
  });
}
