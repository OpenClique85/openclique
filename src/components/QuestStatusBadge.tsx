/**
 * Quest Status Badge
 * 
 * Consistent status badge component used across all quest-related UIs.
 * Supports both quest_status and review_status enums.
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, Pause, XOctagon } from 'lucide-react';
import type { Enums } from '@/integrations/supabase/types';

type QuestStatus = Enums<'quest_status'>;
type ReviewStatus = Enums<'review_status'>;

interface QuestStatusBadgeProps {
  status: QuestStatus | ReviewStatus;
  type?: 'quest' | 'review';
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const QUEST_STATUS_CONFIG: Record<QuestStatus, { label: string; className: string; icon?: React.ReactNode }> = {
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground border-muted-foreground/30',
  },
  open: {
    label: 'Open',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  closed: {
    label: 'Closed',
    className: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400',
  },
  completed: {
    label: 'Completed',
    className: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-destructive/10 text-destructive border-destructive/30 line-through',
  },
  paused: {
    label: 'Paused',
    className: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 animate-pulse',
    icon: <Pause className="h-3 w-3" />,
  },
  revoked: {
    label: 'Revoked',
    className: 'bg-red-200 text-red-800 border-red-400 dark:bg-red-900/50 dark:text-red-300',
    icon: <XOctagon className="h-3 w-3" />,
  },
};

const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { label: string; className: string; icon?: React.ReactNode }> = {
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground border-muted-foreground/30',
  },
  pending_review: {
    label: 'Pending Review',
    className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
  needs_changes: {
    label: 'Needs Changes',
    className: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400',
  },
};

export function QuestStatusBadge({ 
  status, 
  type = 'quest', 
  size = 'md',
  showIcon = true,
  className 
}: QuestStatusBadgeProps) {
  const config = type === 'quest' 
    ? QUEST_STATUS_CONFIG[status as QuestStatus] 
    : REVIEW_STATUS_CONFIG[status as ReviewStatus];

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline"
      className={cn(
        'font-medium border',
        size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5',
        config.className,
        className
      )}
    >
      {showIcon && config.icon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

export { QUEST_STATUS_CONFIG, REVIEW_STATUS_CONFIG };
