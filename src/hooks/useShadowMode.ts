import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logOpsEvent } from '@/lib/opsEvents';

export interface ShadowSession {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  reason: string;
  started_at: string;
  ended_at: string | null;
  accessed_tables: string[];
  actions_taken: Record<string, unknown>[];
}

export interface ShadowUserData {
  profile: Record<string, unknown> | null;
  signups: Record<string, unknown>[];
  xp: Record<string, unknown> | null;
  achievements: Record<string, unknown>[];
  badges: Record<string, unknown>[];
  streaks: Record<string, unknown>[];
  squads: Record<string, unknown>[];
  tickets: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
  treeXp: Record<string, unknown>[];
}

export function useShadowMode() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeSession, setActiveSession] = useState<ShadowSession | null>(null);
  
  const startSession = useMutation({
    mutationFn: async ({ targetUserId, reason }: { targetUserId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('admin_shadow_sessions')
        .insert({
          admin_user_id: user?.id,
          target_user_id: targetUserId,
          reason,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await logOpsEvent({
        eventType: 'shadow_session_started',
        userId: targetUserId,
        metadata: { reason, sessionId: data.id },
      });
      
      return data as ShadowSession;
    },
    onSuccess: (session) => {
      setActiveSession(session);
    },
  });
  
  const endSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('admin_shadow_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);
      
      if (error) throw error;
      
      await logOpsEvent({
        eventType: 'shadow_session_ended',
        metadata: { sessionId },
      });
    },
    onSuccess: () => {
      setActiveSession(null);
      queryClient.invalidateQueries({ queryKey: ['shadow-sessions'] });
    },
  });
  
  const logTableAccess = async (tableName: string) => {
    if (!activeSession) return;
    
    const currentTables = activeSession.accessed_tables || [];
    if (!currentTables.includes(tableName)) {
      await supabase
        .from('admin_shadow_sessions')
        .update({ accessed_tables: [...currentTables, tableName] })
        .eq('id', activeSession.id);
    }
  };
  
  return {
    activeSession,
    startSession,
    endSession,
    logTableAccess,
    isActive: !!activeSession,
  };
}

export function useShadowUserData(userId: string | null) {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['shadow-user-data', userId],
    queryFn: async (): Promise<ShadowUserData> => {
      if (!userId) throw new Error('No user ID provided');
      
      // Fetch all user data in parallel
      const [
        profileRes,
        signupsRes,
        xpRes,
        achievementsRes,
        badgesRes,
        streaksRes,
        squadsRes,
        ticketsRes,
        notificationsRes,
        treeXpRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('quest_signups').select('*, quests(title, slug)').eq('user_id', userId).order('signed_up_at', { ascending: false }),
        supabase.from('user_xp').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_achievements').select('*, achievement_templates(*)').eq('user_id', userId),
        supabase.from('user_badges').select('*, badge_templates(*)').eq('user_id', userId),
        supabase.from('user_streaks').select('*, streak_templates(*)').eq('user_id', userId),
        supabase.from('squad_members').select('*, quest_squads(*, quests(title))').eq('user_id', userId),
        supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('user_tree_xp').select('*').eq('user_id', userId),
      ]);
      
      return {
        profile: profileRes.data,
        signups: signupsRes.data || [],
        xp: xpRes.data,
        achievements: achievementsRes.data || [],
        badges: badgesRes.data || [],
        streaks: streaksRes.data || [],
        squads: squadsRes.data || [],
        tickets: ticketsRes.data || [],
        notifications: notificationsRes.data || [],
        treeXp: treeXpRes.data || [],
      };
    },
    enabled: isAdmin && !!userId,
  });
}

export function useShadowSessions() {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['shadow-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_shadow_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ShadowSession[];
    },
    enabled: isAdmin,
  });
}
