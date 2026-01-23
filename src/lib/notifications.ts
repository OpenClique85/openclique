import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type NotificationType = Database['public']['Enums']['notification_type'];

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  questId?: string;
  referrerUserId?: string;
}

/**
 * Creates an in-app notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  questId,
  referrerUserId,
}: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body: body || null,
      quest_id: questId || null,
      referrer_user_id: referrerUserId || null,
    });

    if (error) {
      console.error('Failed to create notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error creating notification:', err);
    return { success: false, error: 'Unknown error' };
  }
}

/**
 * Sends a sponsorship proposal notification to a creator
 */
export async function notifyCreatorOfProposal(params: {
  creatorUserId: string;
  sponsorName: string;
  questTitle?: string;
  proposalType: 'sponsor_quest' | 'request_quest';
}): Promise<void> {
  const { creatorUserId, sponsorName, questTitle, proposalType } = params;

  const title = proposalType === 'sponsor_quest'
    ? `${sponsorName} wants to sponsor your quest`
    : `${sponsorName} is requesting a custom quest`;

  const body = proposalType === 'sponsor_quest' && questTitle
    ? `New sponsorship proposal for "${questTitle}"`
    : 'You have a new sponsorship proposal to review';

  await createNotification({
    userId: creatorUserId,
    type: 'sponsorship_proposal_received',
    title,
    body,
  });
}

/**
 * Notifies sponsor when their proposal is accepted
 */
export async function notifySponsorProposalAccepted(params: {
  sponsorUserId: string;
  creatorName: string;
  questTitle?: string;
}): Promise<void> {
  const { sponsorUserId, creatorName, questTitle } = params;

  await createNotification({
    userId: sponsorUserId,
    type: 'sponsorship_proposal_accepted',
    title: `${creatorName} accepted your proposal!`,
    body: questTitle 
      ? `Your sponsorship proposal for "${questTitle}" has been accepted.` 
      : 'Your sponsorship request has been accepted.',
  });
}

/**
 * Notifies sponsor when their proposal is declined
 */
export async function notifySponsorProposalDeclined(params: {
  sponsorUserId: string;
  creatorName: string;
  questTitle?: string;
  reason?: string;
}): Promise<void> {
  const { sponsorUserId, creatorName, questTitle, reason } = params;

  await createNotification({
    userId: sponsorUserId,
    type: 'sponsorship_proposal_declined',
    title: `${creatorName} declined your proposal`,
    body: reason 
      ? `Reason: ${reason}` 
      : questTitle 
        ? `Your proposal for "${questTitle}" was declined.`
        : 'Your sponsorship request was declined.',
  });
}

/**
 * Notifies sponsor when their sponsored quest is approved by admin
 */
export async function notifySponsorQuestApproved(params: {
  sponsorUserId: string;
  questTitle: string;
}): Promise<void> {
  const { sponsorUserId, questTitle } = params;

  await createNotification({
    userId: sponsorUserId,
    type: 'sponsored_quest_approved',
    title: 'Your sponsored quest is live!',
    body: `"${questTitle}" has been approved and is now visible to questers.`,
  });
}

/**
 * Notifies sponsor when their sponsored quest completes
 */
export async function notifySponsorQuestCompleted(params: {
  sponsorUserId: string;
  questTitle: string;
  participantCount: number;
}): Promise<void> {
  const { sponsorUserId, questTitle, participantCount } = params;

  await createNotification({
    userId: sponsorUserId,
    type: 'sponsor_quest_completed',
    title: 'Sponsored quest completed!',
    body: `"${questTitle}" has completed with ${participantCount} participants. Check your analytics for results.`,
  });
}

/**
 * Calls the notify-admin edge function to send email alerts
 */
export async function notifyAdminByEmail(params: {
  type: 'new_signup' | 'quest_full' | 'cancellation' | 'feedback' | 'custom' | 'proposal_pending';
  data: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('notify-admin', {
      body: params,
    });

    if (error) {
      console.error('Failed to notify admin:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error notifying admin:', err);
    return { success: false, error: 'Unknown error' };
  }
}
