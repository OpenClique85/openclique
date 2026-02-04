/**
 * Instance Lifecycle Management
 * 
 * Centralized utility for managing quest instance status transitions,
 * including pause/resume, cancel, and archive operations.
 */

import { supabase } from '@/integrations/supabase/client';
import { logOpsEvent } from '@/lib/opsEvents';
import { auditLog } from '@/lib/auditLog';
import type { Enums, Json } from '@/integrations/supabase/types';

export type InstanceStatus = Enums<'instance_status'>;

export interface TransitionResult {
  success: boolean;
  error?: string;
  newStatus?: InstanceStatus;
}

export interface TransitionOptions {
  reason?: string;
  notifyUsers?: boolean;
}

/**
 * Define allowed status transitions for quest instances.
 */
const ALLOWED_TRANSITIONS: Record<InstanceStatus, InstanceStatus[]> = {
  draft: ['recruiting', 'cancelled'],
  recruiting: ['locked', 'paused', 'cancelled'],
  locked: ['recruiting', 'live', 'paused', 'cancelled'], // Can unlock back to recruiting
  live: ['completed', 'paused'],
  paused: ['recruiting', 'locked', 'live', 'cancelled'], // Resume to previous or cancel
  completed: ['archived'],
  cancelled: ['archived'],
  archived: [],
};

/**
 * Statuses that require a reason to transition into
 */
const REQUIRE_REASON: InstanceStatus[] = ['paused', 'cancelled'];

/**
 * Check if a status transition is allowed
 */
