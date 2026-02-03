/**
 * =============================================================================
 * ACHIEVEMENTS TAB - Permanent record of milestone accomplishments
 * =============================================================================
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserAchievements, getCriteriaDescription } from '@/hooks/useUserAchievements';
import { Trophy, Lock, CheckCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function AchievementsTab() {
  const { achievements, unlockedCount, totalCount, isLoading } = useUserAchievements();

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Achievements Yet</h3>
          <p className="text-sm text-muted-foreground">
            Complete quests and reach milestones to unlock achievements.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Split into unlocked and locked
  const unlockedAchievements = achievements.filter((a) => a?.unlocked);
  const lockedAchievements = achievements.filter((a) => !a?.unlocked);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                {unlockedCount} / {totalCount}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Achievements Unlocked
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Unlocked
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {unlockedAchievements.map((achievement) => (
              <AchievementCard key={achievement?.id} achievement={achievement} />
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            Locked
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {lockedAchievements.map((achievement) => (
              <AchievementCard key={achievement?.id} achievement={achievement} locked />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AchievementCardProps {
  achievement: any;
  locked?: boolean;
}

function AchievementCard({ achievement, locked }: AchievementCardProps) {
  return (
    <Card className={cn(
      'transition-all overflow-hidden',
      locked 
        ? 'bg-muted/30 border-border opacity-60' 
        : 'bg-gradient-to-br from-primary/5 to-transparent border-primary/20'
    )}>
      <CardContent className="py-4 px-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0',
            locked 
              ? 'bg-muted' 
              : 'bg-primary/10 shadow-inner'
          )}>
            {locked ? (
              <Lock className="h-5 w-5 text-muted-foreground" />
            ) : (
              achievement?.icon || '🏆'
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className={cn(
                'font-semibold text-sm truncate',
                locked && 'text-muted-foreground'
              )}>
                {locked ? '???' : achievement?.name}
              </p>
              {!locked && (
                <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
              )}
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {locked 
                ? (achievement?.criteria && getCriteriaDescription(achievement.criteria))
                : achievement?.description
              }
            </p>

            <div className="flex items-center justify-between">
              <Badge variant={locked ? "outline" : "secondary"} className="text-xs">
                +{achievement?.xp_reward || 0} XP
              </Badge>
              
              {!locked && achievement?.unlockedAt && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
