/**
 * Instance Attention Flag
 * 
 * Displays visual attention flags for instances that need admin action.
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Users, AlertCircle, CheckCircle2, Clock, MessageCircle, ClipboardCheck, AlertOctagon } from 'lucide-react';
import type { Enums } from '@/integrations/supabase/types';

type InstanceStatus = Enums<'instance_status'>;
// Extended squad status type to include warm-up states (may not be in generated types yet)
type SquadStatus = 'draft' | 'confirmed' | 'warming_up' | 'ready_for_review' | 'approved' | 'active' | 'completed';

export interface AttentionFlag {
  type: 'ready_for_squad' | 'underfilled' | 'unassigned' | 'squad_incomplete' | 'ready_to_go' | 'starting_soon' | 'squad_warming_up' | 'squad_pending_review' | 'squad_warmup_stalled';
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
      case 'squad_warming_up':
        return <MessageCircle className="h-3 w-3" />;
      case 'squad_pending_review':
        return <ClipboardCheck className="h-3 w-3" />;
      case 'squad_warmup_stalled':
        return <AlertOctagon className="h-3 w-3" />;
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
 * Squad warm-up state for attention flag calculation
 */
export interface SquadWarmUpState {
  status: SquadStatus;
  warmingUpSince?: string | null;
  readyCount: number;
  totalMembers: number;
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
  squadCount: number,
  squadWarmUpStates?: SquadWarmUpState[]
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

  // Check squad warm-up states first (higher priority)
  if (squadWarmUpStates && squadWarmUpStates.length > 0) {
    // Check for squads pending review (highest priority warm-up flag)
    const pendingReviewSquads = squadWarmUpStates.filter(s => s.status === 'ready_for_review');
    if (pendingReviewSquads.length > 0) {
      return {
        type: 'squad_pending_review',
        severity: 'warning',
        message: `${pendingReviewSquads.length} squad${pendingReviewSquads.length > 1 ? 's' : ''} ready for admin approval`,
        shortLabel: 'Needs Review',
      };
    }

    // Check for stalled warm-ups (warming_up for > 24 hours)
    const stalledSquads = squadWarmUpStates.filter(s => {
      if (s.status !== 'warming_up' || !s.warmingUpSince) return false;
      const warmUpStart = new Date(s.warmingUpSince);
      const hoursSinceStart = (now.getTime() - warmUpStart.getTime()) / (1000 * 60 * 60);
      return hoursSinceStart > 24;
    });
    if (stalledSquads.length > 0) {
      return {
        type: 'squad_warmup_stalled',
        severity: 'error',
        message: `${stalledSquads.length} squad${stalledSquads.length > 1 ? 's' : ''} stuck in warm-up for 24+ hours`,
        shortLabel: 'Stalled',
      };
    }

    // Check for squads actively warming up
    const warmingUpSquads = squadWarmUpStates.filter(s => s.status === 'warming_up');
    if (warmingUpSquads.length > 0) {
      const totalReady = warmingUpSquads.reduce((acc, s) => acc + s.readyCount, 0);
      const totalMembers = warmingUpSquads.reduce((acc, s) => acc + s.totalMembers, 0);
      return {
        type: 'squad_warming_up',
        severity: 'info',
        message: `${warmingUpSquads.length} squad${warmingUpSquads.length > 1 ? 's' : ''} warming up (${totalReady}/${totalMembers} members ready)`,
        shortLabel: 'Warming Up',
      };
    }
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
