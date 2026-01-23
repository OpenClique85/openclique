import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { OpsEventType } from '@/lib/opsEvents';

export interface OpsEvent {
  id: string;
  event_type: OpsEventType;
  correlation_id: string | null;
  user_id: string | null;
  quest_id: string | null;
  squad_id: string | null;
  signup_id: string | null;
  listing_id: string | null;
  ticket_id: string | null;
  org_id: string | null;
  sponsor_id: string | null;
  creator_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  actor_user_id: string | null;
  actor_type: string | null;
  created_at: string;
}

export interface OpsEventFilters {
  eventType?: OpsEventType;
  userId?: string;
  questId?: string;
  squadId?: string;
  signupId?: string;
  orgId?: string;
  sponsorId?: string;
  correlationId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export function useOpsEvents(filters: OpsEventFilters = {}) {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['ops-events', filters],
    queryFn: async () => {
      let query = supabase
        .from('ops_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters.limit || 100);
      
      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.questId) {
        query = query.eq('quest_id', filters.questId);
      }
      if (filters.squadId) {
        query = query.eq('squad_id', filters.squadId);
      }
      if (filters.signupId) {
        query = query.eq('signup_id', filters.signupId);
      }
      if (filters.orgId) {
        query = query.eq('org_id', filters.orgId);
      }
      if (filters.sponsorId) {
        query = query.eq('sponsor_id', filters.sponsorId);
      }
      if (filters.correlationId) {
        query = query.eq('correlation_id', filters.correlationId);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as OpsEvent[];
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useCorrelatedEvents(correlationId: string | null) {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['ops-events-correlated', correlationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_events')
        .select('*')
        .eq('correlation_id', correlationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as OpsEvent[];
    },
    enabled: isAdmin && !!correlationId,
  });
}
