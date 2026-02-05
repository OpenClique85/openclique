/**
 * End Quest Dialog
 * 
 * Confirmation dialog for ending a quest and triggering feedback requests.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Flag, CheckCircle, Users, MessageSquare } from 'lucide-react';

interface EndQuestDialogProps {
  instanceId: string;
  instanceTitle: string;
  cliques: Array<{ id: string; memberCount: number }>;
  onComplete?: () => void;
}

export function EndQuestDialog({ 
  instanceId, 
  instanceTitle, 
  cliques,
  onComplete 
}: EndQuestDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const totalParticipants = cliques.reduce((sum, c) => sum + c.memberCount, 0);

  const endQuestMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // 1. Get quest info for XP calculation
      const { data: instanceData, error: questError } = await supabase
        .from('quest_instances')
        .select('quest_id, quests(base_xp, title)')
        .eq('id', instanceId)
        .single();

      if (questError) throw questError;

      const baseXP = (instanceData?.quests as any)?.base_xp || 100;
      const completionXP = Math.floor(baseXP * 0.5);

      // 2. Update quest instance status to completed
      const { error: instanceError } = await supabase
        .from('quest_instances')
        .update({ status: 'completed' })
        .eq('id', instanceId);

      if (instanceError) throw instanceError;

      // 3. Get all participants from all cliques
      const squadIds = cliques.map(c => c.id);
      const { data: members, error: membersError } = await supabase
        .from('squad_members')
        .select('user_id, squad_id')
        .in('squad_id', squadIds)
        .neq('status', 'dropped');

      if (membersError) throw membersError;

      // 4. Update quest_signups to completed and award XP
      const uniqueUserIds = [...new Set(members.map(m => m.user_id))];
      
      // Update signups to completed
      await supabase
        .from('quest_signups')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_xp_awarded: true,
        })
        .eq('instance_id', instanceId)
        .in('status', ['confirmed', 'pending']);

      // 5. Award 50% base XP to each participant
      for (const userId of uniqueUserIds) {
        try {
          await supabase.rpc('award_xp', {
            p_user_id: userId,
            p_amount: completionXP,
            p_source: 'quest_complete',
            p_source_id: instanceId,
          });
        } catch (xpError) {
          console.warn(`Failed to award XP to ${userId}:`, xpError);
        }
      }

      // 6. Create notifications for all participants
      const feedbackMaxXP = 225; // xp_basic + xp_extended + xp_pricing + xp_testimonial
      const notifications = uniqueUserIds.map(userId => ({
        user_id: userId,
        type: 'quest_complete',
        title: `🎉 Quest Complete: ${instanceTitle}`,
        body: `You earned +${completionXP} XP! Give feedback to earn up to ${feedbackMaxXP} more.`,
        quest_id: instanceData.quest_id,
      }));

      await supabase.from('notifications').insert(notifications);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      // 7. Create feedback_requests for each participant
      const feedbackRequests = members.map((member) => ({
        quest_id: instanceData.quest_id,
        user_id: member.user_id,
        instance_id: instanceId,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        xp_basic: 30,
        xp_extended: 50,
        xp_pricing: 50,
        xp_testimonial: 100,
      }));

      // Insert feedback requests (ignore duplicates)
      for (const request of feedbackRequests) {
        await supabase
          .from('feedback_requests')
          .upsert(request, { 
            onConflict: 'quest_id,user_id',
            ignoreDuplicates: true 
          });
      }

      // 8. Send system message to all clique chats
      const systemMessage = `🎉 **Quest Complete!** You earned +${completionXP} XP. Check your profile to give feedback and earn up to ${feedbackMaxXP} more.`;
      
      for (const squadId of squadIds) {
        await supabase
          .from('squad_chat_messages')
          .insert({
            squad_id: squadId,
            sender_id: user.id,
            message: systemMessage,
            sender_type: 'system',
          });
      }

      // 9. Trigger achievement checks
      for (const userId of uniqueUserIds) {
        try {
          await supabase.rpc('check_and_unlock_achievements', { p_user_id: userId });
        } catch (achError) {
          console.warn(`Failed to check achievements for ${userId}:`, achError);
        }
      }

      // 10. Log the event
      await supabase.rpc('log_quest_event', {
        p_instance_id: instanceId,
        p_event_type: 'quest_ended' as any,
        p_actor_type: 'admin',
        p_payload: {
          participant_count: uniqueUserIds.length,
          clique_count: squadIds.length,
          feedback_requests_created: feedbackRequests.length,
          xp_awarded_per_user: completionXP,
          total_xp_awarded: completionXP * uniqueUserIds.length,
        }
      });

      return {
        participantCount: uniqueUserIds.length,
        cliqueCount: squadIds.length,
        xpAwarded: completionXP,
      };
    },
    onSuccess: (data) => {
      toast.success('Quest ended successfully!', {
        description: `${data.participantCount} participants each earned +${data.xpAwarded} XP. Feedback requests sent.`,
      });
      queryClient.invalidateQueries({ queryKey: ['instance-cliques-ros', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['quest-instance', instanceId] });
      setOpen(false);
      onComplete?.();
    },
    onError: (error: any) => {
      toast.error('Failed to end quest', { description: error.message });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Flag className="h-4 w-4" />
          End Quest & Send Feedback
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            End Quest & Request Feedback
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                This will mark <strong>"{instanceTitle}"</strong> as complete and send feedback requests to all participants.
              </p>
              
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{totalParticipants}</p>
                    <p className="text-xs text-muted-foreground">Participants</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{cliques.length}</p>
                    <p className="text-xs text-muted-foreground">Cliques</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-sm text-primary font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Feedback requests expire in 7 days
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={endQuestMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              endQuestMutation.mutate();
            }}
            disabled={endQuestMutation.isPending}
            className="gap-2"
          >
            {endQuestMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Flag className="h-4 w-4" />
                End Quest
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
