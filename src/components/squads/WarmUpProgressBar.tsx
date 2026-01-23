/**
 * Warm-Up Progress Bar
 * 
 * Compact visual indicator of squad warm-up readiness.
 */

import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, CheckCircle2 } from 'lucide-react';
import type { WarmUpProgress } from '@/lib/squadLifecycle';

interface WarmUpProgressBarProps {
  progress: WarmUpProgress;
  showLabel?: boolean;
  compact?: boolean;
}

export function WarmUpProgressBar({ progress, showLabel = true, compact = false }: WarmUpProgressBarProps) {
  const { totalMembers, readyMembers, percentage, isComplete } = progress;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <Progress 
                value={percentage} 
                className={`h-1.5 w-16 ${isComplete ? '[&>div]:bg-emerald-500' : ''}`}
              />
              <span className={`text-xs ${isComplete ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {readyMembers}/{totalMembers}
              </span>
              {isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{readyMembers} of {totalMembers} members ready ({percentage}%)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Warm-Up Progress
          </span>
          <span className={isComplete ? 'text-emerald-600 font-medium' : ''}>
            {readyMembers}/{totalMembers} ready
          </span>
        </div>
      )}
      <Progress 
        value={percentage} 
        className={`h-2 ${isComplete ? '[&>div]:bg-emerald-500' : ''}`}
      />
    </div>
  );
}
