/**
 * =============================================================================
 * MONTHLY CHALLENGES TOAST - Notification for meta quest progress
 * =============================================================================
 */

import { toast } from 'sonner';
import { Target, Trophy } from 'lucide-react';

interface ChallengeProgressUpdate {
  name: string;
  icon: string;
  currentProgress: number;
  target: number;
  isCompleted: boolean;
  xpReward: number;
}

/**
 * Show a progress update toast for a tracked meta quest
 */
export function showChallengeProgressToast(update: ChallengeProgressUpdate) {
  if (update.isCompleted) {
    // Completion toast
    toast.custom(
      (id) => (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-4 flex items-center gap-4 animate-in slide-in-from-top-5 duration-300">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-2xl shadow-inner">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                Challenge Complete!
              </span>
            </div>
            <p className="font-semibold text-foreground mt-0.5">{update.name}</p>
            <p className="text-sm text-muted-foreground">+{update.xpReward} XP earned</p>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: 'top-center',
      }
    );
  } else {
    // Progress update toast
    toast.custom(
      (id) => (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 flex items-center gap-3 animate-in slide-in-from-top-5 duration-300">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
            {update.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{update.name}</p>
            <p className="text-xs text-muted-foreground">
              Progress: {update.currentProgress}/{update.target}
            </p>
          </div>
          <Target className="h-4 w-4 text-primary shrink-0" />
        </div>
      ),
      {
        duration: 3000,
        position: 'top-center',
      }
    );
  }
}

/**
 * Show a month summary toast at the start of a new month
 */
export function showMonthlySummaryToast(
  monthName: string,
  completedCount: number,
  xpEarned: number,
  coinsEarned: number
) {
  toast.custom(
    (id) => (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-200 dark:border-amber-800 rounded-lg shadow-lg p-4 animate-in slide-in-from-top-5 duration-300 max-w-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              {monthName} Complete!
            </p>
            <p className="font-semibold text-foreground">Monthly Summary</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-white/50 dark:bg-black/20">
            <p className="text-lg font-bold">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="p-2 rounded bg-white/50 dark:bg-black/20">
            <p className="text-lg font-bold">+{xpEarned}</p>
            <p className="text-xs text-muted-foreground">XP</p>
          </div>
          <div className="p-2 rounded bg-white/50 dark:bg-black/20">
            <p className="text-lg font-bold">+{coinsEarned}</p>
            <p className="text-xs text-muted-foreground">Coins</p>
          </div>
        </div>
      </div>
    ),
    {
      duration: 8000,
      position: 'top-center',
    }
  );
}
