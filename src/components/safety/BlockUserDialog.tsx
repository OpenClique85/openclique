/**
 * =============================================================================
 * Block User Dialog
 * =============================================================================
 * Allows users to block other users. Blocked users:
 * - Can't see the blocker's profile
 * - Can't message the blocker
 * - Won't be matched in future quests
 * - Won't know they're blocked
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Ban, CheckCircle2 } from 'lucide-react';

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  displayName: string;
  onBlocked?: () => void;
}

export function BlockUserDialog({
  open,
  onOpenChange,
  userId,
  displayName,
  onBlocked,
}: BlockUserDialogProps) {
  const [reason, setReason] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const blockMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_blocks')
        .insert({
          blocker_id: user.id,
          blocked_id: userId,
          reason: reason.trim() || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setIsBlocked(true);
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      onBlocked?.();
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast({
          title: 'Already blocked',
          description: `${displayName} is already blocked.`,
        });
        onOpenChange(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to block user',
          description: error.message,
        });
      }
    },
  });

  const handleClose = () => {
    setReason('');
    setIsBlocked(false);
    onOpenChange(false);
  };

  if (isBlocked) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle>{displayName} is now blocked</DialogTitle>
            <DialogDescription>
              You can unblock them anytime from Settings → Blocked Users
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Block {displayName}?
          </DialogTitle>
          <DialogDescription className="text-left space-y-2 pt-2">
            <p>Blocking this user means:</p>
            <ul className="list-none space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                They can't see your profile
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                They can't message you
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                You won't be matched in future quests
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                They won't know they're blocked
              </li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="block-reason" className="text-sm text-muted-foreground">
            Reason (optional, for your records only)
          </Label>
          <Textarea
            id="block-reason"
            placeholder="Why are you blocking this user?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => blockMutation.mutate()}
            disabled={blockMutation.isPending}
            className="w-full sm:w-auto"
          >
            {blockMutation.isPending ? 'Blocking...' : 'Block User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
