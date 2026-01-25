/**
 * TooltipInfo - Reusable info icon with tooltip for contextual help
 */

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TooltipInfoProps {
  text: string;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function TooltipInfo({ text, className, side = 'top' }: TooltipInfoProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info
            className={cn(
              'h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors',
              className
            )}
          />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
