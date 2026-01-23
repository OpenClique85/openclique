import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Enums } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Loader2, 
  Check, 
  X, 
  AlertTriangle, 
  Send, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  Target,
  Award,
  Shield,
  ExternalLink
} from 'lucide-react';
import { auditLog } from '@/lib/auditLog';

type Quest = Tables<'quests'>;
type ReviewStatus = Enums<'review_status'>;

interface QuestWithCreator extends Quest {
  creator_profile?: {
    display_name: string;
  };
}

interface QuestReviewModalProps {
  quest: QuestWithCreator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

export function QuestReviewModal({ quest, open, onOpenChange, onActionComplete }: QuestReviewModalProps) {
  const [adminNotes, setAdminNotes] = useState(quest?.admin_notes || '');
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  // Reset admin notes when quest changes
  if (quest && adminNotes !== quest.admin_notes && action === null) {
    setAdminNotes(quest.admin_notes || '');
  }

  async function handleReviewAction(newStatus: ReviewStatus, shouldPublish = false) {
    if (!quest) return;
    
    setLoading(true);
    setAction(newStatus);

    try {
      const updates: Partial<Quest> = {
        review_status: newStatus,
        admin_notes: adminNotes,
        revision_count: (quest.revision_count || 0) + (newStatus === 'needs_changes' ? 1 : 0)
      };

      // If publishing, also update status and published_at
      if (shouldPublish) {
        updates.status = 'open';
        updates.published_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('quests')
        .update(updates)
        .eq('id', quest.id);

      if (updateError) throw updateError;

      // Audit log the quest review action
      await auditLog({
        action: 'quest_review',
        targetTable: 'quests',
        targetId: quest.id,
        oldValues: { 
          review_status: quest.review_status, 
          status: quest.status,
          title: quest.title,
        },
        newValues: { 
          review_status: newStatus, 
          published: shouldPublish,
          admin_notes: adminNotes || null,
        },
      });

      // Create notification for the creator
      if (quest.creator_id) {
        const notificationType = 
          newStatus === 'approved' ? 'quest_approved' :
          newStatus === 'needs_changes' ? 'quest_changes_requested' :
          newStatus === 'rejected' ? 'quest_rejected' : null;

        if (notificationType) {
          const notificationTitle = 
            newStatus === 'approved' ? `Your quest "${quest.title}" has been approved!` :
            newStatus === 'needs_changes' ? `Changes requested for "${quest.title}"` :
            `Your quest "${quest.title}" was not approved`;

          const notificationBody = 
            newStatus === 'approved' 
              ? (shouldPublish ? 'Your quest is now live and accepting signups!' : 'You can now publish it when ready.') 
              : newStatus === 'needs_changes' 
                ? (adminNotes || 'Please review the admin feedback and make necessary updates.')
                : (adminNotes || 'Unfortunately, your quest submission was not approved.');

          await supabase.from('notifications').insert({
            user_id: quest.creator_id,
            type: notificationType,
            title: notificationTitle,
            body: notificationBody,
            quest_id: quest.id
          });
        }

        // Send email notification
        try {
          // Get creator's email from profiles
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('email, display_name')
            .eq('id', quest.creator_id)
            .single();

          if (creatorProfile?.email) {
            const templateMap: Record<string, string> = {
              'approved': 'quest_approved',
              'needs_changes': 'quest_needs_changes',
              'rejected': 'quest_rejected'
            };

            const template = templateMap[newStatus];
            if (template) {
              await supabase.functions.invoke('send-email', {
                body: {
                  to: creatorProfile.email,
                  subject: newStatus === 'approved' 
                    ? `🎉 Your quest "${quest.title}" is approved!`
                    : newStatus === 'needs_changes'
                      ? `📝 Feedback on "${quest.title}"`
                      : `Update on "${quest.title}"`,
                  template,
                  variables: {
                    creator_name: creatorProfile.display_name || quest.creator_profile?.display_name || 'Creator',
                    quest_title: quest.title,
                    admin_notes: adminNotes || '',
                    is_published: shouldPublish ? 'true' : 'false',
                    quest_url: shouldPublish ? `${window.location.origin}/quests/${quest.slug}` : '',
                    edit_url: `${window.location.origin}/creator/quests/${quest.id}/edit`
                  }
                }
              });
            }
          }
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't block the action if email fails
        }
      }

      const successMessage = 
        shouldPublish ? 'Quest approved and published!' :
        newStatus === 'approved' ? 'Quest approved!' :
        newStatus === 'needs_changes' ? 'Changes requested - creator notified' :
        'Quest rejected';

      toast.success(successMessage);
      onActionComplete();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update quest');
    } finally {
      setLoading(false);
      setAction(null);
    }
  }

  if (!quest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{quest.icon}</span>
            {quest.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6">
            {/* Quest Image */}
            {quest.image_url && (
              <div className="aspect-video relative overflow-hidden rounded-lg">
                <img
                  src={quest.image_url}
                  alt={quest.title}
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{quest.theme || 'No theme'}</Badge>
                {quest.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              
              <p className="text-muted-foreground">{quest.short_description}</p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>by {quest.creator_profile?.display_name || quest.creator_name || 'Unknown'}</span>
                {quest.creator_social_url && (
                  <a
                    href={quest.creator_social_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    Social <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            <Separator />

            {/* When & Where */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  When
                </h4>
                {quest.start_datetime ? (
                  <div className="text-sm">
                    <p>{format(new Date(quest.start_datetime), 'EEEE, MMMM d, yyyy')}</p>
                    <p className="text-muted-foreground">
                      {format(new Date(quest.start_datetime), 'h:mm a')}
                      {quest.end_datetime && ` - ${format(new Date(quest.end_datetime), 'h:mm a')}`}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Where
                </h4>
                {quest.meeting_location_name ? (
                  <div className="text-sm">
                    <p>{quest.meeting_location_name}</p>
                    {quest.meeting_address && (
                      <p className="text-muted-foreground">{quest.meeting_address}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Capacity
                </h4>
                <p className="text-sm">{quest.capacity_total || 6} people per squad</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Cost
                </h4>
                <p className="text-sm">{quest.cost_description || 'Free'}</p>
              </div>
            </div>

            {/* Objectives */}
            {quest.objectives && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Objectives
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{quest.objectives}</p>
                </div>
              </>
            )}

            {/* Success Criteria */}
            {quest.success_criteria && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Success Criteria
                </h4>
                <p className="text-sm whitespace-pre-wrap">{quest.success_criteria}</p>
              </div>
            )}

            {/* Rewards */}
            {quest.rewards && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Rewards
                </h4>
                <p className="text-sm whitespace-pre-wrap">{quest.rewards}</p>
              </div>
            )}

            {/* Full Description */}
            {quest.briefing_html && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Full Description</h4>
                  <div 
                    className="text-sm prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: quest.briefing_html }}
                  />
                </div>
              </>
            )}

            <Separator />

            {/* Revision Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Revision #{(quest.revision_count || 0) + 1}</span>
              {quest.submitted_at && (
                <span>Submitted {format(new Date(quest.submitted_at), 'MMM d, yyyy h:mm a')}</span>
              )}
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes (visible to creator if changes requested)</Label>
              <Textarea
                id="admin-notes"
                placeholder="Add feedback for the creator..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </ScrollArea>

        <Separator className="my-4" />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {quest.review_status === 'approved' && quest.status !== 'open' && (
            <Button
              onClick={() => handleReviewAction('approved', true)}
              disabled={loading}
              className="sm:mr-auto"
            >
              {loading && action === 'approved' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publish Quest
            </Button>
          )}

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => handleReviewAction('rejected')}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              {loading && action === 'rejected' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleReviewAction('needs_changes')}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              {loading && action === 'needs_changes' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Request Changes
            </Button>
            
            <Button
              onClick={() => handleReviewAction('approved', quest.review_status !== 'approved')}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              {loading && action === 'approved' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {quest.review_status === 'approved' ? 'Approve & Publish' : 'Approve'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
