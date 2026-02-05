/**
 * Complete Clique Dialog
 * 
 * Allows admins to complete individual cliques within a quest instance.
 * Awards XP and sends feedback requests to clique members only.
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Trophy, MessageSquare, Bell } from 'lucide-react';
import { auditLog } from '@/lib/auditLog';

interface CompleteCliqueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliqueId: string;
  cliqueName: string;
  memberCount: number;
  instanceId: string;
}

export function CompleteCliqueDialog({
  open,
  onOpenChange,
  cliqueId,
  cliqueName,
  memberCount,
  instanceId,
}: CompleteCliqueDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // 1. Get quest info for XP calculation
      const { data: squadData, error: squadError } = await supabase
        .from('quest_squads')
        .select('quest_id, instance_id')
        .eq('id', cliqueId)
        .single();

      if (squadError) throw squadError;

      const { data: questData, error: questError } = await supabase
        .from('quests')
        .select('base_xp, title')
        .eq('id', squadData.quest_id)
        .single();

      if (questError) throw questError;

      // 2. Get clique members
      const { data: members, error: membersError } = await supabase
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', cliqueId)
        .neq('status', 'dropped');

      if (membersError) throw membersError;

      const memberUserIds = members.map(m => m.user_id);

      // 3. Award 50% of base XP to clique members (rest comes from feedback)
      const xpAward = Math.floor((questData.base_xp || 100) * 0.5);
      
      for (const userId of memberUserIds) {
        // Add XP transaction
        await supabase.from('xp_transactions').insert({
          user_id: userId,
          amount: xpAward,
          source_type: 'quest_completion',
          source_id: squadData.quest_id,
          description: `Completed quest: ${questData.title} (with ${cliqueName})`,
        });

        // Update user profile XP total
        await supabase.rpc('increment_user_xp', { 
          target_user_id: userId, 
          xp_amount: xpAward 
        });
      }

      // 4. Create feedback requests for clique members
      const { data: signups, error: signupsError } = await supabase
        .from('quest_signups')
        .select('id, user_id')
        .eq('instance_id', instanceId)
        .in('user_id', memberUserIds);

      if (!signupsError && signups) {
        for (const signup of signups) {
          // Update signup status to completed
          await supabase
            .from('quest_signups')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', signup.id);

          // Create feedback request
          await supabase.from('feedback_requests').insert({
            user_id: signup.user_id,
            quest_id: squadData.quest_id,
            instance_id: instanceId,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          });
        }
      }

      // 5. Update clique status to completed
      const { error: updateError } = await supabase
        .from('quest_squads')
        .update({ status: 'completed' })
        .eq('id', cliqueId);

      if (updateError) throw updateError;

      // 6. Notify clique members
      try {
        await supabase.functions.invoke('notify-clique-members', {
          body: {
            squad_id: cliqueId,
            notification_type: 'quest_completed',
            title: 'Quest Complete! 🎉',
            body: `Congratulations! Your clique "${cliqueName}" has completed the quest. You earned ${xpAward} XP! Don't forget to submit feedback for bonus XP.`,
            metadata: { 
              instance_id: instanceId,
              xp_awarded: xpAward,
            },
          },
        });
      } catch (notifyErr) {
        console.error('Failed to send completion notifications:', notifyErr);
      }

      // 7. Send system message to clique chat
      await supabase.from('squad_chat_messages').insert({
        squad_id: cliqueId,
        sender_id: null,
        message_type: 'system',
        content: `🎉 Quest completed! All members have been awarded ${xpAward} XP. Submit your feedback within 7 days to earn bonus XP!`,
      });

      // 8. Audit log
      await auditLog({
        action: 'clique_completed',
        targetTable: 'quest_squads',
        targetId: cliqueId,
        newValues: {
          status: 'completed',
          member_count: memberCount,
          xp_awarded: xpAward,
        },
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['instance-cliques-detail', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['active-cliques', instanceId] });

      toast({
        title: 'Clique Completed!',
        description: `${cliqueName} has been marked as complete. ${memberCount} members received ${xpAward} XP each.`,
      });

      onOpenChange(false);
    } catch (err: any) {
      console.error('Error completing clique:', err);
      toast({
        title: 'Failed to complete clique',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Complete Clique
          </DialogTitle>
          <DialogDescription>
            Mark "{cliqueName}" as complete and award XP to members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium">{cliqueName}</span>
            <Badge variant="secondary">{memberCount} members</Badge>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium">This will:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Award 50% of quest XP to all members
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                Create feedback requests (7-day window)
              </li>
              <li className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-purple-500" />
                Notify members of completion
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCompleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isCompleting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCompleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Complete Clique
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
