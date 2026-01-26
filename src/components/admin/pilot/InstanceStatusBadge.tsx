/**
 * Instance Status Badge
 * 
 * Displays operational status with human-friendly labels and icons.
 */

import { Badge } from '@/components/ui/badge';
import { 
  Clock, Users, Lock, Play, CheckCircle, XCircle, 
  Archive, Pause 
} from 'lucide-react';
import type { Enums } from '@/integrations/supabase/types';

type InstanceStatus = Enums<'instance_status'>;

interface StatusConfig {
  label: string;
  icon: React.ElementType;
  className: string;
}

const STATUS_CONFIG: Record<InstanceStatus, StatusConfig> = {
  draft: {
    label: 'Waiting for Signups',
    icon: Clock,
    className: 'bg-muted text-muted-foreground border-muted',
  },
  recruiting: {
    label: 'Recruiting',
    icon: Users,
    className: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  },
  locked: {
    label: 'Cliques Formed',
    icon: Lock,
    className: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  live: {
    label: 'In Progress',
    icon: Play,
    className: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-destructive/20 text-destructive border-destructive/30',
  },
  archived: {
    label: 'Archived',
    icon: Archive,
    className: 'bg-muted text-muted-foreground border-muted',
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    className: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
  },
};

interface InstanceStatusBadgeProps {
  status: InstanceStatus;
  showIcon?: boolean;
  size?: 'sm' | 'default';
}

export function InstanceStatusBadge({ 
  status, 
  showIcon = true,
  size = 'default' 
}: InstanceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${size === 'sm' ? 'text-xs py-0' : ''}`}
    >
      {showIcon && <Icon className={`${size === 'sm' ? 'h-3 w-3 mr-1' : 'h-3.5 w-3.5 mr-1.5'}`} />}
      {config.label}
    </Badge>
  );
}

/**
 * Get the short label for a status (used in compact views)
 */
export function getStatusShortLabel(status: InstanceStatus): string {
  const shortLabels: Record<InstanceStatus, string> = {
    draft: 'Draft',
    recruiting: 'Recruiting',
    locked: 'Locked',
    live: 'Live',
    completed: 'Done',
    cancelled: 'Cancelled',
    archived: 'Archived',
    paused: 'Paused',
  };
  return shortLabels[status] || status;
}
