/**
 * Quest Archive Detail Drawer
 * Shows full status timeline and archival details for archived quests
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  RotateCcw,
  Calendar,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  XCircle,
  Archive,
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;

interface QuestArchiveDetailDrawerProps {
  quest: Quest | null;
  open: boolean;
  onClose: () => void;
  onRestore?: () => void;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <Clock className="h-4 w-4 text-gray-500" />,
  open: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  closed: <Archive className="h-4 w-4 text-amber-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
  cancelled: <XCircle className="h-4 w-4 text-red-500" />,
  paused: <Archive className="h-4 w-4 text-orange-500" />,
  revoked: <AlertTriangle className="h-4 w-4 text-red-600" />,
};

export function QuestArchiveDetailDrawer({ 
  quest, 
  open, 
  onClose,
  onRestore 
}: QuestArchiveDetailDrawerProps) {
  const { toast } = useToast();
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Fetch audit log for status timeline
  const { data: auditLog } = useQuery({
    queryKey: ['quest-audit-log', quest?.id],
    queryFn: async () => {
      if (!quest) return [];
      
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .eq('target_id', quest.id)
        .eq('target_table', 'quests')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching audit log:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!quest?.id,
  });

  // Fetch signup count for this quest
  const { data: signupCount } = useQuery({
    queryKey: ['quest-signup-count', quest?.id],
    queryFn: async () => {
      if (!quest) return 0;
      
      const { count } = await supabase
        .from('quest_signups')
        .select('*', { count: 'exact', head: true })
        .eq('quest_id', quest.id);
      
      return count || 0;
    },
    enabled: !!quest?.id,
  });

  const handleRestore = async () => {
    if (!quest) return;
    
    setIsRestoring(true);
    
    try {
      const { error } = await supabase
        .from('quests')
        .update({ 
          status: 'draft',
          revoked_reason: null,
          paused_reason: null,
        })
        .eq('id', quest.id);
      
      if (error) throw error;
      
      toast({
        title: 'Quest restored',
        description: `"${quest.title}" has been restored to draft status.`,
      });
      
      setShowRestoreDialog(false);
      onRestore?.();
    } catch (error: any) {
      console.error('Error restoring quest:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to restore quest',
        description: error.message,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!quest) return null;

  const getReasonText = () => {
    if (quest.status === 'revoked' && quest.revoked_reason) {
      return quest.revoked_reason;
    }
    if (quest.status === 'paused' && quest.paused_reason) {
      return quest.paused_reason;
    }
    return null;
  };

  const reason = getReasonText();

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{quest.icon}</span>
              <div>
                <SheetTitle>{quest.title}</SheetTitle>
                <SheetDescription>
                  Archived quest details and history
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-180px)] mt-6">
            <div className="space-y-6 pr-4">
              {/* Current Status */}
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    {STATUS_ICONS[quest.status || 'cancelled']}
                    <span className="font-medium capitalize">{quest.status}</span>
                  </div>
                  {reason && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Reason:</strong> {reason}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Updated: {quest.updated_at && format(new Date(quest.updated_at), 'PPpp')}
                  </p>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Signups</p>
                      <p className="font-medium">{signupCount}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {quest.created_at && format(new Date(quest.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quest Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quest Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {quest.short_description && (
                    <p className="text-muted-foreground">{quest.short_description}</p>
                  )}
                  {quest.meeting_location_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{quest.meeting_location_name}</span>
                    </div>
                  )}
                  {quest.start_datetime && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(quest.start_datetime), 'PPp')}</span>
                    </div>
                  )}
                  {quest.progression_tree && (
                    <Badge variant="outline" className="capitalize">
                      {quest.progression_tree} path
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Status Timeline */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Status Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {auditLog && auditLog.length > 0 ? (
                    <div className="space-y-3">
                      {auditLog.map((entry, index) => {
                        const oldStatus = (entry.old_values as any)?.status;
                        const newStatus = (entry.new_values as any)?.status;
                        
                        if (!newStatus) return null;
                        
                        return (
                          <div key={entry.id} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              {STATUS_ICONS[newStatus] || <Clock className="h-4 w-4" />}
                              {index < auditLog.length - 1 && (
                                <div className="w-px h-8 bg-border mt-1" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {oldStatus && (
                                  <>
                                    <span className="text-sm text-muted-foreground capitalize">{oldStatus}</span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  </>
                                )}
                                <span className="text-sm font-medium capitalize">{newStatus}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {entry.created_at && format(new Date(entry.created_at), 'PPpp')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No status history available
                    </p>
                  )}
                </CardContent>
              </Card>

              <Separator />

              {/* Actions */}
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowRestoreDialog(true)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore Quest to Draft
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Quest?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore "{quest.title}" to draft status. You can then edit and republish it.
              Any archival reasons will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
              {isRestoring && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Restore Quest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
