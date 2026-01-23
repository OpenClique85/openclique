/**
 * =============================================================================
 * ADMIN AUDIT LOGGING - Security monitoring for administrative actions
 * =============================================================================
 * 
 * Purpose: Log all sensitive admin operations to admin_audit_log table for
 * security monitoring, compliance, and debugging.
 * 
 * Usage:
 *   import { auditLog } from '@/lib/auditLog';
 *   
 *   await auditLog({
 *     action: 'status_change',
 *     targetTable: 'quest_signups',
 *     targetId: signupId,
 *     oldValues: { status: 'pending' },
 *     newValues: { status: 'completed' },
 *   });
 * 
 * Actions tracked:
 *   - status_change: Status updates on signups, creators, sponsors, quests
 *   - role_assignment: User role grants (creator, sponsor, admin)
 *   - application_approve: Creator/sponsor application approvals
 *   - application_reject: Creator/sponsor application rejections
 *   - quest_publish: Quest publication
 *   - quest_review: Quest approval/rejection/change requests
 *   - squad_confirm: Squad confirmation
 *   - proposal_approve: Sponsorship proposal approval
 *   - proposal_reject: Sponsorship proposal rejection
 *   - xp_award: Manual XP awards (when implemented)
 * 
 * =============================================================================
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface AuditLogParams {
  /** Type of action being performed */
  action: string;
  /** Target database table */
  targetTable: string;
  /** Target record ID */
  targetId: string;
  /** Previous values before the change (optional) */
  oldValues?: Record<string, Json>;
  /** New values after the change */
  newValues?: Record<string, Json>;
}

/**
 * Logs an admin action to the audit log table.
 * Fails silently if logging fails to avoid blocking the main operation.
 */
export async function auditLog({
  action,
  targetTable,
  targetId,
  oldValues,
  newValues,
}: AuditLogParams): Promise<void> {
  try {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('auditLog: No authenticated user, skipping log');
      return;
    }

    const { error } = await supabase
      .from('admin_audit_log')
      .insert({
        admin_user_id: user.id,
        action,
        target_table: targetTable,
        target_id: targetId,
        old_values: oldValues || null,
        new_values: newValues || null,
      });

    if (error) {
      // Log error but don't throw - audit logging shouldn't block operations
      console.error('auditLog: Failed to insert audit record:', error);
    }
  } catch (err) {
    console.error('auditLog: Unexpected error:', err);
  }
}

/**
 * Batch audit log for multiple actions in a single transaction.
 * Useful for operations that affect multiple records.
 */
export async function auditLogBatch(
  logs: AuditLogParams[]
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('auditLogBatch: No authenticated user, skipping logs');
      return;
    }

    const records = logs.map(log => ({
      admin_user_id: user.id,
      action: log.action,
      target_table: log.targetTable,
      target_id: log.targetId,
      old_values: log.oldValues || null,
      new_values: log.newValues || null,
    }));

    const { error } = await supabase
      .from('admin_audit_log')
      .insert(records);

    if (error) {
      console.error('auditLogBatch: Failed to insert audit records:', error);
    }
  } catch (err) {
    console.error('auditLogBatch: Unexpected error:', err);
  }
}
