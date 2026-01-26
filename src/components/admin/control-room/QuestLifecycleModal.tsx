/**
 * Quest Lifecycle Modal
 * 
 * Full admin control panel for quest review and lifecycle management.
 * Supports: approve, reject, request changes, pause, resume, cancel, revoke, delete.
 * Enhanced to show quest constraints, objectives, roles, and personality affinities.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Check, X, FileEdit, Pause, Play, Ban, XOctagon, Trash2, 
  Flag, FlagOff, Loader2, Calendar, MapPin, Users, Clock,
  ArrowRight, History, Sparkles, Target, Brain, Filter
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { QuestStatusBadge } from '@/components/QuestStatusBadge';
import { QuestConstraintsDisplay } from '@/components/admin/QuestConstraintsDisplay';
import { QuestAffinitiesDisplay } from '@/components/admin/QuestAffinitiesDisplay';
import { QuestObjectivesDisplay } from '@/components/admin/QuestObjectivesDisplay';
import { QuestRolesDisplay } from '@/components/admin/QuestRolesDisplay';
import { 
  transitionQuestStatus, 
  performReviewAction, 
  softDeleteQuest,
  togglePriorityFlag 
} from '@/lib/questLifecycle';
import type { Enums, Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;
type QuestConstraints = Tables<'quest_constraints'>;
type QuestObjective = Tables<'quest_objectives'>;
type QuestRole = Tables<'quest_roles'>;
type QuestPersonalityAffinity = Tables<'quest_personality_affinity'>;
type QuestStatus = Enums<'quest_status'>;

interface QuestWithCreator extends Quest {
  creator_profile?: {
    display_name: string;
  } | null;
  sponsor_profiles?: {
    name: string;
  } | null;
}

interface QuestLifecycleModalProps {
  quest: QuestWithCreator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DangerAction = 'revoke' | 'delete' | null;

export function QuestLifecycleModal({ quest, open, onOpenChange }: QuestLifecycleModalProps) {
  const { toast } = useToast();
  const [adminNotes, setAdminNotes] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [dangerAction, setDangerAction] = useState<DangerAction>(null);
  const [confirmText, setConfirmText] = useState('');

  // Fetch creator history
  const { data: creatorHistory } = useQuery({
    queryKey: ['creator-history', quest?.creator_id],
    queryFn: async () => {
      if (!quest?.creator_id) return null;
      
      const { data, error } = await supabase
        .from('quests')
        .select('id, title, status, review_status, created_at')
        .eq('creator_id', quest.creator_id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) return null;
      return data;
    },
    enabled: !!quest?.creator_id,
  });

  // Fetch audit log for this quest
  const { data: auditLog } = useQuery({
    queryKey: ['quest-audit-log', quest?.id],
    queryFn: async () => {
      if (!quest?.id) return null;
      
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .eq('target_table', 'quests')
        .eq('target_id', quest.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) return null;
      return data;
    },
    enabled: !!quest?.id,
  });

  // Fetch quest constraints
  const { data: constraints } = useQuery({
    queryKey: ['quest-constraints', quest?.id],
    queryFn: async () => {
      if (!quest?.id) return null;
      
      const { data, error } = await supabase
        .from('quest_constraints')
        .select('*')
        .eq('quest_id', quest.id)
        .maybeSingle();
      
      if (error) return null;
      return data as QuestConstraints | null;
    },
    enabled: !!quest?.id,
  });

  // Fetch quest objectives
  const { data: objectives } = useQuery({
    queryKey: ['quest-objectives', quest?.id],
    queryFn: async () => {
      if (!quest?.id) return null;
      
      const { data, error } = await supabase
        .from('quest_objectives')
        .select('*')
        .eq('quest_id', quest.id)
        .order('objective_order', { ascending: true });
      
      if (error) return null;
      return data as QuestObjective[];
    },
    enabled: !!quest?.id,
  });

  // Fetch quest roles
  const { data: roles } = useQuery({
    queryKey: ['quest-roles', quest?.id],
    queryFn: async () => {
      if (!quest?.id) return null;
      
      const { data, error } = await supabase
        .from('quest_roles')
        .select('*')
        .eq('quest_id', quest.id);
      
      if (error) return null;
      return data as QuestRole[];
    },
    enabled: !!quest?.id,
  });

  // Fetch quest personality affinities
  const { data: affinities } = useQuery({
    queryKey: ['quest-affinities', quest?.id],
    queryFn: async () => {
      if (!quest?.id) return null;
      
      const { data, error } = await supabase
        .from('quest_personality_affinity')
        .select('*')
        .eq('quest_id', quest.id);
      
      if (error) return null;
      return data as QuestPersonalityAffinity[];
    },
    enabled: !!quest?.id,
  });

  // Check if quest has AI-generated content
  const hasAiContent = quest?.ai_generated || 
    objectives?.some(o => o.ai_generated) || 
    roles?.some(r => r.ai_generated) || 
    affinities?.some(a => a.ai_generated);

  if (!quest) return null;

  const handleReviewAction = async (action: 'approve' | 'reject' | 'request_changes', shouldPublish = false) => {
    setLoading(true);
    
    const result = await performReviewAction(quest.id, action, {
      adminNotes: adminNotes || undefined,
      shouldPublish,
    });

    setLoading(false);

    if (result.success) {
      toast({
        title: 'Action completed',
        description: `Quest has been ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent for changes'}.`,
      });
      onOpenChange(false);
    } else {
      toast({
        title: 'Action failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (newStatus: QuestStatus) => {
    setLoading(true);
    
    const result = await transitionQuestStatus(quest.id, newStatus, {
      reason: reason || undefined,
      adminNotes: adminNotes || undefined,
      notifyCreator: true,
    });

    setLoading(false);

    if (result.success) {
      toast({
        title: 'Status updated',
        description: `Quest status changed to ${newStatus}.`,
      });
      onOpenChange(false);
    } else {
      toast({
        title: 'Status change failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleDangerAction = async () => {
    if (!dangerAction) return;
    
    setLoading(true);

    if (dangerAction === 'revoke') {
      const result = await transitionQuestStatus(quest.id, 'revoked', {
        reason,
        adminNotes,
        notifyCreator: true,
        notifyUsers: true,
      });

      if (result.success) {
        toast({ title: 'Quest revoked', description: 'The quest has been immediately revoked.' });
        setDangerAction(null);
        onOpenChange(false);
      } else {
        toast({ title: 'Revoke failed', description: result.error, variant: 'destructive' });
      }
    } else if (dangerAction === 'delete') {
      const result = await softDeleteQuest(quest.id, reason);

      if (result.success) {
        toast({ title: 'Quest deleted', description: 'The quest has been permanently deleted.' });
        setDangerAction(null);
        onOpenChange(false);
      } else {
        toast({ title: 'Delete failed', description: result.error, variant: 'destructive' });
      }
    }

    setLoading(false);
  };

  const handleTogglePriority = async () => {
    const success = await togglePriorityFlag(quest.id);
    if (success) {
      toast({ 
        title: quest.priority_flag ? 'Priority removed' : 'Priority set',
        description: quest.priority_flag ? 'Quest is no longer flagged as priority.' : 'Quest has been flagged as high priority.',
      });
    }
  };

  const canApprove = quest.review_status === 'pending_review';
  const canPause = ['open', 'closed'].includes(quest.status);
  const canResume = quest.status === 'paused';
  const canCancel = ['open', 'paused', 'closed'].includes(quest.status);
  const canRevoke = !['cancelled', 'completed', 'revoked'].includes(quest.status);
  const canDelete = ['cancelled', 'revoked'].includes(quest.status);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-3">
              <span className="text-2xl">{quest.icon || '🎯'}</span>
              <span>{quest.title}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleTogglePriority}
                className="ml-auto"
              >
                {quest.priority_flag ? (
                  <Flag className="h-4 w-4 text-destructive fill-destructive" />
                ) : (
                  <FlagOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Left Panel - Quest Preview */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Quest Preview</h3>
                
                {quest.image_url && (
                  <img 
                    src={quest.image_url} 
                    alt={quest.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                <div className="flex gap-2 flex-wrap">
                  <QuestStatusBadge status={quest.status} type="quest" />
                  <QuestStatusBadge status={quest.review_status} type="review" />
                  {hasAiContent && (
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI-Generated
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground">{quest.short_description}</p>

                {quest.full_description && (
                  <div className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg max-h-32 overflow-y-auto">
                    {quest.full_description}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {quest.start_datetime && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(quest.start_datetime), 'PPp')}
                    </div>
                  )}
                  {quest.meeting_location_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {quest.meeting_location_name}
                    </div>
                  )}
                  {quest.capacity_total && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {quest.capacity_total} spots
                    </div>
                  )}
                  {quest.default_duration_minutes && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {quest.default_duration_minutes} min
                    </div>
                  )}
                </div>

                {quest.rewards && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                    <span className="font-medium">🎁 Rewards:</span> {quest.rewards}
                  </div>
                )}

                {/* Constraints, Objectives, Roles, Affinities Tabs */}
                <Tabs defaultValue="constraints" className="mt-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="constraints" className="text-xs gap-1">
                      <Filter className="h-3 w-3" />
                      Filters
                    </TabsTrigger>
                    <TabsTrigger value="objectives" className="text-xs gap-1">
                      <Target className="h-3 w-3" />
                      Objectives
                    </TabsTrigger>
                    <TabsTrigger value="roles" className="text-xs gap-1">
                      <Users className="h-3 w-3" />
                      Roles
                    </TabsTrigger>
                    <TabsTrigger value="affinities" className="text-xs gap-1">
                      <Brain className="h-3 w-3" />
                      Matching
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="constraints" className="mt-3">
                    <QuestConstraintsDisplay constraints={constraints || null} />
                  </TabsContent>
                  <TabsContent value="objectives" className="mt-3">
                    <QuestObjectivesDisplay objectives={objectives || null} />
                  </TabsContent>
                  <TabsContent value="roles" className="mt-3">
                    <QuestRolesDisplay roles={roles || null} />
                  </TabsContent>
                  <TabsContent value="affinities" className="mt-3">
                    <QuestAffinitiesDisplay affinities={affinities || null} />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Panel - Admin Controls */}
              <div className="space-y-6">
                {/* Metadata */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Admin Metadata</h3>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Creator:</div>
                    <div>{quest.creator_profile?.display_name || 'Unknown'}</div>
                    
                    <div className="text-muted-foreground">Type:</div>
                    <div>{quest.sponsor_id ? 'Sponsored' : 'Public'}</div>
                    
                    <div className="text-muted-foreground">City:</div>
                    <div>{quest.city || '—'}</div>
                    
                    <div className="text-muted-foreground">Created:</div>
                    <div>{formatDistanceToNow(new Date(quest.created_at), { addSuffix: true })}</div>
                    
                    <div className="text-muted-foreground">Last updated:</div>
                    <div>{formatDistanceToNow(new Date(quest.updated_at), { addSuffix: true })}</div>
                  </div>
                </div>

                <Separator />

                {/* Creator History */}
                {creatorHistory && creatorHistory.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Creator's Recent Quests
                    </h4>
                    <div className="space-y-1">
                      {creatorHistory.slice(0, 3).map((q) => (
                        <div key={q.id} className="flex items-center gap-2 text-xs">
                          <QuestStatusBadge status={q.review_status} type="review" size="sm" />
                          <span className="truncate flex-1">{q.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Admin Notes */}
                <div className="space-y-2">
                  <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes for the creator or internal tracking..."
                    rows={3}
                  />
                </div>

                {/* Reason field for status changes */}
                {(canPause || canCancel || canRevoke) && (
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason (required for cancel/revoke)</Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain why this action is being taken..."
                      rows={2}
                    />
                  </div>
                )}

                <Separator />

                {/* Review Actions */}
                {canApprove && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Review Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleReviewAction('approve', true)}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                        Approve & Publish
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReviewAction('approve')}
                        disabled={loading}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve Only
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReviewAction('request_changes')}
                        disabled={loading}
                      >
                        <FileEdit className="h-4 w-4 mr-2" />
                        Request Changes
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReviewAction('reject')}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {/* Lifecycle Actions */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Lifecycle Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {canPause && (
                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange('paused')}
                        disabled={loading}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Quest
                      </Button>
                    )}
                    {canResume && (
                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange('open')}
                        disabled={loading}
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume Quest
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange('cancelled')}
                        disabled={loading || !reason}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Cancel Quest
                      </Button>
                    )}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="space-y-2 p-3 border border-destructive/30 rounded-lg bg-destructive/5">
                  <h4 className="font-medium text-sm text-destructive">Danger Zone</h4>
                  <div className="flex flex-wrap gap-2">
                    {canRevoke && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDangerAction('revoke')}
                        disabled={loading || !reason}
                      >
                        <XOctagon className="h-4 w-4 mr-2" />
                        Revoke Quest
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDangerAction('delete')}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Quest
                      </Button>
                    )}
                  </div>
                  {(!reason && (canRevoke || canCancel)) && (
                    <p className="text-xs text-destructive">⚠️ Reason is required for cancel/revoke actions</p>
                  )}
                </div>

                {/* Audit Log Preview */}
                {auditLog && auditLog.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Recent Actions
                    </h4>
                    <div className="space-y-1 text-xs">
                      {auditLog.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-center gap-2 text-muted-foreground">
                          <ArrowRight className="h-3 w-3" />
                          <span>{log.action}</span>
                          <span className="ml-auto">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Danger Confirmation Dialog */}
      <AlertDialog open={!!dangerAction} onOpenChange={() => setDangerAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {dangerAction === 'revoke' ? '⚠️ Revoke Quest' : '🗑️ Delete Quest'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dangerAction === 'revoke' 
                ? 'This will immediately hide the quest from all users and lock the creator from resubmitting. This action is logged and audited.'
                : 'This will permanently remove the quest. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type "{dangerAction?.toUpperCase()}" to confirm:</Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={dangerAction?.toUpperCase()}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDangerAction}
              disabled={confirmText !== dangerAction?.toUpperCase() || loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm {dangerAction === 'revoke' ? 'Revoke' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
