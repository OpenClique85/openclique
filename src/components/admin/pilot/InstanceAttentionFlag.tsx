/**
 * Instance Attention Flag
 * 
 * Displays visual attention flags for instances that need admin action.
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Users, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { Enums } from '@/integrations/supabase/types';

type InstanceStatus = Enums<'instance_status'>;

export interface AttentionFlag {
  type: 'ready_for_squad' | 'underfilled' | 'unassigned' | 'squad_incomplete' | 'ready_to_go' | 'starting_soon';
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
  shortLabel: string;
}

interface AttentionFlagProps {
  flag: AttentionFlag | null;
}

export function InstanceAttentionFlag({ flag }: AttentionFlagProps) {
  if (!flag) return null;

  const getIcon = () => {
    switch (flag.type) {
      case 'ready_for_squad':
        return <Users className="h-3 w-3" />;
      case 'underfilled':
        return <AlertTriangle className="h-3 w-3" />;
      case 'unassigned':
        return <AlertCircle className="h-3 w-3" />;
      case 'ready_to_go':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'starting_soon':
        return <Clock className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getBadgeStyles = () => {
    switch (flag.severity) {
      case 'error':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'warning':
        return 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30';
      case 'success':
        return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
      default:
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`text-xs gap-1 cursor-help ${getBadgeStyles()}`}
          >
            {getIcon()}
            {flag.shortLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">{flag.message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Calculate attention flag for an instance based on its state
 */
export function calculateAttentionFlag(
  instance: {
    status: InstanceStatus;
    current_signup_count: number | null;
    capacity: number;
    target_squad_size: number | null;
    scheduled_date: string;
    start_time: string;
  },
  squadCount: number
): AttentionFlag | null {
  const signupCount = instance.current_signup_count || 0;
  const targetSquadSize = instance.target_squad_size || 6;
  const threshold = Math.ceil(targetSquadSize * 0.8);
  
  // Calculate hours until start
  const eventDate = new Date(`${instance.scheduled_date}T${instance.start_time}`);
  const now = new Date();
  const hoursUntilStart = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Past events - no flag
  if (hoursUntilStart < 0 && instance.status !== 'completed') {
    return null;
  }

  // Ready to form squad - recruiting with enough signups but no squads
  if (
    instance.status === 'recruiting' &&
    signupCount >= threshold &&
    squadCount === 0
  ) {
    return {
      type: 'ready_for_squad',
      severity: 'warning',
      message: `${signupCount} users signed up — ready to form squads`,
      shortLabel: 'Ready for squad',
    };
  }

  // Underfilled near start (< 2 hours away, fewer than 3 users)
  if (
    instance.status === 'recruiting' &&
    hoursUntilStart > 0 &&
    hoursUntilStart < 2 &&
    signupCount < 3
  ) {
    return {
      type: 'underfilled',
      severity: 'error',
      message: `Only ${signupCount} users, starts in ${Math.round(hoursUntilStart * 60)} minutes`,
      shortLabel: 'Underfilled',
    };
  }

  // Starting soon - less than 2 hours, squads formed
  if (
    instance.status === 'locked' &&
    hoursUntilStart > 0 &&
    hoursUntilStart < 2 &&
    squadCount > 0
  ) {
    return {
      type: 'starting_soon',
      severity: 'info',
      message: `Starting in ${Math.round(hoursUntilStart * 60)} minutes`,
      shortLabel: 'Starting soon',
    };
  }

  // All good - locked and ready
  if (
    instance.status === 'locked' &&
    squadCount > 0 &&
    signupCount >= threshold
  ) {
    return {
      type: 'ready_to_go',
      severity: 'success',
      message: `All set with ${squadCount} squad${squadCount > 1 ? 's' : ''} formed`,
      shortLabel: 'Ready',
    };
  }

  return null;
}
