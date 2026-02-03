/**
 * =============================================================================
 * ADVENTURE JOURNAL - Central hub for progression, achievements, badges, meta quests
 * =============================================================================
 * 
 * Structured like WoW's Adventure Guide with three tabs:
 * - Monthly Challenges (default)
 * - Achievements
 * - Badges
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserLevel } from '@/hooks/useUserLevel';
import { Trophy, Target, Award, Zap, Calendar, Flame } from 'lucide-react';
import { MonthlyChallengesTab } from './MonthlyChallengesTab';
import { AchievementsTab } from './AchievementsTab';
import { BadgesTab } from './BadgesTab';

export function AdventureJournal() {
  const [activeTab, setActiveTab] = useState('challenges');
  const { level, name: levelName, currentXP, progressPercent, xpToNext, isLoading: levelLoading } = useUserLevel();

  if (levelLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Level & XP Header */}
      <Card className="overflow-hidden border-2 border-primary/20">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border-4 border-background shadow-lg">
                <span className="text-2xl font-bold text-primary-foreground">{level}</span>
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">{levelName}</h2>
                <p className="text-sm text-muted-foreground">Level {level} Adventurer</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-primary font-bold text-lg">
                <Zap className="h-5 w-5" />
                {currentXP.toLocaleString()} XP
              </div>
              <p className="text-xs text-muted-foreground">
                {xpToNext.toLocaleString()} XP to next level
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Level {level}</span>
              <span>{Math.round(progressPercent)}%</span>
              <span>Level {level + 1}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Journal Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Monthly</span> Challenges
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Badges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="mt-4">
          <MonthlyChallengesTab />
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <AchievementsTab />
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          <BadgesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
