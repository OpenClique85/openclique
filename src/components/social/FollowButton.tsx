/**
 * FollowButton - Reusable button for following/unfollowing creators and sponsors
 */

import { Button } from '@/components/ui/button';
import { Heart, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  useIsFollowing,
  useFollowCreator,
  useUnfollowCreator,
  useFollowSponsor,
  useUnfollowSponsor,
} from '@/hooks/useFollows';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface FollowButtonProps {
  type: 'creator' | 'sponsor';
  targetId: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function FollowButton({
  type,
  targetId,
  size = 'default',
  variant = 'default',
  className,
}: FollowButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isFollowing, isLoading: checkingFollow } = useIsFollowing(type, targetId);

  const followCreator = useFollowCreator();
  const unfollowCreator = useUnfollowCreator();
  const followSponsor = useFollowSponsor();
  const unfollowSponsor = useUnfollowSponsor();

  const isMutating =
    followCreator.isPending ||
    unfollowCreator.isPending ||
    followSponsor.isPending ||
    unfollowSponsor.isPending;

  const handleClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isFollowing) {
      if (type === 'creator') {
        unfollowCreator.mutate(targetId);
      } else {
        unfollowSponsor.mutate(targetId);
      }
    } else {
      if (type === 'creator') {
        followCreator.mutate(targetId);
      } else {
        followSponsor.mutate(targetId);
      }
    }
  };

  if (checkingFollow) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn('gap-2', className)}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleClick}
      disabled={isMutating}
      className={cn(
        'gap-2 transition-all',
        isFollowing && 'border-primary/50 hover:border-destructive hover:text-destructive hover:bg-destructive/10',
        className
      )}
    >
      {isMutating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <Check className="h-4 w-4" />
      ) : (
        <Heart className="h-4 w-4" />
      )}
      <span>{isFollowing ? 'Following' : 'Follow'}</span>
    </Button>
  );
}

export default FollowButton;
