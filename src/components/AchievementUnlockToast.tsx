/**
 * =============================================================================
 * ACHIEVEMENT UNLOCK TOAST - Celebratory notification for new achievements
 * =============================================================================
 * 
 * Purpose: Display a special toast notification when a user unlocks achievements.
 *          Uses a custom design with animation for a celebratory feel.
 * 
 * Usage:
 *   import { showAchievementToast } from '@/components/AchievementUnlockToast';
 *   showAchievementToast([{ name: 'First Steps', icon: '🎯', xp_reward: 25 }]);
 * 
 * Called From:
 *   - SignupsManager.tsx when marking a signup as 'completed'
 *   - Any future XP award flow that triggers achievements
 * 
 * @component AchievementUnlockToast
 * =============================================================================
 */

import { toast } from 'sonner';
import { Trophy } from 'lucide-react';

export interface UnlockedAchievement {
  name: string;
  icon: string | null;
  xp_reward: number;
}

/**
 * Show a celebratory toast for unlocked achievements
 * @param achievements - Array of achievements that were just unlocked
 */
export function showAchievementToast(achievements: UnlockedAchievement[]) {
  if (achievements.length === 0) return;

  // Single achievement
  if (achievements.length === 1) {
    const achievement = achievements[0];
    toast.custom(
      (id) => (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 border border-amber-200 dark:border-amber-800 rounded-lg shadow-lg p-4 flex items-center gap-4 animate-in slide-in-from-top-5 duration-300">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-2xl shadow-inner">
            {achievement.icon || '🏆'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                Achievement Unlocked!
              </span>
            </div>
            <p className="font-semibold text-foreground mt-0.5">{achievement.name}</p>
            <p className="text-sm text-muted-foreground">+{achievement.xp_reward} XP bonus</p>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: 'top-center',
      }
    );
    return;
  }

  // Multiple achievements
  const totalXP = achievements.reduce((sum, a) => sum + a.xp_reward, 0);
  toast.custom(
    (id) => (
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 border border-amber-200 dark:border-amber-800 rounded-lg shadow-lg p-4 animate-in slide-in-from-top-5 duration-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-inner">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              {achievements.length} Achievements Unlocked!
            </span>
            <p className="text-sm text-muted-foreground">+{totalXP} XP total bonus</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {achievements.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/50 dark:bg-black/20 text-sm"
            >
              <span>{a.icon || '🏆'}</span>
              <span className="font-medium">{a.name}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      duration: 6000,
      position: 'top-center',
    }
  );
}

/**
 * Show a streak milestone toast
 * @param streakName - Name of the streak
 * @param count - Current streak count
 * @param bonusXP - XP bonus awarded
 */
export function showStreakToast(streakName: string, count: number, bonusXP: number) {
  toast.custom(
    (id) => (
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 border border-orange-200 dark:border-orange-800 rounded-lg shadow-lg p-4 flex items-center gap-4 animate-in slide-in-from-top-5 duration-300">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-2xl shadow-inner">
          🔥
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
              Streak Milestone!
            </span>
          </div>
          <p className="font-semibold text-foreground mt-0.5">
            {streakName}: {count} in a row!
          </p>
          <p className="text-sm text-muted-foreground">+{bonusXP} XP streak bonus</p>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: 'top-center',
    }
  );
}