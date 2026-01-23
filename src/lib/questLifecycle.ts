/**
 * Quest Lifecycle Management
 * 
 * Centralized logic for quest status transitions, validation, and audit logging.
 */

import { supabase } from '@/integrations/supabase/client';
import { auditLog } from './auditLog';
import { logOpsEvent } from './opsEvents';
import type { Enums, Json } from '@/integrations/supabase/types';

type QuestStatus = Enums<'quest_status'>;
type ReviewStatus = Enums<'review_status'>;

export interface TransitionResult {
  success: boolean;
  error?: string;
  newStatus?: QuestStatus;
}

export interface TransitionOptions {
  reason?: string;
  adminNotes?: string;
  notifyCreator?: boolean;
  notifyUsers?: boolean;
}

// Valid status transitions map
const ALLOWED_TRANSITIONS: Record<QuestStatus, QuestStatus[]> = {
  draft: ['open', 'paused'],
  open: ['closed', 'paused', 'cancelled', 'revoked'],
  closed: ['completed', 'cancelled', 'open'],
  completed: [], // Terminal state - can only be archived via soft delete
  cancelled: [], // Terminal state
  paused: ['open', 'cancelled', 'revoked'],
  revoked: [], // Terminal state
};

// Actions that require mandatory reason
const REQUIRE_REASON: QuestStatus[] = ['cancelled', 'revoked'];

/**
 * Check if a status transition is allowed
 */
