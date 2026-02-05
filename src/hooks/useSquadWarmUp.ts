/**
 * Hook for managing squad warm-up state and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { WarmUpProgress, SquadStatus } from '@/lib/squadLifecycle';

interface SquadMember {
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
  sender_type: 'user' | 'admin' | 'buggs' | 'system';
  created_at: string;
  sender_name?: string;
}

interface WarmUpPrompt {
  id: string;
  name: string;
  body: string;
}

interface SquadWithInstance {
  id: string;
  name: string;
  status: string;
  quest_id: string;
  instance_id?: string | null;
  approved_at: string | null;
  approved_by: string | null;
  quest_instances: {
    id: string;
    title: string;
    scheduled_date: string;
    start_time: string;
    objectives: string | null;
    meeting_point_name: string | null;
    meeting_point_address: string | null;
    what_to_bring: string | null;
    safety_notes: string | null;
  } | null;
}

export function useSquadWarmUp(squadId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Fetch squad details with members using raw query for new columns
  const { data: squad, isLoading: squadLoading } = useQuery({
    queryKey: ['squad-warmup', squadId],
    queryFn: async () => {
      if (!squadId) return null;
      
      // Use a raw approach to get data with new columns
      const { data, error } = await supabase
        .from('quest_squads')
        .select('*')
        .eq('id', squadId)
        .single();
      
      if (error) throw error;
      
      // Fetch quest instance separately - use instance_id if available, otherwise quest_id
      const instanceId = data.instance_id || data.quest_id;
      const { data: instance } = await supabase
        .from('quest_instances')
        .select('id, title, scheduled_date, start_time, objectives, meeting_point_name, meeting_point_address, what_to_bring, safety_notes')
        .eq('id', instanceId)
        .single();
      
      return {
        ...data,
        quest_instances: instance,
      } as unknown as SquadWithInstance;
    },
    enabled: !!squadId,
  });

  // Fetch squad members with warm-up data
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['squad-members-warmup', squadId],
    queryFn: async () => {
      if (!squadId) return [];
      
      // Fetch members with all columns including new ones
      const { data, error } = await supabase
        .from('squad_members')
        .select('*')
        .eq('squad_id', squadId);
      
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
      }) as SquadMember[];
    },
    enabled: !!squadId,
  });

  // Fetch warm-up prompt - get a random one from message_templates
  const { data: prompt } = useQuery({
    queryKey: ['warm-up-prompt', squadId],
    queryFn: async () => {
      // Get a random warm-up prompt from message_templates
      const { data, error } = await supabase
        .from('message_templates')
        .select('id, name, body')
        .eq('category', 'warm_up')
        .limit(1)
        .single();
      
      if (error) return null;
      return data as WarmUpPrompt;
    },
    enabled: !!squad,
  });

  // Fetch chat messages
  const { data: initialMessages = [] } = useQuery({
    queryKey: ['squad-chat', squadId],
    queryFn: async () => {
      if (!squadId) return [];
      
      const { data, error } = await supabase
        .from('squad_chat_messages' as 'quest_ratings') // Type cast for new table
        .select('*')
        .eq('squad_id' as 'quest_id', squadId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data as unknown as ChatMessage[]) || [];
    },
    enabled: !!squadId,
  });

  // Initialize messages
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Subscribe to realtime chat
  useEffect(() => {
    if (!squadId) return;

    const channel = supabase
      .channel(`squad-chat-${squadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'squad_chat_messages',
          filter: `squad_id=eq.${squadId}`,
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
  }, [squadId]);

  // Send chat message
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!squadId || !user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('squad_chat_messages')
        .insert({
          squad_id: squadId,
          sender_id: user.id,
          message,
          sender_type: 'user',
        });
      
      if (error) throw error;
    },
    onError: (error) => {
      toast.error('Failed to send message', { description: error.message });
    },
  });

  // Send message with media
  const sendMessageWithMedia = useMutation({
    mutationFn: async ({ mediaUrl, isProof }: { mediaUrl: string; isProof: boolean }) => {
      if (!squadId || !user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('squad_chat_messages')
        .insert({
          squad_id: squadId,
          sender_id: user.id,
          message: isProof ? '📸 Quest Proof submitted' : '📷 Shared a photo',
          sender_type: 'user',
          media_url: mediaUrl,
          media_type: 'image',
          is_proof_submission: isProof,
          proof_status: 'approved', // Default to approved
        });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      if (variables.isProof) {
        toast.success('Quest proof submitted! 🏆');
      }
    },
    onError: (error) => {
      toast.error('Failed to send photo', { description: error.message });
    },
  });

  // Submit prompt response
  const submitPromptResponse = useMutation({
    mutationFn: async (response: string) => {
      if (!squadId || !user) throw new Error('Not authenticated');
      
      // Call RPC function
      const { error: rpcError } = await supabase.rpc('submit_warm_up_prompt', {
        p_squad_id: squadId,
        p_response: response,
      });
      
      if (rpcError) throw rpcError;
      
      // Also post as chat message with [Prompt Response] prefix for identification
      await supabase
        .from('squad_chat_messages')
        .insert({
          squad_id: squadId,
          sender_id: user.id,
          message: `📝 **Prompt Response:** ${response}`,
          sender_type: 'user',
        });
    },
    onSuccess: () => {
      toast.success('Response submitted!');
      queryClient.invalidateQueries({ queryKey: ['squad-members-warmup', squadId] });
    },
    onError: (error) => {
      toast.error('Failed to submit response', { description: error.message });
    },
  });

  // Confirm readiness
  const confirmReadiness = useMutation({
    mutationFn: async () => {
      if (!squadId || !user) throw new Error('Not authenticated');
      
      const { error } = await supabase.rpc('confirm_warm_up_readiness', {
        p_squad_id: squadId,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("You're ready! Waiting for your squad...");
      queryClient.invalidateQueries({ queryKey: ['squad-members-warmup', squadId] });
      queryClient.invalidateQueries({ queryKey: ['squad-warmup', squadId] });
    },
    onError: (error) => {
      toast.error('Failed to confirm readiness', { description: error.message });
    },
  });

  // Calculate current user's progress
  const currentMember = members.find(m => m.user_id === user?.id);
  const hasAnsweredPrompt = !!currentMember?.prompt_response;
  const hasConfirmedReadiness = !!currentMember?.readiness_confirmed_at;

  // Calculate squad progress with 50/50 split
  const calculateProgress = useCallback((): WarmUpProgress => {
    const activeMembers = members.filter(m => m.status !== 'dropped');
    const promptAnswered = activeMembers.filter(m => !!m.prompt_response).length;
    const readinessConfirmed = activeMembers.filter(m => !!m.readiness_confirmed_at).length;
    const readyMembers = activeMembers.filter(
      m => m.prompt_response && m.readiness_confirmed_at
    );
    
    // 50% for prompts, 50% for readiness
    const promptPct = activeMembers.length > 0 ? (promptAnswered / activeMembers.length) * 50 : 0;
    const readinessPct = activeMembers.length > 0 ? (readinessConfirmed / activeMembers.length) * 50 : 0;
    const percentage = Math.round(promptPct + readinessPct);
    
    return {
      totalMembers: activeMembers.length,
      readyMembers: readyMembers.length,
      promptAnswered,
      readinessConfirmed,
      percentage,
      isComplete: percentage >= 100,
    };
  }, [members]);

  // Enrich messages with sender names
  const enrichedMessages = messages.map(msg => ({
    ...msg,
    sender_name: members.find(m => m.user_id === msg.sender_id)?.display_name || 'Unknown',
  }));

  return {
    squad,
    members,
    prompt,
    messages: enrichedMessages,
    isLoading: squadLoading || membersLoading,
    currentMember,
    hasAnsweredPrompt,
    hasConfirmedReadiness,
    progress: calculateProgress(),
    sendMessage: sendMessage.mutate,
    sendMessageWithMedia: (mediaUrl: string, isProof: boolean) => 
      sendMessageWithMedia.mutate({ mediaUrl, isProof }),
    submitPromptResponse: submitPromptResponse.mutate,
    confirmReadiness: confirmReadiness.mutate,
    isSending: sendMessage.isPending || sendMessageWithMedia.isPending,
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
  sender_type: 'user' | 'admin' | 'buggs' | 'system';
  created_at: string;
}

interface AdminSquadData {
  squad: SquadWithInstance;
  members: AdminMember[];
  messages: AdminChatMessage[];
}

/**
 * Admin hook for reviewing warm-up squads
 */
