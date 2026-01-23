/**
 * SendQuestToMembersButton - Notifies all org members about a new/existing quest
 * Creates in-app notifications for each member
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Users } from 'lucide-react';
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

interface SendQuestToMembersButtonProps {
  orgId: string;
  orgName: string;
  questId: string;
  questTitle: string;
  memberCount: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function SendQuestToMembersButton({
  orgId,
  orgName,
  questId,
  questTitle,
  memberCount,
  variant = 'default',
  size = 'default',
  className,
}: SendQuestToMembersButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSendNotifications = async () => {
    setIsSending(true);

    try {
      // Fetch all org members
      const { data: members, error: membersError } = await supabase
        .from('profile_organizations')
        .select('profile_id')
        .eq('org_id', orgId);

      if (membersError) throw membersError;

      if (!members || members.length === 0) {
        toast({
          title: 'No members to notify',
          description: 'This organization has no members yet.',
          variant: 'destructive',
        });
        return;
      }

      // Create notifications for all members
      const notifications = members.map((member) => ({
        user_id: member.profile_id,
        type: 'org_quest_announcement' as const,
        title: `🎯 New Quest from ${orgName}`,
        body: `"${questTitle}" is now available! Tap to view details and sign up.`,
        quest_id: questId,
      }));

      const { error: notifyError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifyError) throw notifyError;

      toast({
        title: 'Notifications sent!',
        description: `${members.length} members have been notified about "${questTitle}"`,
      });

      setIsOpen(false);
    } catch (error: any) {
      console.error('Failed to send notifications:', error);
      toast({
        title: 'Failed to send notifications',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Send className="h-4 w-4 mr-2" />
          Notify Members
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Notify Organization Members</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Send a notification to all <strong>{memberCount} members</strong> of {orgName} about:
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-medium">🎯 {questTitle}</p>
            </div>
            <p className="text-sm">
              Members will receive an in-app notification with a link to view and sign up for the quest.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSendNotifications}
            disabled={isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Notify {memberCount} Members
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
