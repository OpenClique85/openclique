/**
 * =============================================================================
 * PROFILE GAMIFICATION SECTION - Level, XP, Achievements, Streaks display
 * =============================================================================
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUserLevel } from '@/hooks/useUserLevel';
import { useUserTreeXP, getTreeDisplayName, getTreeIcon } from '@/hooks/useUserTreeXP';
import { useUserAchievements, getCriteriaDescription } from '@/hooks/useUserAchievements';
import { useUserStreaks, getStreakMessage } from '@/hooks/useUserStreaks';
import { Zap, Trophy, Flame, Lock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfileGamificationSection() {
  const { level, name: levelName, currentXP, nextLevelXP, progressPercent, xpToNext, isLoading: levelLoading } = useUserLevel();
  const { treeXP, isLoading: treeLoading } = useUserTreeXP();
  const { achievements, unlockedCount, totalCount, isLoading: achievementsLoading } = useUserAchievements();
  const { streaks, isLoading: streaksLoading } = useUserStreaks();

  const isLoading = levelLoading || treeLoading || achievementsLoading || streaksLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Level & XP Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                <span className="text-2xl font-bold text-primary">{level}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{levelName}</h3>
                <p className="text-sm text-muted-foreground">Level {level}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary font-semibold">
                <Zap className="h-4 w-4" />
                {currentXP.toLocaleString()} XP
              </div>
              <p className="text-xs text-muted-foreground">
                {xpToNext.toLocaleString()} XP to next level
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Level {level}</span>
              <span>Level {level + 1}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tree XP Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Path Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {(['culture', 'wellness', 'connector'] as const).map((tree) => (
              <div
                key={tree}
                className="text-center p-3 rounded-lg bg-muted/50 border border-border"
              >
                <span className="text-2xl">{getTreeIcon(tree)}</span>
                <p className="text-lg font-semibold mt-1">{treeXP[tree]}</p>
                <p className="text-xs text-muted-foreground capitalize">{tree}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Achievements
            </CardTitle>
            <Badge variant="secondary">
              {unlockedCount} / {totalCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No achievements available yet. Keep exploring!
            </p>
          ) : (
            <div className="grid gap-3">
              {achievements.slice(0, 6).map((achievement) => (
                <div
                  key={achievement?.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all',
                    achievement?.unlocked
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-muted/30 border-border opacity-70'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-xl',
                    achievement?.unlocked ? 'bg-primary/20' : 'bg-muted'
                  )}>
                    {achievement?.unlocked ? (
                      achievement?.icon
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'font-medium text-sm truncate',
                        !achievement?.unlocked && 'text-muted-foreground'
                      )}>
                        {achievement?.name}
                      </p>
                      {achievement?.unlocked && (
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {achievement?.criteria && getCriteriaDescription(achievement.criteria)}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    +{achievement?.xp_reward} XP
                  </Badge>
                </div>
              ))}
              {achievements.length > 6 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                  +{achievements.length - 6} more achievements
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Streaks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {streaks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No streak rules active yet.
            </p>
          ) : (
            <div className="space-y-4">
              {streaks.map((streak) => (
                <div key={streak.id} className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    streak.isActive
                      ? 'bg-orange-100 dark:bg-orange-900/30'
                      : 'bg-muted'
                  )}>
                    <Flame className={cn(
                      'h-6 w-6',
                      streak.isActive ? 'text-orange-500' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{streak.name}</p>
                      {streak.isActive && (
                        <Badge variant="secondary" className="text-orange-600 bg-orange-100 dark:bg-orange-900/30">
                          {streak.currentCount} {streak.interval === 'weekly' ? 'weeks' : 'months'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getStreakMessage(streak.currentCount, streak.interval)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Best</p>
                    <p className="font-semibold">{streak.longestCount}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
