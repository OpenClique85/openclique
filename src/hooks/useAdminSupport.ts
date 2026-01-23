/**
 * =============================================================================
 * ADMIN SUPPORT HOOKS
 * Admin-only hooks for managing support tickets, assignments, and analytics
 * =============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

// ============================================================================
// All Tickets (Admin View)
// ============================================================================
interface TicketFilters {
  status?: string;
  urgency?: string;
  categoryId?: string;
  assignedAdminId?: string | null;
  search?: string;
}

export function useAllTickets(filters: TicketFilters = {}) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-tickets', filters],
    queryFn: async () => {
      let q = supabase
        .from('support_tickets')
        .select(`
          *,
          category:issue_categories(id, name, severity_default, requires_escalation),
          quest:quests(id, title, slug),
          squad:quest_squads(id, squad_name),
          user:profiles!support_tickets_user_id_fkey(id, display_name, email),
          assigned_admin:profiles!support_tickets_assigned_admin_id_fkey(id, display_name)
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        q = q.eq('status', filters.status as any);
      }
      if (filters.urgency) {
        q = q.eq('urgency', filters.urgency as any);
      }
      if (filters.categoryId) {
        q = q.eq('category_id', filters.categoryId);
      }
      if (filters.assignedAdminId === 'unassigned') {
        q = q.is('assigned_admin_id', null);
      } else if (filters.assignedAdminId) {
        q = q.eq('assigned_admin_id', filters.assignedAdminId);
      }

      const { data, error } = await q;
      if (error) throw error;

      // Client-side search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return data.filter((ticket: any) =>
          ticket.description?.toLowerCase().includes(searchLower) ||
          ticket.id?.toLowerCase().includes(searchLower) ||
          (ticket.user as any)?.display_name?.toLowerCase().includes(searchLower) ||
          (ticket.user as any)?.email?.toLowerCase().includes(searchLower)
        );
      }

      return data;
    },
    enabled: isAdmin,
  });

  // Realtime subscription for new tickets
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient]);

  return query;
}

// ============================================================================
// Single Ticket Detail (Admin View)
// ============================================================================
export function useAdminTicketDetail(ticketId: string | undefined) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const ticketQuery = useQuery({
    queryKey: ['admin-ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;

      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          category:issue_categories(id, name, severity_default, requires_escalation),
          quest:quests(id, title, slug),
          squad:quest_squads(id, squad_name),
          user:profiles!support_tickets_user_id_fkey(id, display_name, email),
          assigned_admin:profiles!support_tickets_assigned_admin_id_fkey(id, display_name)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!ticketId && isAdmin,
  });

  const messagesQuery = useQuery({
    queryKey: ['admin-ticket-messages', ticketId],
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
    enabled: !!ticketId && isAdmin,
  });

  const attachmentsQuery = useQuery({
    queryKey: ['admin-ticket-attachments', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];

      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!ticketId && isAdmin,
  });

  // Realtime for messages
  useEffect(() => {
    if (!ticketId || !isAdmin) return;

    const channel = supabase
      .channel(`admin-ticket-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-ticket-messages', ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, isAdmin, queryClient]);

  return {
    ticket: ticketQuery.data,
    messages: messagesQuery.data || [],
    attachments: attachmentsQuery.data || [],
    isLoading: ticketQuery.isLoading || messagesQuery.isLoading,
    error: ticketQuery.error || messagesQuery.error,
    refetch: () => {
      ticketQuery.refetch();
      messagesQuery.refetch();
    },
  };
}

// ============================================================================
// Update Ticket (Admin)
// ============================================================================
export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      updates,
    }: {
      ticketId: string;
      updates: {
        status?: string;
        urgency?: string;
        assigned_admin_id?: string | null;
        internal_notes?: string;
        resolved_at?: string | null;
      };
    }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates as any)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
    },
  });
}

// ============================================================================
// Add Admin Message (with first response tracking + email notification)
// ============================================================================
export function useAddAdminMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      message,
      sendEmail = true,
    }: {
      ticketId: string;
      message: string;
      sendEmail?: boolean;
    }) => {
      if (!user) throw new Error('Must be logged in');

      // First, get the ticket to check if this is the first admin response
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select(`
          id,
          first_response_at,
          description,
          user_id,
          user:profiles!support_tickets_user_id_fkey(id, display_name, email)
        `)
        .eq('id', ticketId)
        .single();

      if (ticketError) throw ticketError;

      // Insert the message
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          sender_role: 'admin',
          message,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Set first_response_at if this is the first admin response
      if (!ticket.first_response_at) {
        await supabase
          .from('support_tickets')
          .update({ first_response_at: new Date().toISOString() } as any)
          .eq('id', ticketId);
      }

      // Send email notification to user
      const userProfile = ticket.user as any;
      if (sendEmail && userProfile?.email) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          await supabase.functions.invoke('send-email', {
            body: {
              to: userProfile.email,
              subject: 'OpenClique Support: We\'ve responded to your ticket',
              template: 'support_reply',
              variables: {
                display_name: userProfile.display_name || 'there',
                ticket_subject: ticket.description?.substring(0, 50) + (ticket.description?.length > 50 ? '...' : '') || 'Your request',
                message: message,
                ticket_url: `${window.location.origin}/support/${ticketId}`,
              },
            },
            headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          });
        } catch (emailError) {
          console.error('Failed to send support reply email:', emailError);
          // Don't throw - message was still sent successfully
        }
      }

      return data;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-messages', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
    },
  });
}

// ============================================================================
// Issue Categories (for filters)
// ============================================================================
export function useAllIssueCategories() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['all-issue-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
}

// ============================================================================
// Admin Users (for assignment dropdown)
// ============================================================================
export function useAdminUsers() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get users with admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) return [];

      const userIds = roleData.map((r) => r.user_id);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;
      return profilesData || [];
    },
    enabled: isAdmin,
  });
}

// ============================================================================
// Ticket Stats
// ============================================================================
export function useTicketStats() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['admin-ticket-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('status, urgency, created_at');

      if (error) throw error;

      const stats = {
        total: data.length,
        open: data.filter((t) => t.status === 'open').length,
        investigating: data.filter((t) => t.status === 'investigating').length,
        waitingResponse: data.filter((t) => t.status === 'waiting_response').length,
        resolved: data.filter((t) => t.status === 'resolved').length,
        urgent: data.filter((t) => t.urgency === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length,
      };

      return stats;
    },
    enabled: isAdmin,
  });
}
