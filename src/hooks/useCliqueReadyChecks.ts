/**
 * useCliqueReadyChecks - Hook for managing ready checks (go/no-go) within a clique
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReadyCheckResponse {
  user_id: string;
  response: 'go' | 'maybe' | 'no';
  responded_at: string;
}

export interface ReadyCheck {
  id: string;
  title: string;
  triggered_by: string;
  triggered_by_name?: string;
  context_quest_id: string | null;
  created_at: string;
  expires_at: string;
  responses: ReadyCheckResponse[];
  user_response?: 'go' | 'maybe' | 'no' | null;
}

export function useCliqueReadyChecks(cliqueId: string | undefined, memberCount: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checks, setChecks] = useState<ReadyCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const fetchChecks = async () => {
    if (!cliqueId || !user) return;

    const { data: checksData, error } = await supabase
      .from('clique_ready_checks')
      .select('*')
      .eq('squad_id', cliqueId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching ready checks:', error);
      return;
    }

    // Get all responses
    const checkIds = checksData?.map(c => c.id) || [];
    const { data: responsesData } = checkIds.length > 0 
      ? await supabase
          .from('clique_ready_check_responses')
          .select('*')
          .in('ready_check_id', checkIds)
      : { data: [] };

    // Get user names for triggered_by
    const userIds = [...new Set((checksData || []).map(c => c.triggered_by))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('profiles').select('id, display_name').in('id', userIds)
      : { data: [] };

    const profilesMap = new Map((profiles || []).map(p => [p.id, p.display_name]));

    const processedChecks: ReadyCheck[] = (checksData || []).map(check => {
      const checkResponses = (responsesData || [])
        .filter(r => r.ready_check_id === check.id)
        .map(r => ({
          user_id: r.user_id,
          response: r.response as 'go' | 'maybe' | 'no',
          responded_at: r.responded_at || '',
        }));

      const userResponse = checkResponses.find(r => r.user_id === user.id)?.response || null;

      return {
        id: check.id,
        title: check.title,
        triggered_by: check.triggered_by,
        triggered_by_name: (profilesMap.get(check.triggered_by) as string) || 'Unknown',
        context_quest_id: check.context_quest_id,
        created_at: check.created_at || '',
        expires_at: check.expires_at,
        responses: checkResponses,
        user_response: userResponse,
      };
    });

    setChecks(processedChecks);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchChecks();
  }, [cliqueId, user]);

  const createReadyCheck = async (title: string, expiresInMinutes: number = 60, questId?: string) => {
    if (!cliqueId || !user) return;

    setIsCreating(true);
    
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('clique_ready_checks')
      .insert({
        squad_id: cliqueId,
        triggered_by: user.id,
        title,
        expires_at: expiresAt,
        context_quest_id: questId || null,
      });

    setIsCreating(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create ready check',
        description: error.message,
      });
      return false;
    }

    toast({ title: 'Ready check sent!' });
    fetchChecks();
    return true;
  };

  const respond = async (checkId: string, response: 'go' | 'maybe' | 'no') => {
    if (!user) return;

    setIsResponding(true);

    // Check if already responded
    const existingCheck = checks.find(c => c.id === checkId);
    if (existingCheck?.user_response) {
      // Update existing response
      const { error } = await supabase
        .from('clique_ready_check_responses')
        .update({ response, responded_at: new Date().toISOString() })
        .eq('ready_check_id', checkId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to update response',
          description: error.message,
        });
        setIsResponding(false);
        return;
      }
    } else {
      // Insert new response
      const { error } = await supabase
        .from('clique_ready_check_responses')
        .insert({
          ready_check_id: checkId,
          user_id: user.id,
          response,
        });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to respond',
          description: error.message,
        });
        setIsResponding(false);
        return;
      }
    }

    setIsResponding(false);
    toast({ 
      title: response === 'go' ? "You're in! 🎉" : response === 'maybe' ? 'Noted as maybe' : 'Thanks for letting us know' 
    });
    fetchChecks();
  };

  const activeChecks = checks.filter(c => new Date(c.expires_at) > new Date());
  const expiredChecks = checks.filter(c => new Date(c.expires_at) <= new Date());

  return {
    checks,
    activeChecks,
    expiredChecks,
    isLoading,
    isCreating,
    isResponding,
    createReadyCheck,
    respond,
    refetch: fetchChecks,
  };
}
