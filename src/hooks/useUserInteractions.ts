/**
 * Hook for user interactions (poke, wave, quest share, clique invite)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type InteractionType = 'poke' | 'wave' | 'quest_share' | 'clique_invite';

export interface UserInteraction {
  id: string;
  from_user_id: string;
  to_user_id: string;
  interaction_type: InteractionType;
  payload: Record<string, unknown> | null;
  message: string | null;
  read_at: string | null;
  created_at: string;
}

export function useReceivedInteractions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-interactions-received', user?.id],
    queryFn: async (): Promise<UserInteraction[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Failed to fetch interactions:', error);
        return [];
      }
      
      return data as UserInteraction[];
    },
    enabled: !!user,
  });
}

export function useSentInteractions(toUserId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-interactions-sent', user?.id, toUserId],
    queryFn: async (): Promise<UserInteraction[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('from_user_id', user.id)
        .eq('to_user_id', toUserId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      if (error) {
        console.error('Failed to fetch sent interactions:', error);
        return [];
      }
      
      return data as UserInteraction[];
    },
    enabled: !!user && !!toUserId,
  });
}

export function useSendInteraction() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      toUserId,
      type,
      payload,
      message,
    }: {
      toUserId: string;
      type: InteractionType;
      payload?: Record<string, unknown>;
      message?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_interactions')
        .insert([{
          from_user_id: user.id,
          to_user_id: toUserId,
          interaction_type: type,
          payload: payload ? JSON.parse(JSON.stringify(payload)) : null,
          message: message || null,
        }]);
      
      if (error) {
        // Handle rate limit error
        if (error.message.includes('Daily interaction limit')) {
          throw new Error('You\'ve reached your daily interaction limit (10/day)');
        }
        if (error.message.includes('one') && error.message.includes('per day')) {
          throw new Error(`You can only send one ${type} per day to this person`);
        }
        if (error.message.includes('Cannot interact')) {
          throw new Error('You cannot interact with this user');
        }
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-interactions-sent', user?.id, variables.toUserId] });
      
      const typeLabels: Record<InteractionType, string> = {
        poke: 'Poked',
        wave: 'Waved at',
        quest_share: 'Shared quest with',
        clique_invite: 'Invited to clique',
      };
      
      toast({
        title: `${typeLabels[variables.type]} successfully!`,
        description: 'They\'ll see it in their notifications.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Action failed',
        description: error.message,
      });
    },
  });
}

export function useMarkInteractionRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (interactionId: string) => {
      const { error } = await supabase
        .from('user_interactions')
        .update({ read_at: new Date().toISOString() })
        .eq('id', interactionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-interactions-received', user?.id] });
    },
  });
}
