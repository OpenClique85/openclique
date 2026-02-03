/**
 * FollowerCountBadge - Displays formatted follower count
 */

import { useFollowerCount } from '@/hooks/useFollows';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowerCountBadgeProps {
  type: 'creator' | 'sponsor';
  targetId: string;
  className?: string;
  showIcon?: boolean;
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}m`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export function FollowerCountBadge({
  type,
  targetId,
  className,
  showIcon = true,
}: FollowerCountBadgeProps) {
  const { data: count = 0, isLoading } = useFollowerCount(type, targetId);

  if (isLoading) {
    return (
      <span className={cn('text-muted-foreground text-sm animate-pulse', className)}>
        — followers
      </span>
    );
  }

  return (
    <span className={cn('text-muted-foreground text-sm flex items-center gap-1', className)}>
      {showIcon && <Users className="h-4 w-4" />}
      <span className="font-medium text-foreground">{formatCount(count)}</span>
      <span>follower{count !== 1 ? 's' : ''}</span>
    </span>
  );
}

export default FollowerCountBadge;
