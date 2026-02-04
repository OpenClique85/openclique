/**
 * =============================================================================
 * MONTHLY CHALLENGES TAB - Track 5 meta quests, view all 20 available
 * =============================================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MobileCollapsibleSection } from '@/components/profile/MobileCollapsibleSection';
import { useMonthlyMetaQuests, MetaQuestWithProgress } from '@/hooks/useMonthlyMetaQuests';
import { Clock, Plus, Check, X, ArrowRight, Target, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function formatMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return format(date, 'MMMM yyyy');
}

export function MonthlyChallengesTab() {
  const {
    questsWithProgress,
    trackedQuests,
    availableQuests,
    completedCount,
    totalTracked,
    canTrackMore,
    maxTracked,
    currentMonth,
    daysRemaining,
    isLoading,
    trackQuest,
    untrackQuest,
    swapQuest,
    isUpdating,
  } = useMonthlyMetaQuests();

  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [selectedQuestToAdd, setSelectedQuestToAdd] = useState<MetaQuestWithProgress | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // If no monthly quests exist yet, show empty state
  if (questsWithProgress.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Challenges Available</h3>
          <p className="text-sm text-muted-foreground">
            Monthly challenges will appear here at the start of each month.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleTrackQuest = (quest: MetaQuestWithProgress) => {
    if (canTrackMore) {
      trackQuest(quest.id);
    } else {
      setSelectedQuestToAdd(quest);
      setSwapDialogOpen(true);
    }
  };

  const handleSwap = (removeId: string) => {
    if (selectedQuestToAdd) {
      swapQuest({ removeId, addId: selectedQuestToAdd.id });
      setSwapDialogOpen(false);
      setSelectedQuestToAdd(null);
    }
  };

  const totalPossibleReward = trackedQuests.reduce((sum, q) => sum + (q.xp_reward ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Month Header with Countdown */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-display font-bold text-amber-900 dark:text-amber-100">
                {formatMonthYear(currentMonth)} Challenges
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Complete tracked challenges to earn rewards
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <div className="text-right">
                <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{daysRemaining}</p>
                <p className="text-xs text-amber-600">days left</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">Tracked Progress</p>
              <p className="text-xs text-muted-foreground">
                {completedCount} of {totalTracked} completed
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">+{totalPossibleReward} XP</p>
              <p className="text-xs text-muted-foreground">potential reward</p>
            </div>
          </div>
          <Progress 
            value={totalTracked > 0 ? (completedCount / totalTracked) * 100 : 0} 
            className="h-2" 
          />
        </CardContent>
      </Card>

      {/* Tracked Quests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Your Tracked Challenges
          </h4>
          <Badge variant="outline">{totalTracked}/{maxTracked}</Badge>
        </div>

        {trackedQuests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Track up to 5 challenges to focus on this month
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Browse Challenges
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Available Challenges</DialogTitle>
                    <DialogDescription>
                      Choose up to {maxTracked} challenges to track this month
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {availableQuests.map((quest) => (
                        <MetaQuestCard
                          key={quest.id}
                          quest={quest}
                          onTrack={() => handleTrackQuest(quest)}
                          isUpdating={isUpdating}
                          showTrackButton
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {trackedQuests.map((quest) => (
              <MetaQuestCard
                key={quest.id}
                quest={quest}
                onUntrack={() => untrackQuest(quest.id)}
                isUpdating={isUpdating}
                showProgress
              />
            ))}

            {canTrackMore && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full border-dashed">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Challenge ({totalTracked}/{maxTracked})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Available Challenges</DialogTitle>
                    <DialogDescription>
                      Choose challenges to track ({maxTracked - totalTracked} slots remaining)
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {availableQuests.map((quest) => (
                        <MetaQuestCard
                          key={quest.id}
                          quest={quest}
                          onTrack={() => handleTrackQuest(quest)}
                          isUpdating={isUpdating}
                          showTrackButton
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Available Challenges - collapsible on mobile */}
      <MobileCollapsibleSection
        title="Available Challenges"
        icon={<Trophy className="h-5 w-5 text-primary" />}
        count={questsWithProgress.length}
        defaultOpenMobile={false}
        defaultOpenDesktop={true}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-muted-foreground">All Challenges This Month</h4>
          <Badge variant="secondary">{questsWithProgress.length} available</Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {questsWithProgress.map((quest) => (
            <MiniQuestCard
              key={quest.id}
              quest={quest}
              onTrack={() => handleTrackQuest(quest)}
              canTrack={!quest.isTracked}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      </MobileCollapsibleSection>

      {/* Swap Dialog */}
      <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Swap Challenge</DialogTitle>
            <DialogDescription>
              You're tracking {maxTracked} challenges. Choose one to replace:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {trackedQuests.map((quest) => (
              <button
                key={quest.id}
                onClick={() => handleSwap(quest.id)}
                className="w-full p-3 rounded-lg border hover:bg-muted/50 text-left transition-colors"
                disabled={isUpdating}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{quest.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{quest.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {quest.progress}/{quest.criteria_target}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MetaQuestCardProps {
  quest: MetaQuestWithProgress;
  onTrack?: () => void;
  onUntrack?: () => void;
  isUpdating: boolean;
  showProgress?: boolean;
  showTrackButton?: boolean;
}

function MetaQuestCard({
  quest,
  onTrack,
  onUntrack,
  isUpdating,
  showProgress,
  showTrackButton,
}: MetaQuestCardProps) {
  const progressPercent = (quest.progress / quest.criteria_target) * 100;

  return (
    <Card className={cn(
      'transition-all',
      quest.isCompleted && 'bg-primary/5 border-primary/30'
    )}>
      <CardContent className="py-3 px-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0',
            quest.isCompleted 
              ? 'bg-primary/20' 
              : 'bg-muted'
          )}>
            {quest.isCompleted ? <Check className="h-5 w-5 text-primary" /> : quest.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn(
                'font-medium text-sm truncate',
                quest.isCompleted && 'text-primary'
              )}>
                {quest.name}
              </p>
              {quest.isCompleted && (
                <Badge variant="default" className="shrink-0 text-xs">Complete</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {quest.description}
            </p>

            {showProgress && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>{quest.progress}/{quest.criteria_target}</span>
                  <span className="text-muted-foreground">
                    +{quest.xp_reward} XP
                  </span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            )}
          </div>

          {showTrackButton && onTrack && (
            <Button
              size="sm"
              variant="outline"
              onClick={onTrack}
              disabled={isUpdating}
              className="shrink-0"
            >
              <Plus className="h-3 w-3 mr-1" />
              Track
            </Button>
          )}

          {showProgress && onUntrack && !quest.isCompleted && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onUntrack}
              disabled={isUpdating}
              className="shrink-0 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface MiniQuestCardProps {
  quest: MetaQuestWithProgress;
  onTrack: () => void;
  canTrack: boolean;
  isUpdating: boolean;
}

function MiniQuestCard({ quest, onTrack, canTrack, isUpdating }: MiniQuestCardProps) {
  const progressPercent = (quest.progress / quest.criteria_target) * 100;

  return (
    <button
      onClick={canTrack ? onTrack : undefined}
      disabled={!canTrack || isUpdating}
      className={cn(
        'p-3 rounded-lg border text-left transition-all',
        quest.isTracked 
          ? 'bg-primary/5 border-primary/30' 
          : canTrack 
            ? 'hover:bg-muted/50 cursor-pointer' 
            : 'opacity-50',
        quest.isCompleted && 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{quest.icon}</span>
        <span className="font-medium text-sm truncate flex-1">{quest.name}</span>
        {quest.isTracked && (
          <Badge variant="secondary" className="text-xs">Tracked</Badge>
        )}
        {quest.isCompleted && (
          <Check className="h-4 w-4 text-green-600" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <Progress value={progressPercent} className="h-1 flex-1" />
        <span className="text-xs text-muted-foreground">
          {quest.progress}/{quest.criteria_target}
        </span>
      </div>
    </button>
  );
}
