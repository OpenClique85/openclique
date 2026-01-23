import { useState } from 'react';
import { Zap } from 'lucide-react';
import { useUserXP, formatXPSource } from '@/hooks/useUserXP';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function XPBadge() {
  const { totalXP, recentTransactions, isLoading } = useUserXP();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-8 w-16 bg-muted animate-pulse rounded-full" />
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
            "bg-primary/10 hover:bg-primary/20 transition-colors",
            "text-primary font-medium text-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
        >
          <Zap className="h-4 w-4 fill-primary" />
          <span>{totalXP.toLocaleString()} XP</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Zap className="h-5 w-5 text-primary fill-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{totalXP.toLocaleString()} XP</p>
              <p className="text-xs text-muted-foreground">Experience Points</p>
            </div>
          </div>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {recentTransactions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Complete quests and give feedback to earn XP!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
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
                    {tx.amount > 0 ? '+' : ''}{tx.amount} XP
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
