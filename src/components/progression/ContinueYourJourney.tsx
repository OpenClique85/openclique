/**
 * =============================================================================
 * CONTINUE YOUR JOURNEY COMPONENT
 * =============================================================================
 * 
 * Displays the user's progression tree progress with visual path indicators
 * and recommends next quests based on their tree XP.
 * 
 * Features:
 * - Visual progress bars for each tree (Culture, Wellness, Connector)
 * - Next recommended quest per active tree
 * - Encouragement to start paths they haven't explored
 * 
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserTreeXP } from '@/hooks/useUserTreeXP';
import { PROGRESSION_TREES } from '@/constants/progressionTrees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Compass, ChevronRight, Sparkles, Lock, TrendingUp } from 'lucide-react';

interface RecommendedQuest {
  id: string;
  slug: string;
  title: string;
  icon: string;
  short_description: string;
  progression_tree: string;
}

interface ContinueYourJourneyProps {
  userId: string;
}

// XP thresholds for visual tiers
const TREE_TIERS = [
  { name: 'Newcomer', minXP: 0, maxXP: 100 },
  { name: 'Explorer', minXP: 100, maxXP: 300 },
  { name: 'Adventurer', minXP: 300, maxXP: 600 },
  { name: 'Veteran', minXP: 600, maxXP: 1000 },
  { name: 'Master', minXP: 1000, maxXP: Infinity },
];

function getTreeTier(xp: number) {
  return TREE_TIERS.find(tier => xp >= tier.minXP && xp < tier.maxXP) || TREE_TIERS[0];
}

function getProgressPercent(xp: number) {
  const tier = getTreeTier(xp);
  if (tier.maxXP === Infinity) return 100;
  const progress = ((xp - tier.minXP) / (tier.maxXP - tier.minXP)) * 100;
  return Math.min(100, Math.max(0, progress));
}

const TREE_STYLES: Record<string, { bg: string; text: string; border: string; progress: string }> = {
  culture: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-600',
    border: 'border-pink-500/30',
    progress: 'bg-pink-500',
  },
  wellness: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/30',
    progress: 'bg-emerald-500',
  },
  connector: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/30',
    progress: 'bg-amber-500',
  },
};

export function ContinueYourJourney({ userId }: ContinueYourJourneyProps) {
  const { treeXP, isLoading: xpLoading } = useUserTreeXP();
  const [recommendations, setRecommendations] = useState<RecommendedQuest[]>([]);
  const [completedTrees, setCompletedTrees] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId, treeXP]);

  const fetchRecommendations = async () => {
    try {
      // Get user's completed quest trees
      const { data: completedQuests } = await supabase
        .from('quest_signups')
        .select('quests(progression_tree)')
        .eq('user_id', userId)
        .eq('status', 'completed');

      const completedTreesSet = new Set<string>();
      completedQuests?.forEach((signup: any) => {
        if (signup.quests?.progression_tree) {
          completedTreesSet.add(signup.quests.progression_tree);
        }
      });
      setCompletedTrees(completedTreesSet);

      // Get recommended quests from each tree the user hasn't signed up for
      const { data: signedUpQuestIds } = await supabase
        .from('quest_signups')
        .select('quest_id')
        .eq('user_id', userId);

      const signedUpIds = signedUpQuestIds?.map(s => s.quest_id) || [];

      // Get one quest per tree that user hasn't joined
      const { data: questsData } = await supabase
        .from('quests')
        .select('id, slug, title, icon, short_description, progression_tree')
        .eq('status', 'open')
        .not('id', 'in', signedUpIds.length > 0 ? `(${signedUpIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)')
        .not('progression_tree', 'is', null)
        .order('created_at', { ascending: false });

      if (questsData) {
        // Pick one quest per tree, prioritizing trees with more XP (active interest)
        const byTree: Record<string, RecommendedQuest> = {};
        questsData.forEach((quest: any) => {
          if (quest.progression_tree && !byTree[quest.progression_tree]) {
            byTree[quest.progression_tree] = quest;
          }
        });

        // Sort by XP (higher XP trees first)
        const sorted = Object.values(byTree).sort((a, b) => {
          return (treeXP[b.progression_tree] || 0) - (treeXP[a.progression_tree] || 0);
        });

        setRecommendations(sorted.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || xpLoading) {
    return (
      <Card className="border-dashed animate-pulse">
        <CardContent className="py-8">
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const hasAnyProgress = Object.values(treeXP).some(xp => xp > 0);
  const trees = Object.entries(PROGRESSION_TREES) as [keyof typeof PROGRESSION_TREES, typeof PROGRESSION_TREES[keyof typeof PROGRESSION_TREES]][];

  return (
    <section className="mb-12">
      <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
        <Compass className="h-5 w-5 text-primary" />
        Continue Your Journey
      </h2>

      {/* Tree Progress Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {trees.map(([treeId, tree]) => {
          const xp = treeXP[treeId] || 0;
          const tier = getTreeTier(xp);
          const progress = getProgressPercent(xp);
          const style = TREE_STYLES[treeId];
          const hasStarted = xp > 0;
          const recommendation = recommendations.find(r => r.progression_tree === treeId);

          return (
            <Card 
              key={treeId} 
              className={`relative overflow-hidden transition-all hover:shadow-md ${
                hasStarted ? style.border : 'border-dashed'
              }`}
            >
              {/* Decorative glow for active trees */}
              {hasStarted && (
                <div 
                  className={`absolute inset-0 opacity-5 ${style.bg}`}
                  style={{ 
                    background: `radial-gradient(circle at top right, ${tree.colorTheme.primary}, transparent 70%)` 
                  }}
                />
              )}

              <CardHeader className="pb-2 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tree.icon}</span>
                    <CardTitle className="text-base font-medium">
                      {tree.name}
                    </CardTitle>
                  </div>
                  {hasStarted && (
                    <Badge variant="outline" className={`text-xs ${style.text}`}>
                      {tier.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="relative">
                {hasStarted ? (
                  <>
                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{xp} XP</span>
                        {tier.maxXP !== Infinity && (
                          <span>{tier.maxXP} XP</span>
                        )}
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${style.progress}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Next recommended quest */}
                    {recommendation ? (
                      <Link 
                        to={`/quests/${recommendation.slug}`}
                        className="block p-3 -mx-3 -mb-3 bg-muted/50 hover:bg-muted transition-colors rounded-b-lg"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Next:</span>
                          <span className="font-medium truncate">{recommendation.icon} {recommendation.title}</span>
                          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                        </div>
                      </Link>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No quests available in this path right now.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {/* Unexplored path */}
                    <p className="text-sm text-muted-foreground mb-3">
                      {tree.tooltipDescription}
                    </p>
                    {recommendation ? (
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to={`/quests/${recommendation.slug}`}>
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                          Start This Path
                        </Link>
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" />
                        <span>No quests available yet</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Encouragement message */}
      {!hasAnyProgress && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Compass className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Begin Your Adventure</p>
              <p className="text-sm text-muted-foreground">
                Complete quests to earn XP and unlock new paths. Each tree leads to unique experiences!
              </p>
            </div>
            <Button asChild className="ml-auto shrink-0">
              <Link to="/quests">Browse Quests</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
