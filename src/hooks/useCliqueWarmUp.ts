/**
 * Hook for managing clique warm-up state and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { WarmUpProgress, CliqueStatus } from '@/lib/cliqueLifecycle';

interface CliqueMember {
  id: string;
  user_id: string;
  display_name: string | null;
  status: string;
  prompt_response: string | null;
  readiness_confirmed_at: string | null;
  warm_up_completed_at: string | null;
  warm_up_progress: Record<string, unknown>;
}

interface ChatMessage {
  id: string;
  squad_id: string;
  sender_id: string;
  message: string;
  is_prompt_response: boolean;
  created_at: string;
  sender_name?: string;
}

interface WarmUpPrompt {
  id: string;
  name: string;
  body: string;
}

interface CliqueWithInstance {
  id: string;
  name: string;
  status: string;
  quest_id: string;
  approved_at: string | null;
  approved_by: string | null;
  approval_notes: string | null;
  quest_instances: {
    id: string;
    title: string;
    scheduled_date: string;
    start_time: string;
    warm_up_min_ready_pct: number | null;
  } | null;
}

export function useCliqueWarmUp(cliqueId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Fetch clique details with members using raw query for new columns
  const { data: clique, isLoading: cliqueLoading } = useQuery({
    queryKey: ['clique-warmup', cliqueId],
    queryFn: async () => {
      if (!cliqueId) return null;
      
      // Use a raw approach to get data with new columns
      const { data, error } = await supabase
        .from('quest_squads')
        .select('*')
        .eq('id', cliqueId)
        .single();
      
      if (error) throw error;
      
      // Fetch quest instance separately
      const { data: instance } = await supabase
        .from('quest_instances')
        .select('id, title, scheduled_date, start_time')
        .eq('id', data.quest_id)
        .single();
      
      return {
        ...data,
        quest_instances: instance,
      } as unknown as CliqueWithInstance;
    },
    enabled: !!cliqueId,
  });

  // Fetch clique members with warm-up data
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['clique-members-warmup', cliqueId],
    queryFn: async () => {
      if (!cliqueId) return [];
      
      // Fetch members with all columns including new ones
      const { data, error } = await supabase
        .from('squad_members')
        .select('*')
        .eq('squad_id', cliqueId);
      
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = (data as { user_id: string }[]).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);
      
      return (data as unknown[]).map((m: unknown) => {
        const member = m as Record<string, unknown>;
        return {
          id: member.id as string,
          user_id: member.user_id as string,
          status: member.status as string,
          prompt_response: member.prompt_response as string | null,
          readiness_confirmed_at: member.readiness_confirmed_at as string | null,
          warm_up_completed_at: member.warm_up_completed_at as string | null,
          warm_up_progress: (member.warm_up_progress as Record<string, unknown>) || {},
          display_name: profileMap.get(member.user_id as string) || null,
        };
      }) as CliqueMember[];
    },
    enabled: !!cliqueId,
  });

  // Fetch warm-up prompt
  const { data: prompt } = useQuery({
    queryKey: ['warm-up-prompt', clique?.quest_instances?.warm_up_prompt_id],
    queryFn: async () => {
      const promptId = clique?.quest_instances?.warm_up_prompt_id;
      
      // If no specific prompt assigned, get a random warm-up prompt
      const query = promptId
        ? supabase.from('message_templates').select('id, name, body').eq('id', promptId).single()
        : supabase.from('message_templates').select('id, name, body').eq('category', 'warm_up').limit(1).single();
      
      const { data, error } = await query;
      if (error) return null;
      return data as WarmUpPrompt;
    },
    enabled: !!clique,
  });

  // Fetch chat messages
  const { data: initialMessages = [] } = useQuery({
    queryKey: ['clique-chat', cliqueId],
    queryFn: async () => {
      if (!cliqueId) return [];
      
      const { data, error } = await supabase
        .from('squad_chat_messages' as 'quest_ratings') // Type cast for new table
        .select('*')
        .eq('squad_id' as 'quest_id', cliqueId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data as unknown as ChatMessage[]) || [];
    },
    enabled: !!cliqueId,
  });

  // Initialize messages
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Subscribe to realtime chat
  useEffect(() => {
    if (!cliqueId) return;

    const channel = supabase
      .channel(`clique-chat-${cliqueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'squad_chat_messages',
          filter: `squad_id=eq.${cliqueId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cliqueId]);

  // Send chat message
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!cliqueId || !user) throw new Error('Not authenticated');
      
      const { error } = await (supabase as unknown as { from: (t: string) => { insert: (d: unknown) => Promise<{ error: Error | null }> } })
        .from('squad_chat_messages')
        .insert({
          squad_id: cliqueId,
          sender_id: user.id,
          message,
          is_prompt_response: false,
        });
      
      if (error) throw error;
    },
    onError: (error) => {
      toast.error('Failed to send message', { description: error.message });
    },
  });

  // Submit prompt response
  const submitPromptResponse = useMutation({
    mutationFn: async (response: string) => {
      if (!cliqueId || !user) throw new Error('Not authenticated');
      
      // Call RPC function
      const { error: rpcError } = await supabase.rpc('submit_warm_up_prompt', {
        p_squad_id: cliqueId,
        p_response: response,
      });
      
      if (rpcError) throw rpcError;
      
      // Also post as chat message
      await (supabase as unknown as { from: (t: string) => { insert: (d: unknown) => Promise<{ error: Error | null }> } })
        .from('squad_chat_messages')
        .insert({
          squad_id: cliqueId,
          sender_id: user.id,
          message: response,
          is_prompt_response: true,
          prompt_id: prompt?.id,
        });
    },
    onSuccess: () => {
      toast.success('Response submitted!');
      queryClient.invalidateQueries({ queryKey: ['clique-members-warmup', cliqueId] });
    },
    onError: (error) => {
      toast.error('Failed to submit response', { description: error.message });
    },
  });

  // Confirm readiness
  const confirmReadiness = useMutation({
    mutationFn: async () => {
      if (!cliqueId || !user) throw new Error('Not authenticated');
      
      const { error } = await supabase.rpc('confirm_warm_up_readiness', {
        p_squad_id: cliqueId,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("You're ready! Waiting for your clique...");
      queryClient.invalidateQueries({ queryKey: ['clique-members-warmup', cliqueId] });
      queryClient.invalidateQueries({ queryKey: ['clique-warmup', cliqueId] });
    },
    onError: (error) => {
      toast.error('Failed to confirm readiness', { description: error.message });
    },
  });

  // Calculate current user's progress
  const currentMember = members.find(m => m.user_id === user?.id);
  const hasAnsweredPrompt = !!currentMember?.prompt_response;
  const hasConfirmedReadiness = !!currentMember?.readiness_confirmed_at;

  // Calculate clique progress
  const calculateProgress = useCallback((): WarmUpProgress => {
    const activeMembers = members.filter(m => m.status !== 'dropped');
    const readyMembers = activeMembers.filter(
      m => m.prompt_response && m.readiness_confirmed_at
    );
    
    const minPct = clique?.quest_instances?.warm_up_min_ready_pct ?? 100;
    const percentage = activeMembers.length > 0
      ? Math.round((readyMembers.length / activeMembers.length) * 100)
      : 0;
    
    return {
      totalMembers: activeMembers.length,
      readyMembers: readyMembers.length,
      percentage,
      isComplete: percentage >= minPct,
    };
  }, [members, clique]);

  // Enrich messages with sender names
  const enrichedMessages = messages.map(msg => ({
    ...msg,
    sender_name: members.find(m => m.user_id === msg.sender_id)?.display_name || 'Unknown',
  }));

  return {
    clique,
    members,
    prompt,
    messages: enrichedMessages,
    isLoading: cliqueLoading || membersLoading,
    currentMember,
    hasAnsweredPrompt,
    hasConfirmedReadiness,
    progress: calculateProgress(),
    sendMessage: sendMessage.mutate,
    submitPromptResponse: submitPromptResponse.mutate,
    confirmReadiness: confirmReadiness.mutate,
    isSending: sendMessage.isPending,
    isSubmittingPrompt: submitPromptResponse.isPending,
    isConfirmingReadiness: confirmReadiness.isPending,
  };
}

interface AdminMember {
  id: string;
  user_id: string;
  status: string;
  prompt_response: string | null;
  readiness_confirmed_at: string | null;
  warm_up_progress: Record<string, unknown>;
  display_name: string | null;
  avatar_url: string | null;
}

interface AdminChatMessage {
  id: string;
  squad_id: string;
  sender_id: string;
  message: string;
  is_prompt_response: boolean;
  created_at: string;
}

interface AdminCliqueData {
  clique: CliqueWithInstance;
  members: AdminMember[];
  messages: AdminChatMessage[];
}

/**
 * Admin hook for reviewing warm-up cliques
 */