export function canTransition(from: InstanceStatus, to: InstanceStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get all allowed transitions from a given status
 */
export function getAllowedTransitions(from: InstanceStatus): InstanceStatus[] {
  return ALLOWED_TRANSITIONS[from] || [];
}

/**
 * Check if a transition requires a reason
 */
export function requiresReason(to: InstanceStatus): boolean {
  return REQUIRE_REASON.includes(to);
}

/**
 * Transition an instance to a new status with validation and logging.
 */
export async function transitionInstanceStatus(
  instanceId: string,
  newStatus: InstanceStatus,
  options: TransitionOptions = {}
): Promise<TransitionResult> {
  const { reason, notifyUsers = false } = options;

  try {
    // Fetch current instance
    const { data: instance, error: fetchError } = await supabase
      .from('quest_instances')
      .select('id, status, title, previous_status')
      .eq('id', instanceId)
      .single();

    if (fetchError || !instance) {
      return { success: false, error: 'Instance not found' };
    }

    const currentStatus = instance.status as InstanceStatus;

    // Validate transition
    if (!canTransition(currentStatus, newStatus)) {
      return {
        success: false,
        error: `Cannot transition from '${currentStatus}' to '${newStatus}'`,
      };
    }

    // Check if reason is required
    if (requiresReason(newStatus) && !reason) {
      return {
        success: false,
        error: `A reason is required to transition to '${newStatus}'`,
      };
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
    };

    // Handle pause-specific fields
    if (newStatus === 'paused') {
      updatePayload.paused_at = new Date().toISOString();
      updatePayload.paused_reason = reason;
      updatePayload.previous_status = currentStatus;
    } else if (currentStatus === 'paused') {
      // Resuming from pause - clear pause fields
      updatePayload.paused_at = null;
      updatePayload.paused_reason = null;
      updatePayload.previous_status = null;
    }

    // Execute update
    const { error: updateError } = await supabase
      .from('quest_instances')
      .update(updatePayload)
      .eq('id', instanceId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log to ops_events
    await logOpsEvent({
      eventType: newStatus === 'paused' ? 'manual_override' : 'quest_status_changed',
      questId: instanceId,
      beforeState: { status: currentStatus as Json },
      afterState: { status: newStatus as Json, reason: reason as Json },
      metadata: { action: `instance_${newStatus}` as Json },
    });

    // Log to audit log for critical actions
    if (['cancelled', 'paused', 'archived'].includes(newStatus)) {
      await auditLog({
        action: `instance_${newStatus}`,
        targetTable: 'quest_instances',
        targetId: instanceId,
        oldValues: { status: currentStatus },
        newValues: { status: newStatus, reason },
      });
    }

    // Send notifications if requested
    if (notifyUsers && ['paused', 'cancelled'].includes(newStatus)) {
      await notifyInstanceUsers(instanceId, newStatus, reason);
    }

    return { success: true, newStatus };
  } catch (err) {
    console.error('Instance transition error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Pause an instance (convenience function)
 */
export async function pauseInstance(
  instanceId: string,
  reason: string
): Promise<TransitionResult> {
  return transitionInstanceStatus(instanceId, 'paused', { reason, notifyUsers: true });
}

/**
 * Resume an instance from paused state
 */
export async function resumeInstance(instanceId: string): Promise<TransitionResult> {
  // Fetch the previous status to resume to
  const { data: instance, error } = await supabase
    .from('quest_instances')
    .select('previous_status')
    .eq('id', instanceId)
    .single();

  if (error || !instance) {
    return { success: false, error: 'Instance not found' };
  }

  const resumeToStatus = (instance.previous_status as InstanceStatus) || 'recruiting';
  return transitionInstanceStatus(instanceId, resumeToStatus);
}

/**
 * Cancel an instance
 */
export async function cancelInstance(
  instanceId: string,
  reason: string
): Promise<TransitionResult> {
  return transitionInstanceStatus(instanceId, 'cancelled', { reason, notifyUsers: true });
}

/**
 * Archive a completed or cancelled instance
 */
export async function archiveInstance(instanceId: string): Promise<TransitionResult> {
  return transitionInstanceStatus(instanceId, 'archived');
}

/**
 * Notify users enrolled in an instance about status changes
 */
async function notifyInstanceUsers(
  instanceId: string,
  newStatus: InstanceStatus,
  reason?: string
): Promise<void> {
  try {
    // Fetch instance details
    const { data: instance } = await supabase
      .from('quest_instances')
      .select('title')
      .eq('id', instanceId)
      .single();

    if (!instance) return;

    // Fetch confirmed signups
    const { data: signups } = await supabase
      .from('quest_signups')
      .select('user_id')
      .eq('instance_id', instanceId)
      .in('status', ['pending', 'confirmed']);

    if (!signups || signups.length === 0) return;

    // Create notifications for each user using 'general' type
    const notifications = signups.map((signup) => ({
      user_id: signup.user_id,
      type: 'general' as const,
      title:
        newStatus === 'paused'
          ? `Quest Paused: ${instance.title}`
          : `Quest Cancelled: ${instance.title}`,
      body:
        newStatus === 'paused'
          ? `The quest has been temporarily paused. ${reason || 'We\'ll update you when it resumes.'}`
          : `Unfortunately, this quest has been cancelled. ${reason || 'We apologize for any inconvenience.'}`,
    }));

    await supabase.from('notifications').insert(notifications);
  } catch (err) {
    console.error('Failed to notify instance users:', err);
  }
}

/**
 * Get status display info for UI
 */
export const STATUS_DISPLAY: Record<
  InstanceStatus,
  { label: string; color: string; icon?: string }
> = {
  draft: { label: 'Waiting for Signups', color: 'bg-muted text-muted-foreground' },
  recruiting: { label: 'Recruiting', color: 'bg-blue-500/20 text-blue-700' },
  locked: { label: 'Cliques Formed', color: 'bg-amber-500/20 text-amber-700' },
  live: { label: 'In Progress', color: 'bg-green-500/20 text-green-700' },
  completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-700' },
  paused: { label: 'Paused', color: 'bg-orange-500/20 text-orange-700' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/20 text-destructive' },
  archived: { label: 'Archived', color: 'bg-muted text-muted-foreground' },
};
