/**
 * Clique Lifecycle Management
 * 
 * Handles state transitions and validation for clique progression
 * through the warm-up and approval flow.
 */

// Extend the clique status to include warm-up states
// Note: These are added via migration, types will update on next sync
export type CliqueStatus = 
  | 'draft' 
  | 'confirmed' 
  | 'warming_up' 
  | 'ready_for_review' 
  | 'approved' 
  | 'active' 
  | 'completed' 
  | 'cancelled' 
  | 'archived';

/**
 * Valid state transitions for clique lifecycle
 */
export const CLIQUE_TRANSITIONS: Record<CliqueStatus, CliqueStatus[]> = {
  draft: ['confirmed'],
  confirmed: ['warming_up', 'cancelled'],
  warming_up: ['ready_for_review', 'cancelled'],
  ready_for_review: ['approved', 'warming_up', 'cancelled'],
  approved: ['active', 'cancelled'],
  active: ['completed'],
  completed: ['archived'],
  cancelled: [],
  archived: [],
};

/**
 * Human-readable labels for each status
 */
export const CLIQUE_STATUS_LABELS: Record<CliqueStatus, string> = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  warming_up: 'Warming Up',
  ready_for_review: 'Ready for Review',
  approved: 'Approved',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
  archived: 'Archived',
};

/**
 * Status badge styling
 */
export const CLIQUE_STATUS_STYLES: Record<CliqueStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500/30' },
  warming_up: { bg: 'bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-500/30' },
  ready_for_review: { bg: 'bg-orange-500/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-500/30' },
  approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/30' },
  active: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' },
  completed: { bg: 'bg-green-500/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-500/30' },
  cancelled: { bg: 'bg-destructive/20', text: 'text-destructive', border: 'border-destructive/30' },
  archived: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
};

/**
 * Check if a transition from one status to another is valid
 */
export function isValidTransition(from: CliqueStatus, to: CliqueStatus): boolean {
  return CLIQUE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get available next states for a clique
 */
export function getAvailableTransitions(currentStatus: CliqueStatus): CliqueStatus[] {
  return CLIQUE_TRANSITIONS[currentStatus] ?? [];
}

/**
 * Determine if clique instructions should be visible
 */
export function shouldShowInstructions(status: CliqueStatus | string): boolean {
  return ['approved', 'active', 'completed'].includes(status);
}

/**
 * Determine if clique is in warm-up phase
 */
export function isInWarmUp(status: CliqueStatus | string): boolean {
  return ['warming_up', 'ready_for_review'].includes(status);
}

/**
 * Determine if admin action is needed
 */
export function needsAdminAction(status: CliqueStatus | string): boolean {
  return status === 'ready_for_review';
}

/**
 * Calculate warm-up progress percentage
 */
export interface WarmUpProgress {
  totalMembers: number;
  readyMembers: number;
  percentage: number;
  isComplete: boolean;
}

export function calculateWarmUpProgress(
  members: Array<{ 
    prompt_response: string | null; 
    readiness_confirmed_at: string | null;
    status: string;
  }>,
  minReadyPct: number = 100
): WarmUpProgress {
  const activeMembers = members.filter(m => m.status !== 'dropped');
  const readyMembers = activeMembers.filter(
    m => m.prompt_response && m.readiness_confirmed_at
  );
  
  const percentage = activeMembers.length > 0
    ? Math.round((readyMembers.length / activeMembers.length) * 100)
    : 0;
  
  return {
    totalMembers: activeMembers.length,
    readyMembers: readyMembers.length,
    percentage,
    isComplete: percentage >= minReadyPct,
  };
}

// Re-export old names for backward compatibility during migration
export type SquadStatus = CliqueStatus;
export const SQUAD_TRANSITIONS = CLIQUE_TRANSITIONS;
export const SQUAD_STATUS_LABELS = CLIQUE_STATUS_LABELS;
export const SQUAD_STATUS_STYLES = CLIQUE_STATUS_STYLES;