export function isTransitionAllowed(from: QuestStatus, to: QuestStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get all allowed transitions from a given status
 */
export function getAllowedTransitions(from: QuestStatus): QuestStatus[] {
  return ALLOWED_TRANSITIONS[from] || [];
}

/**
 * Transition a quest to a new status with full audit trail
 */
export async function transitionQuestStatus(
  questId: string,
  newStatus: QuestStatus,
  options: TransitionOptions = {}
): Promise<TransitionResult> {
  try {
    // Get current quest state
    const { data: quest, error: fetchError } = await supabase
      .from('quests')
      .select('id, status, title, creator_id, previous_status')
      .eq('id', questId)
      .single();

    if (fetchError || !quest) {
      return { success: false, error: 'Quest not found' };
    }

    const currentStatus = quest.status as QuestStatus;

    // Validate transition
    if (!isTransitionAllowed(currentStatus, newStatus)) {
      return { 
        success: false, 
        error: `Cannot transition from ${currentStatus} to ${newStatus}` 
      };
    }

    // Check required reason
    if (REQUIRE_REASON.includes(newStatus) && !options.reason) {
      return { 
        success: false, 
        error: `Reason is required when setting status to ${newStatus}` 
      };
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      previous_status: currentStatus,
    };

    // Add status-specific fields
    if (newStatus === 'paused') {
      updatePayload.paused_at = new Date().toISOString();
      updatePayload.paused_reason = options.reason || null;
    } else if (newStatus === 'revoked') {
      updatePayload.revoked_at = new Date().toISOString();
      updatePayload.revoked_reason = options.reason || null;
    }

    // Clear pause fields if resuming
    if (currentStatus === 'paused' && newStatus === 'open') {
      updatePayload.paused_at = null;
      updatePayload.paused_reason = null;
    }

    // Perform update
    const { error: updateError } = await supabase
      .from('quests')
      .update(updatePayload)
      .eq('id', questId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log to audit trail
    await auditLog({
      action: `quest_status_${newStatus}`,
      targetTable: 'quests',
      targetId: questId,
      oldValues: { status: currentStatus } as Record<string, Json>,
      newValues: { 
        status: newStatus, 
        reason: options.reason,
        admin_notes: options.adminNotes,
      } as Record<string, Json>,
    });

    // Log ops event
    await logOpsEvent({
      eventType: 'quest_status_changed',
      questId,
      beforeState: { status: currentStatus } as Record<string, Json>,
      afterState: { status: newStatus, reason: options.reason } as Record<string, Json>,
      metadata: { admin_notes: options.adminNotes } as Record<string, Json>,
    });

    // Send notifications if requested
    if (options.notifyCreator && quest.creator_id) {
      await createStatusNotification(quest.creator_id, quest.title, newStatus, options.reason);
    }

    return { success: true, newStatus };
  } catch (err) {
    console.error('Quest transition error:', err);
    return { success: false, error: 'Unexpected error during transition' };
  }
}

/**
 * Perform admin review action (approve, reject, request changes)
 */
export async function performReviewAction(
  questId: string,
  action: 'approve' | 'reject' | 'request_changes',
  options: {
    adminNotes?: string;
    shouldPublish?: boolean;
  } = {}
): Promise<TransitionResult> {
  try {
    const { data: quest, error: fetchError } = await supabase
      .from('quests')
      .select('id, review_status, status, title, creator_id, revision_count')
      .eq('id', questId)
      .single();

    if (fetchError || !quest) {
      return { success: false, error: 'Quest not found' };
    }

    let newReviewStatus: ReviewStatus;
    let newQuestStatus: QuestStatus | null = null;

    switch (action) {
      case 'approve':
        newReviewStatus = 'approved';
        if (options.shouldPublish) {
          newQuestStatus = 'open';
        }
        break;
      case 'reject':
        newReviewStatus = 'rejected';
        break;
      case 'request_changes':
        newReviewStatus = 'needs_changes';
        break;
      default:
        return { success: false, error: 'Invalid action' };
    }

    const updatePayload: Record<string, unknown> = {
      review_status: newReviewStatus,
      admin_notes: options.adminNotes || null,
      revision_count: (quest.revision_count || 0) + 1,
    };

    if (newQuestStatus) {
      updatePayload.status = newQuestStatus;
      updatePayload.published_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('quests')
      .update(updatePayload)
      .eq('id', questId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Audit log
    await auditLog({
      action: `quest_review_${action}`,
      targetTable: 'quests',
      targetId: questId,
      oldValues: { review_status: quest.review_status } as Record<string, Json>,
      newValues: { 
        review_status: newReviewStatus,
        status: newQuestStatus,
        admin_notes: options.adminNotes,
      } as Record<string, Json>,
    });

    // Notify creator
    if (quest.creator_id) {
      await createReviewNotification(quest.creator_id, quest.title, action, options.adminNotes);
    }

    return { success: true, newStatus: newQuestStatus || (quest.status as QuestStatus) };
  } catch (err) {
    console.error('Review action error:', err);
    return { success: false, error: 'Unexpected error during review action' };
  }
}

/**
 * Soft delete a quest (admin only)
 */
export async function softDeleteQuest(
  questId: string,
  reason: string
): Promise<TransitionResult> {
  try {
    // Check if quest can be deleted
    const { data: quest, error: fetchError } = await supabase
      .from('quests')
      .select('id, status, title')
      .eq('id', questId)
      .single();

    if (fetchError || !quest) {
      return { success: false, error: 'Quest not found' };
    }

    // Only allow delete for cancelled or revoked quests
    if (!['cancelled', 'revoked'].includes(quest.status)) {
      return { 
        success: false, 
        error: 'Quest must be cancelled or revoked before deletion' 
      };
    }

    // Check for active signups
    const { count } = await supabase
      .from('quest_signups')
      .select('id', { count: 'exact', head: true })
      .eq('quest_id', questId)
      .neq('status', 'dropped');

    if (count && count > 0) {
      return { 
        success: false, 
        error: 'Cannot delete quest with active signups' 
      };
    }

    // Perform soft delete
    const { error: updateError } = await supabase
      .from('quests')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', questId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await auditLog({
      action: 'quest_deleted',
      targetTable: 'quests',
      targetId: questId,
      oldValues: { status: quest.status } as Record<string, Json>,
      newValues: { deleted_at: new Date().toISOString(), reason } as Record<string, Json>,
    });

    return { success: true };
  } catch (err) {
    console.error('Delete quest error:', err);
    return { success: false, error: 'Unexpected error during deletion' };
  }
}

/**
 * Toggle priority flag on a quest
 */
export async function togglePriorityFlag(questId: string): Promise<boolean> {
  try {
    const { data: quest, error: fetchError } = await supabase
      .from('quests')
      .select('priority_flag')
      .eq('id', questId)
      .single();

    if (fetchError || !quest) return false;

    const { error } = await supabase
      .from('quests')
      .update({ priority_flag: !quest.priority_flag })
      .eq('id', questId);

    return !error;
  } catch {
    return false;
  }
}

// Helper: Create status change notification
async function createStatusNotification(
  userId: string,
  questTitle: string,
  newStatus: QuestStatus,
  reason?: string
): Promise<void> {
  const statusMessages: Record<QuestStatus, string> = {
    draft: 'has been moved to draft',
    open: 'is now live and accepting signups',
    closed: 'is now closed for signups',
    completed: 'has been marked as completed',
    cancelled: 'has been cancelled',
    paused: 'has been temporarily paused',
    revoked: 'has been revoked by an administrator',
  };

  const message = statusMessages[newStatus] || `status changed to ${newStatus}`;
  const bodyText = reason ? `${message}. Reason: ${reason}` : message;

  await supabase.from('notifications').insert([{
    user_id: userId,
    type: 'general' as const,
    title: `Quest Update: ${questTitle}`,
    body: `Your quest "${questTitle}" ${bodyText}`,
  }]);
}

// Helper: Create review notification
async function createReviewNotification(
  userId: string,
  questTitle: string,
  action: 'approve' | 'reject' | 'request_changes',
  adminNotes?: string
): Promise<void> {
  const actionMessages = {
    approve: 'has been approved',
    reject: 'has been rejected',
    request_changes: 'requires changes before approval',
  };

  const bodyText = adminNotes 
    ? `${actionMessages[action]}. Admin notes: ${adminNotes}`
    : actionMessages[action];

  // Map action to notification type
  const typeMap = {
    approve: 'quest_approved' as const,
    reject: 'quest_rejected' as const,
    request_changes: 'quest_changes_requested' as const,
  };

  await supabase.from('notifications').insert([{
    user_id: userId,
    type: typeMap[action],
    title: `Quest Review: ${questTitle}`,
    body: `Your quest "${questTitle}" ${bodyText}`,
  }]);
}
