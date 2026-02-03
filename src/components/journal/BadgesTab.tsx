/**
 * =============================================================================
 * BADGES TAB - Visual trophy showcase
 * =============================================================================
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserBadges } from '@/hooks/useMonthlyMetaQuests';
import { Award, Lock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const RARITY_COLORS: Record<string, string> = {
  common: 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50',
  uncommon: 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/30',
  rare: 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30',
  epic: 'border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/30',
  legendary: 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30',
};

const RARITY_BADGE_COLORS: Record<string, string> = {
  common: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  uncommon: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  rare: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  epic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  legendary: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
};

export function BadgesTab() {
  const { earnedBadges, lockedBadges, earnedCount, totalCount, isLoading } = useUserBadges();

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Badge Showcase</h3>
          <p className="text-sm text-muted-foreground">
            Earn badges by completing achievements, quests, and special events.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {earnedCount} / {totalCount}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Badges Collected
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Your Collection
          </h4>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {earnedBadges.map((userBadge: any) => (
              <BadgeCard
                key={userBadge.id}
                badge={userBadge.badge}
                awardedAt={userBadge.awarded_at}
                isFeatured={userBadge.is_featured}
              />
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            Locked Badges
          </h4>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {lockedBadges.map((badge: any) => (
              <BadgeCard key={badge.id} badge={badge} locked />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface BadgeCardProps {
  badge: any;
  awardedAt?: string;
  isFeatured?: boolean;
  locked?: boolean;
}

function BadgeCard({ badge, awardedAt, isFeatured, locked }: BadgeCardProps) {
  const rarity = badge?.rarity || 'common';
  const rarityStyle = RARITY_COLORS[rarity] || RARITY_COLORS.common;
  const badgeStyle = RARITY_BADGE_COLORS[rarity] || RARITY_BADGE_COLORS.common;

  return (
    <Card className={cn(
      'aspect-square flex flex-col items-center justify-center p-4 text-center transition-all border-2',
      locked 
        ? 'bg-muted/30 border-dashed border-muted-foreground/20 opacity-50' 
        : rarityStyle,
      isFeatured && 'ring-2 ring-primary ring-offset-2'
    )}>
      <div className={cn(
        'w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3',
        locked ? 'bg-muted' : 'bg-white/50 dark:bg-black/20 shadow-inner'
      )}>
        {locked ? (
          <Lock className="h-8 w-8 text-muted-foreground" />
        ) : (
          badge?.icon || '🏅'
        )}
      </div>
      
      <p className={cn(
        'font-semibold text-sm truncate w-full',
        locked && 'text-muted-foreground'
      )}>
        {locked ? '???' : badge?.name}
      </p>
      
      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-2">
        {badge?.description}
      </p>

      {!locked && (
        <Badge variant="secondary" className={cn('text-xs', badgeStyle)}>
          {rarity}
        </Badge>
      )}

      {!locked && awardedAt && (
        <p className="text-[10px] text-muted-foreground mt-2">
          {format(new Date(awardedAt), 'MMM d, yyyy')}
        </p>
      )}
    </Card>
  );
}
