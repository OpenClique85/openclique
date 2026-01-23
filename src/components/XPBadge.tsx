/**
 * =============================================================================
 * XP BADGE - Compact navbar XP/level indicator with transaction popover
 * =============================================================================
 * 
 * Purpose: Always-visible XP and level indicator in the navbar. Shows:
 *   - Current level number in a circular badge
 *   - Total XP with lightning bolt icon
 *   - Popover with level progress and recent XP transactions
 * 
 * Dependencies:
 *   - useUserXP(): Fetches total XP and recent transactions
 *   - useUserLevel(): Fetches level info and progress
 * 
 * Location: Navbar.tsx (visible when user is authenticated)
 * 
 * @component XPBadge
 * =============================================================================
 */

import { useState } from 'react';
import { Zap, TrendingUp } from 'lucide-react';
import { useUserXP, formatXPSource } from '@/hooks/useUserXP';
import { useUserLevel } from '@/hooks/useUserLevel';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export function XPBadge() {
  const { totalXP, recentTransactions, isLoading: xpLoading } = useUserXP();
  const { level, name: levelName, progressPercent, xpToNext, isLoading: levelLoading } = useUserLevel();
  const [isOpen, setIsOpen] = useState(false);

  const isLoading = xpLoading || levelLoading;

  if (isLoading) {
    return (
      <div className="h-8 w-20 bg-muted animate-pulse rounded-full" />
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full",
            "bg-primary/10 hover:bg-primary/20 transition-colors",
            "text-primary font-medium text-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
        >
          {/* Level Circle */}
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            {level}
          </div>
          {/* XP Display */}
          <div className="flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 fill-primary" />
            <span className="text-xs">{totalXP.toLocaleString()}</span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Level Header */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{level}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{levelName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={progressPercent} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {xpToNext} to lvl {level + 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* XP Total */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary fill-primary" />
            <span className="font-medium">{totalXP.toLocaleString()} XP</span>
          </div>
          <Link 
            to="/profile" 
            className="text-xs text-primary hover:underline flex items-center gap-1"
            onClick={() => setIsOpen(false)}
          >
            <TrendingUp className="h-3 w-3" />
            View Progress
          </Link>
        </div>
        
        {/* Recent Transactions */}
        <div className="max-h-48 overflow-y-auto">
          {recentTransactions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Complete quests to earn XP!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatXPSource(tx.source)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold",
                    tx.amount > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