export function useAdminCliqueWarmUp(cliqueId: string | null) {
  const queryClient = useQueryClient();

  // Fetch full clique data for admin
  const { data: cliqueData, isLoading } = useQuery({
    queryKey: ['admin-clique-warmup', cliqueId],
    queryFn: async (): Promise<AdminCliqueData | null> => {
      if (!cliqueId) return null;
      
      // Fetch clique
      const { data: cliqueRaw, error: cliqueError } = await supabase
        .from('quest_squads')
        .select('*')
        .eq('id', cliqueId)
        .single();
      
      if (cliqueError) throw cliqueError;
      
      // Fetch instance
      const { data: instance } = await supabase
        .from('quest_instances')
        .select('id, title, scheduled_date, start_time, warm_up_min_ready_pct')
        .eq('id', cliqueRaw.quest_id)
        .single();
      
      const clique = {
        ...cliqueRaw,
        quest_instances: instance,
      } as unknown as CliqueWithInstance;
      
      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('squad_members')
        .select('*')
        .eq('squad_id', cliqueId);
      
      if (membersError) throw membersError;
      
      // Fetch profiles separately
      const userIds = (membersData as { user_id: string }[]).map(m => m.user_id);
      const { data: profilesRaw } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);
      
      const profiles = profilesRaw as unknown as { id: string; display_name: string | null; avatar_url?: string | null }[] | null;
      const profileMap = new Map(
        profiles?.map(p => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url || null }]) || []
      );
      
      const members: AdminMember[] = (membersData as unknown[]).map((m: unknown) => {
        const member = m as Record<string, unknown>;
        const userId = member.user_id as string;
        const profile = profileMap.get(userId);
        return {
          id: member.id as string,
          user_id: userId,
          status: member.status as string,
          prompt_response: member.prompt_response as string | null,
          readiness_confirmed_at: member.readiness_confirmed_at as string | null,
          warm_up_progress: (member.warm_up_progress as Record<string, unknown>) || {},
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
        };
      });
      
      // Fetch chat messages
      const { data: messagesRaw, error: messagesError } = await supabase
        .from('squad_chat_messages' as 'quest_ratings')
        .select('*')
        .eq('squad_id' as 'quest_id', cliqueId)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      
      const messages = (messagesRaw as unknown as AdminChatMessage[]) || [];
      
      return { clique, members, messages };
    },
    enabled: !!cliqueId,
  });

  // Approve clique
  const approveClique = useMutation({
    mutationFn: async ({ notes, force = false }: { notes?: string; force?: boolean }) => {
      if (!cliqueId) throw new Error('No clique selected');
      
      const { error } = await supabase.rpc('approve_squad', {
        p_squad_id: cliqueId,
        p_notes: notes || null,
        p_force: force,
      });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.force ? 'Clique force-approved!' : 'Clique approved!');
      queryClient.invalidateQueries({ queryKey: ['admin-clique-warmup', cliqueId] });
      queryClient.invalidateQueries({ queryKey: ['instance-cliques'] });
    },
    onError: (error) => {
      toast.error('Failed to approve clique', { description: error.message });
    },
  });

  // Hold clique (reset to warming up)
  const holdClique = useMutation({
    mutationFn: async (notes?: string) => {
      if (!cliqueId) throw new Error('No clique selected');
      
      const { error } = await supabase
        .from('quest_squads')
        .update({ 
          status: 'warming_up',
          approval_notes: notes,
        } as Record<string, unknown>)
        .eq('id', cliqueId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Clique held for more warm-up');
      queryClient.invalidateQueries({ queryKey: ['admin-clique-warmup', cliqueId] });
    },
    onError: (error) => {
      toast.error('Failed to hold clique', { description: error.message });
    },
  });

  return {
    cliqueData,
    isLoading,
    approveClique: approveClique.mutate,
    holdClique: holdClique.mutate,
    isApproving: approveClique.isPending,
    isHolding: holdClique.isPending,
  };
}

// Re-export old names for backward compatibility
export const useSquadWarmUp = useCliqueWarmUp;
export const useAdminSquadWarmUp = useAdminCliqueWarmUp;
