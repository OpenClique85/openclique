import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type OpsEventType =
  | 'signup_created' | 'signup_status_changed' | 'signup_xp_awarded'
  | 'squad_created' | 'squad_member_added' | 'squad_member_removed'
  | 'quest_created' | 'quest_published' | 'quest_status_changed'
  | 'xp_awarded' | 'achievement_unlocked' | 'streak_updated'
  | 'notification_sent' | 'notification_failed' | 'email_sent' | 'email_failed'
  | 'ticket_created' | 'ticket_resolved' | 'admin_action' | 'manual_override'
  | 'feature_flag_changed' | 'shadow_session_started' | 'shadow_session_ended';

export interface LogOpsEventParams {
  eventType: OpsEventType;
  correlationId?: string;
  userId?: string;
  questId?: string;
  squadId?: string;
  signupId?: string;
  listingId?: string;
  ticketId?: string;
  orgId?: string;
  sponsorId?: string;
  creatorId?: string;
  beforeState?: Record<string, Json>;
  afterState?: Record<string, Json>;
  metadata?: Record<string, Json>;
  actorType?: 'admin' | 'system' | 'edge_function';
}

/**
 * Log an operational event to the ops_events table.
 * Fails silently to avoid blocking main workflows.
 */
export async function logOpsEvent({
  eventType,
  correlationId,
  userId,
  questId,
  squadId,
  signupId,
  listingId,
  ticketId,
  orgId,
  sponsorId,
  creatorId,
  beforeState,
  afterState,
  metadata,
  actorType = 'admin',
}: LogOpsEventParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('ops_events').insert({
      event_type: eventType,
      correlation_id: correlationId,
      user_id: userId,
      quest_id: questId,
      squad_id: squadId,
      signup_id: signupId,
      listing_id: listingId,
      ticket_id: ticketId,
      org_id: orgId,
      sponsor_id: sponsorId,
      creator_id: creatorId,
      before_state: beforeState as Json,
      after_state: afterState as Json,
      metadata: metadata as Json,
      actor_user_id: user?.id,
      actor_type: actorType,
    });

    if (error) {
      console.error('Failed to log ops event:', error);
    }
  } catch (err) {
    console.error('Failed to log ops event:', err);
  }
}

/**
 * Log multiple events with the same correlation ID
 */
export async function logOpsEventBatch(
  events: LogOpsEventParams[],
  sharedCorrelationId?: string
): Promise<void> {
  const correlationId = sharedCorrelationId || crypto.randomUUID();
  
  for (const event of events) {
    await logOpsEvent({
      ...event,
      correlationId: event.correlationId || correlationId,
    });
  }
}
