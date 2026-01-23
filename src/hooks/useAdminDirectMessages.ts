import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { auditLog } from '@/lib/auditLog';
import type { Tables, Enums } from '@/integrations/supabase/types';

type AdminDM = Tables<'admin_direct_messages'>;
type AdminDMReply = Tables<'admin_dm_replies'>;
type AdminMessageType = Enums<'admin_message_type'>;

export interface DMWithDetails extends AdminDM {
  recipient?: { id: string; display_name: string | null; email: string | null } | null;
  admin?: { id: string; display_name: string | null } | null;
  quest?: { id: string; title: string } | null;
  squad?: { id: string; squad_name: string | null } | null;
  ticket?: { id: string; description: string } | null;
  replies?: AdminDMReply[];
  reply_count?: number;
}

export interface RecipientOption {
  id: string;
  display_name: string | null;
  email: string | null;
  role_type: 'user' | 'creator' | 'sponsor' | 'org_admin';
  role_label: string;
}

// Hook to search all users across different role types
export function useRecipientSearch() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: recipients = [], isLoading } = useQuery({
    queryKey: ['admin-dm-recipients', search, roleFilter],
    queryFn: async () => {
      const results: RecipientOption[] = [];

      // Fetch all profiles with search
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .or(`display_name.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(50);

      if (profilesError) throw profilesError;

      // Get creator profiles
      const { data: creators } = await supabase
        .from('creator_profiles')
        .select('user_id')
        .eq('status', 'active');
      const creatorIds = new Set(creators?.map((c) => c.user_id) || []);

      // Get sponsor profiles
      const { data: sponsors } = await supabase
        .from('sponsor_profiles')
        .select('user_id')
        .eq('status', 'active');
      const sponsorIds = new Set(sponsors?.map((s) => s.user_id) || []);

      // Get org admins from profile_organizations table
      const { data: orgMembers } = await supabase
        .from('profile_organizations')
        .select('profile_id')
        .eq('role', 'admin');
      const orgAdminIds = new Set(orgMembers?.map((m) => m.profile_id) || []);

      // Build recipient list with role info
      for (const profile of profiles || []) {
        let role_type: RecipientOption['role_type'] = 'user';
        let role_label = 'User';

        if (creatorIds.has(profile.id)) {
          role_type = 'creator';
          role_label = 'Creator';
        } else if (sponsorIds.has(profile.id)) {
          role_type = 'sponsor';
          role_label = 'Sponsor';
        } else if (orgAdminIds.has(profile.id)) {
          role_type = 'org_admin';
          role_label = 'Org Admin';
        }

        // Apply role filter
        if (roleFilter !== 'all' && role_type !== roleFilter) continue;

        results.push({
          id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
          role_type,
          role_label,
        });
      }

      return results;
    },
    enabled: search.length >= 2,
  });

  return { recipients, isLoading, search, setSearch, roleFilter, setRoleFilter };
}

// Hook to fetch all admin DMs with filters
export function useAdminDirectMessages(filters?: {
  messageType?: AdminMessageType;
  hasUnread?: boolean;
}) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['admin-direct-messages', filters],
    queryFn: async () => {
      let query = supabase
        .from('admin_direct_messages')
        .select(`
          *,
          quest:quests(id, title),
          squad:quest_squads(id, squad_name),
          ticket:support_tickets(id, description)
        `)
        .order('created_at', { ascending: false });

      if (filters?.messageType) {
        query = query.eq('message_type', filters.messageType);
      }

      if (filters?.hasUnread) {
        query = query.is('read_at', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles separately for recipient and admin
      const userIds = new Set<string>();
      data?.forEach((m) => {
        userIds.add(m.to_user_id);
        userIds.add(m.from_admin_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', Array.from(userIds));

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Fetch reply counts
      const messageIds = data?.map((m) => m.id) || [];
      let countMap = new Map<string, number>();

      if (messageIds.length > 0) {
        const { data: replyCounts } = await supabase
          .from('admin_dm_replies')
          .select('message_id')
          .in('message_id', messageIds);

        replyCounts?.forEach((r) => {
          countMap.set(r.message_id, (countMap.get(r.message_id) || 0) + 1);
        });
      }

      return data.map((m) => ({
        ...m,
        recipient: profileMap.get(m.to_user_id) || null,
        admin: profileMap.get(m.from_admin_id) || null,
        reply_count: countMap.get(m.id) || 0,
      })) as DMWithDetails[];
    },
    enabled: isAdmin,
  });
}

// Hook to fetch a single DM with replies
export function useAdminDMDetail(messageId: string | null) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['admin-dm-detail', messageId],
    queryFn: async () => {
      if (!messageId) return null;

      const { data: message, error } = await supabase
        .from('admin_direct_messages')
        .select(`
          *,
          quest:quests(id, title),
          squad:quest_squads(id, squad_name),
          ticket:support_tickets(id, description)
        `)
        .eq('id', messageId)
        .single();

      if (error) throw error;

      // Fetch profiles for recipient and admin
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', [message.to_user_id, message.from_admin_id]);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Fetch replies
      const { data: replies } = await supabase
        .from('admin_dm_replies')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      return {
        ...message,
        recipient: profileMap.get(message.to_user_id) || null,
        admin: profileMap.get(message.from_admin_id) || null,
        replies: replies || [],
      } as DMWithDetails;
    },
    enabled: isAdmin && !!messageId,
  });
}

// Hook to send a new DM
export function useSendAdminDM() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      to_user_id: string;
      subject: string;
      body: string;
      message_type: AdminMessageType;
      reply_allowed: boolean;
      context_quest_id?: string | null;
      context_squad_id?: string | null;
      context_ticket_id?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: message, error } = await supabase
        .from('admin_direct_messages')
        .insert({
          from_admin_id: user.id,
          to_user_id: data.to_user_id,
          subject: data.subject,
          body: data.body,
          message_type: data.message_type,
          reply_allowed: data.reply_allowed,
          context_quest_id: data.context_quest_id || null,
          context_squad_id: data.context_squad_id || null,
          context_ticket_id: data.context_ticket_id || null,
          email_sent: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for recipient
      await supabase.from('notifications').insert({
        user_id: data.to_user_id,
        type: 'admin_direct_message',
        title: `Message from Admin: ${data.subject}`,
        message: data.body.substring(0, 100) + (data.body.length > 100 ? '...' : ''),
        link: `/notifications`,
        metadata: { message_id: message.id },
      });

      // Audit log
      await auditLog({
        action: 'admin_dm_sent',
        targetTable: 'admin_direct_messages',
        targetId: message.id,
        newValues: {
          to_user_id: data.to_user_id,
          message_type: data.message_type,
        },
      });

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-direct-messages'] });
      toast({ title: 'Message sent', description: 'Your message has been delivered.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Failed to send message', description: error.message });
    },
  });
}

// Hook to add a reply to a DM
export function useAddDMReply() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { message_id: string; body: string }) => {
      if (!user) throw new Error('Not authenticated');

      const sender_role = isAdmin ? 'admin' : 'user';

      const { data: reply, error } = await supabase
        .from('admin_dm_replies')
        .insert({
          message_id: data.message_id,
          sender_id: user.id,
          sender_role,
          body: data.body,
        })
        .select()
        .single();

      if (error) throw error;

      // Get the original message to notify the other party
      const { data: originalMessage } = await supabase
        .from('admin_direct_messages')
        .select('from_admin_id, to_user_id, subject')
        .eq('id', data.message_id)
        .single();

      if (originalMessage) {
        const notifyUserId = isAdmin ? originalMessage.to_user_id : originalMessage.from_admin_id;

        await supabase.from('notifications').insert({
          user_id: notifyUserId,
          type: 'admin_direct_message',
          title: `Reply: ${originalMessage.subject}`,
          message: data.body.substring(0, 100) + (data.body.length > 100 ? '...' : ''),
          link: `/notifications`,
          metadata: { message_id: data.message_id },
        });
      }

      return reply;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-dm-detail', variables.message_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-direct-messages'] });
      toast({ title: 'Reply sent' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Failed to send reply', description: error.message });
    },
  });
}

// Hook to fetch quests for context linking
export function useContextQuests() {
  return useQuery({
    queryKey: ['context-quests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select('id, title')
        .order('start_datetime', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

// Hook to fetch squads for context linking
export function useContextSquads() {
  return useQuery({
    queryKey: ['context-squads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_squads')
        .select('id, squad_name, quest:quests(title)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

// Hook to fetch tickets for context linking
export function useContextTickets() {
  return useQuery({
    queryKey: ['context-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('id, description')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}
