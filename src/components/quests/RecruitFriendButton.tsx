/**
 * =============================================================================
 * RECRUIT FRIEND BUTTON
 * =============================================================================
 * 
 * Purpose: Button to invite friends to join a quest. Shows modal with 
 *          shareable code and link, plus XP rewards preview.
 * 
 * Features:
 *   - Generates unique friend invite code per user+quest
 *   - Copy code/link to clipboard
 *   - Native share on mobile
 *   - Shows XP reward (+50 XP per friend)
 *   - Displays progress toward achievements
 * 
 * @module components/quests/RecruitFriendButton
 * =============================================================================
 */

import { useState } from 'react';
import { useFriendInvite } from '@/hooks/useFriendInvite';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UserPlus, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  Trophy,
  Link2,
  Loader2
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';

interface RecruitFriendButtonProps {
  questId: string;
  questTitle?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function RecruitFriendButton({
  questId,
  questTitle,
  variant = 'outline',
  size = 'sm',
  className,
}: RecruitFriendButtonProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  const { 
    code, 
    shareLink, 
    isLoading, 
    isCopied, 
    copyCode, 
    copyLink,
    shareNative,
    canShare,
    recruitStats,
  } = useFriendInvite(questId);

  // Achievement progress thresholds
  const achievements = [
    { name: 'Friend Recruiter', count: 1, icon: '🤝' },
    { name: 'Social Connector', count: 5, icon: '🌟' },
    { name: 'Community Builder', count: 10, icon: '🏆' },
  ];

  const nextAchievement = achievements.find(a => a.count > recruitStats.total);
  const progressToNext = nextAchievement 
    ? Math.round((recruitStats.total / nextAchievement.count) * 100)
    : 100;

  const content = (
    <div className="space-y-6">
      {/* XP Reward Highlight */}
      <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-medium text-primary">+50 XP per friend recruited!</span>
      </div>

      {/* Invite Code Section */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Your Invite Code</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={code}
              readOnly
              className="font-mono text-center text-lg tracking-wider pr-10"
              placeholder={isLoading ? 'Loading...' : ''}
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={copyCode}
            disabled={!code || isLoading}
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Share Link Section */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Or share this link</label>
        <div className="flex gap-2">
          <Input
            value={shareLink}
            readOnly
            className="text-sm text-muted-foreground"
            placeholder={isLoading ? 'Loading...' : ''}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={copyLink}
            disabled={!shareLink || isLoading}
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </div>
        
        {canShare && (
          <Button 
            className="w-full" 
            onClick={shareNative}
            disabled={!shareLink || isLoading}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share with Friends
          </Button>
        )}
      </div>

      {/* Stats & Progress */}
      <div className="space-y-3 pt-2 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Friends recruited</span>
          <Badge variant="secondary">{recruitStats.total}</Badge>
        </div>

        {nextAchievement && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>Next: {nextAchievement.icon} {nextAchievement.name}</span>
              </span>
              <span className="text-muted-foreground">
                {recruitStats.total}/{nextAchievement.count}
              </span>
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        )}

        {!nextAchievement && recruitStats.total > 0 && (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <Check className="h-4 w-4" />
            <span>All recruitment achievements unlocked!</span>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">How it works:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Share your code with a friend</li>
          <li>They create an account using your code</li>
          <li>They're auto-signed up for this quest</li>
          <li>You earn 50 XP instantly!</li>
        </ul>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <UserPlus className="h-4 w-4 mr-1" />
            Recruit Friend
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Recruit a Friend
            </DialogTitle>
            <DialogDescription>
              {questTitle 
                ? `Invite friends to join "${questTitle}" with you!`
                : 'Invite friends to join this quest with you!'
              }
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <UserPlus className="h-4 w-4 mr-1" />
          Recruit Friend
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Recruit a Friend
          </DrawerTitle>
          <DrawerDescription>
            {questTitle 
              ? `Invite friends to join "${questTitle}" with you!`
              : 'Invite friends to join this quest with you!'
            }
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
