/**
 * =============================================================================
 * GroupRoleRanker - Drag-and-drop or click-to-rank role ordering
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipInfo } from '@/components/ui/tooltip-info';
import { ArrowUp, ArrowDown, GripVertical, Check, Loader2 } from 'lucide-react';
import { useRoleRanking, ROLE_METADATA, type RoleType } from '@/hooks/useRoleRanking';
import { cn } from '@/lib/utils';

const RANK_LABELS = ['Primary', 'Secondary', 'Tertiary', 'Least'];
const RANK_COLORS = [
  'bg-amber-500/20 text-amber-600 border-amber-500/30',
  'bg-slate-400/20 text-slate-600 border-slate-400/30',
  'bg-orange-600/20 text-orange-700 border-orange-600/30',
  'bg-muted text-muted-foreground border-muted',
];

interface GroupRoleRankerProps {
  userId?: string;
  compact?: boolean;
}

export function GroupRoleRanker({ userId, compact = false }: GroupRoleRankerProps) {
  const {
    ranking,
    isLoading,
    isOwner,
    hasRanking,
    saveRanking,
    isUpdating,
  } = useRoleRanking(userId);

  const [localRanking, setLocalRanking] = useState<RoleType[]>([
    'connector',
    'planner',
    'spark',
    'stabilizer',
  ]);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state with fetched data
  useEffect(() => {
    if (ranking) {
      setLocalRanking([ranking.rank_1, ranking.rank_2, ranking.rank_3, ranking.rank_4]);
      setHasChanges(false);
    }
  }, [ranking]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newRanking = [...localRanking];
    [newRanking[index - 1], newRanking[index]] = [newRanking[index], newRanking[index - 1]];
    setLocalRanking(newRanking);
    setHasChanges(true);
  };

  const moveDown = (index: number) => {
    if (index === localRanking.length - 1) return;
    const newRanking = [...localRanking];
    [newRanking[index], newRanking[index + 1]] = [newRanking[index + 1], newRanking[index]];
    setLocalRanking(newRanking);
    setHasChanges(true);
  };

  const handleSave = async () => {
    await saveRanking({
      rank_1: localRanking[0],
      rank_2: localRanking[1],
      rank_3: localRanking[2],
      rank_4: localRanking[3],
    });
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rank how you naturally show up in groups</span>
        <TooltipInfo text="Your primary role is the energy you bring most often. This helps us build balanced cliques with complementary styles." />
      </div>

      <div className="space-y-2">
        {localRanking.map((role, index) => {
          const meta = ROLE_METADATA[role];
          return (
            <Card
              key={role}
              className={cn(
                'transition-all',
                index === 0 && 'ring-2 ring-primary/50'
              )}
            >
              <CardContent className="p-3 flex items-center gap-3">
                {isOwner && (
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveUp(index)}
                      disabled={index === 0 || isUpdating}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveDown(index)}
                      disabled={index === localRanking.length - 1 || isUpdating}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <Badge
                  variant="outline"
                  className={cn('min-w-[70px] justify-center', RANK_COLORS[index])}
                >
                  {RANK_LABELS[index]}
                </Badge>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <span className="font-medium">{meta.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>

                {!isOwner && (
                  <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isOwner && hasChanges && (
        <Button
          onClick={handleSave}
          disabled={isUpdating}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Ranking
            </>
          )}
        </Button>
      )}

      {!hasRanking && isOwner && !hasChanges && (
        <p className="text-xs text-muted-foreground text-center">
          Reorder the roles above to reflect your style, then save
        </p>
      )}
    </div>
  );
}