export function useAdminSquadWarmUp(squadId: string | null) {
  const queryClient = useQueryClient();

  // Fetch full squad data for admin
  const { data: squadData, isLoading } = useQuery({
    queryKey: ['admin-squad-warmup', squadId],
    queryFn: async (): Promise<AdminSquadData | null> => {
      if (!squadId) return null;
      
      // Fetch squad
      const { data: squadRaw, error: squadError } = await supabase
        .from('quest_squads')
        .select('*')
        .eq('id', squadId)
        .single();
      
      if (squadError) throw squadError;
      
      // Fetch instance
      const { data: instance } = await supabase
        .from('quest_instances')
        .select('id, title, scheduled_date, start_time')
        .eq('id', squadRaw.instance_id || squadRaw.quest_id)
        .single();
      
      const squad = {
        ...squadRaw,
        quest_instances: instance,
      } as unknown as SquadWithInstance;
      
      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('squad_members')
        .select('*')
        .eq('squad_id', squadId);
      
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
        .eq('squad_id' as 'quest_id', squadId)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      
      const messages = (messagesRaw as unknown as AdminChatMessage[]) || [];
      
      return { squad, members, messages };
    },
    enabled: !!squadId,
  });

  // Approve squad
  const approveSquad = useMutation({
    mutationFn: async ({ notes, force = false }: { notes?: string; force?: boolean }) => {
      if (!squadId) throw new Error('No squad selected');
      
      const { error } = await supabase.rpc('approve_squad', {
        p_squad_id: squadId,
        p_notes: notes || null,
        p_force: force,
      });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.force ? 'Squad force-approved!' : 'Squad approved!');
      queryClient.invalidateQueries({ queryKey: ['admin-squad-warmup', squadId] });
      queryClient.invalidateQueries({ queryKey: ['instance-squads'] });
    },
    onError: (error) => {
      toast.error('Failed to approve squad', { description: error.message });
    },
  });

  // Hold squad (reset to warming up)
  const holdSquad = useMutation({
    mutationFn: async (notes?: string) => {
      if (!squadId) throw new Error('No squad selected');
      
      const { error } = await supabase
        .from('quest_squads')
        .update({ 
          status: 'warming_up',
          approval_notes: notes,
        } as Record<string, unknown>)
        .eq('id', squadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Squad held for more warm-up');
      queryClient.invalidateQueries({ queryKey: ['admin-squad-warmup', squadId] });
    },
    onError: (error) => {
      toast.error('Failed to hold squad', { description: error.message });
    },
  });

  return {
    squadData,
    isLoading,
    approveSquad: approveSquad.mutate,
    holdSquad: holdSquad.mutate,
    isApproving: approveSquad.isPending,
    isHolding: holdSquad.isPending,
  };
}
