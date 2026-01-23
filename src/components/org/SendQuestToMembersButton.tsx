/**
 * SendQuestToMembersButton - Notifies all org members about a new/existing quest
 * Creates in-app notifications and sends emails for each member
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Users, Mail } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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
  questSlug?: string;
  questDate?: string;
  questLocation?: string;
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
  questSlug,
  questDate,
  questLocation,
  memberCount,
  variant = 'default',
  size = 'default',
  className,
}: SendQuestToMembersButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const { toast } = useToast();

  const handleSendNotifications = async () => {
    setIsSending(true);

    try {
      // Fetch all org members with their profiles
      const { data: members, error: membersError } = await supabase
        .from('profile_organizations')
        .select(`
          profile_id,
          profile:profiles(email, display_name)
        `)
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

      // Create in-app notifications for all members
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

      // Send emails if checkbox is checked
      let emailsSent = 0;
      if (sendEmail) {
        const membersWithEmail = members.filter(
          (m: any) => m.profile?.email
        );

        for (const member of membersWithEmail) {
          const profile = (member as any).profile;
          if (!profile?.email) continue;

          try {
            // Build quest URL
            const questUrl = questSlug 
              ? `${window.location.origin}/quests/${questSlug}`
              : `${window.location.origin}/quests`;

            const emailHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #14b8a6; margin: 0;">🎯 New Quest from ${orgName}</h1>
                </div>
                
                <p style="font-size: 16px; color: #333;">
                  Hey ${profile.display_name || 'there'}!
                </p>
                
                <p style="font-size: 16px; color: #333;">
                  <strong>${orgName}</strong> just posted a new quest for members:
                </p>
                
                <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0;">
                  <h2 style="margin: 0 0 10px 0; color: #0f766e;">${questTitle}</h2>
                  ${questDate ? `<p style="margin: 5px 0; color: #666;">📅 ${questDate}</p>` : ''}
                  ${questLocation ? `<p style="margin: 5px 0; color: #666;">📍 ${questLocation}</p>` : ''}
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${questUrl}" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    View Quest & Sign Up
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                  Don't miss out — spots may fill up fast!
                </p>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  — The OpenClique Team
                </p>
              </div>
            `;

            await supabase.functions.invoke('send-email', {
              body: {
                to: profile.email,
                subject: `🎯 New Quest from ${orgName}: ${questTitle}`,
                template: 'custom',
                customHtml: emailHtml,
              },
            });

            emailsSent++;
          } catch (emailErr) {
            console.error('Failed to send email to member:', emailErr);
          }
        }
      }

      toast({
        title: 'Notifications sent!',
        description: sendEmail && emailsSent > 0
          ? `${members.length} in-app notifications + ${emailsSent} emails sent`
          : `${members.length} members have been notified about "${questTitle}"`,
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
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Send a notification to all <strong>{memberCount} members</strong> of {orgName} about:
              </p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium">🎯 {questTitle}</p>
              </div>
              
              {/* Email checkbox */}
              <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-lg border">
                <Checkbox
                  id="send-email"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="send-email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Also send email notifications
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Email members in addition to in-app notifications
                  </p>
                </div>
              </div>
            </div>
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
