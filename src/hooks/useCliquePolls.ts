/**
 * useCliquePolls - Hook for managing polls within a clique
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface PollOption {
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  poll_type: string | null;
  is_anonymous: boolean;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  closed_at: string | null;
  user_vote?: number | null;
}

export function useCliquePolls(cliqueId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const fetchPolls = async () => {
    if (!cliqueId || !user) return;

    const { data: pollsData, error } = await supabase
      .from('clique_polls')
      .select('*')
      .eq('squad_id', cliqueId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching polls:', error);
      return;
    }

    // Get user's votes
    const { data: votes } = await supabase
      .from('clique_poll_votes')
      .select('poll_id, option_index')
      .eq('user_id', user.id);

    const votesMap = new Map(votes?.map(v => [v.poll_id, v.option_index]) || []);

    const processedPolls: Poll[] = (pollsData || []).map(poll => {
      const options = (poll.options as Json[]) || [];
      return {
        id: poll.id,
        question: poll.question,
        options: options.map((opt: any) => ({
          label: opt.label || '',
          votes: opt.votes || 0,
        })),
        poll_type: poll.poll_type,
        is_anonymous: poll.is_anonymous || false,
        created_by: poll.created_by,
        created_at: poll.created_at || '',
        expires_at: poll.expires_at,
        closed_at: poll.closed_at,
        user_vote: votesMap.get(poll.id) ?? null,
      };
    });

    setPolls(processedPolls);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPolls();
  }, [cliqueId, user]);

  const createPoll = async (question: string, options: string[], expiresInHours?: number) => {
    if (!cliqueId || !user) return;

    setIsCreating(true);
    
    const pollOptions = options.map(label => ({ label, votes: 0 }));
    const expiresAt = expiresInHours 
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('clique_polls')
      .insert({
        squad_id: cliqueId,
        created_by: user.id,
        question,
        options: pollOptions,
        expires_at: expiresAt,
      });

    setIsCreating(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create poll',
        description: error.message,
      });
      return false;
    }

    toast({ title: 'Poll created!' });
    fetchPolls();
    return true;
  };

  const vote = async (pollId: string, optionIndex: number) => {
    if (!user) return;

    setIsVoting(true);

    // Check if already voted
    const existingPoll = polls.find(p => p.id === pollId);
    if (existingPoll?.user_vote !== null && existingPoll?.user_vote !== undefined) {
      toast({
        variant: 'destructive',
        title: 'Already voted',
        description: 'You have already voted on this poll.',
      });
      setIsVoting(false);
      return;
    }

    // Insert vote
    const { error: voteError } = await supabase
      .from('clique_poll_votes')
      .insert({
        poll_id: pollId,
        user_id: user.id,
        option_index: optionIndex,
      });

    if (voteError) {
      toast({
        variant: 'destructive',
        title: 'Failed to vote',
        description: voteError.message,
      });
      setIsVoting(false);
      return;
    }

    // Update poll options count
    const poll = polls.find(p => p.id === pollId);
    if (poll) {
      const updatedOptions = poll.options.map((opt, idx) => ({
        ...opt,
        votes: idx === optionIndex ? opt.votes + 1 : opt.votes,
      }));

      await supabase
        .from('clique_polls')
        .update({ options: updatedOptions })
        .eq('id', pollId);
    }

    setIsVoting(false);
    toast({ title: 'Vote recorded!' });
    fetchPolls();
  };

  const closePoll = async (pollId: string) => {
    const { error } = await supabase
      .from('clique_polls')
      .update({ closed_at: new Date().toISOString() })
      .eq('id', pollId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to close poll',
        description: error.message,
      });
      return;
    }

    toast({ title: 'Poll closed' });
    fetchPolls();
  };

  const activePolls = polls.filter(p => !p.closed_at && (!p.expires_at || new Date(p.expires_at) > new Date()));
  const closedPolls = polls.filter(p => p.closed_at || (p.expires_at && new Date(p.expires_at) <= new Date()));

  return {
    polls,
    activePolls,
    closedPolls,
    isLoading,
    isCreating,
    isVoting,
    createPoll,
    vote,
    closePoll,
    refetch: fetchPolls,
  };
}
