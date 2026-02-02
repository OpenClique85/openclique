/**
 * =============================================================================
 * Admin Reports Queue Panel
 * =============================================================================
 * Shows all user reports with filtering and actions.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Flag, 
  Clock, 
  Loader2, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Ban,
  MessageCircle,
  User
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_message_id: string | null;
  reported_quest_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  action_taken: string | null;
  reviewer_notes: string | null;
  reporter_profile?: {
    display_name: string | null;
  };
  reported_profile?: {
    display_name: string | null;
    email: string | null;
  };
}

type ActionType = 'warning' | 'suspension' | 'ban' | 'none';

const REASON_LABELS: Record<string, string> = {
  harassment: 'Harassment or bullying',
  inappropriate_content: 'Inappropriate content',
  spam: 'Spam or scam',
  safety_concern: 'Safety concern',
  false_information: 'False information',
  other: 'Other',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  reviewed: 'bg-blue-500',
  action_taken: 'bg-green-500',
  dismissed: 'bg-gray-500',
};

export function AdminReportsQueuePanel() {
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState<ActionType | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-user-reports', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('user_reports')
        .select(`
          *,
          reporter_profile:profiles!user_reports_reporter_id_fkey(display_name),
          reported_profile:profiles!user_reports_reported_user_id_fkey(display_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserReport[];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ reportId, action, notes }: { reportId: string; action: ActionType | ''; notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newStatus = action === '' ? 'dismissed' : (action === 'none' ? 'reviewed' : 'action_taken');

      const { error } = await supabase
        .from('user_reports')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          action_taken: action || null,
          reviewer_notes: notes.trim() || null,
        })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Report reviewed',
        description: 'The report has been processed.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-user-reports'] });
      setSelectedReport(null);
      setReviewerNotes('');
      setSelectedAction('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to review report',
        description: error.message,
      });
    },
  });

  const pendingCount = reports?.filter(r => r.status === 'pending').length || 0;
  const highPriorityCount = reports?.filter(r => r.priority === 'high' || r.priority === 'urgent').length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-500">{highPriorityCount}</div>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                User Reports
              </CardTitle>
              <CardDescription>
                Review and take action on user reports
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="action_taken">Action Taken</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!reports?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Flag className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No reports found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onReview={() => setSelectedReport(report)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
            <DialogDescription>
              {selectedReport && REASON_LABELS[selectedReport.reason]}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                <p><strong>Reported by:</strong> {selectedReport.reporter_profile?.display_name || 'Unknown'}</p>
                <p><strong>Reported user:</strong> {selectedReport.reported_profile?.display_name || 'Unknown'}</p>
                {selectedReport.description && (
                  <p><strong>Description:</strong> {selectedReport.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Action to take</label>
                <Select value={selectedAction} onValueChange={(v) => setSelectedAction(v as ActionType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Action (reviewed only)</SelectItem>
                    <SelectItem value="warning">Send Warning</SelectItem>
                    <SelectItem value="suspension">Suspend Account (7 days)</SelectItem>
                    <SelectItem value="ban">Permanent Ban</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reviewer Notes</label>
                <Textarea
                  placeholder="Add notes about this review..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedReport) {
                  reviewMutation.mutate({ 
                    reportId: selectedReport.id, 
                    action: '', 
                    notes: reviewerNotes 
                  });
                }
              }}
              disabled={reviewMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
            <Button
              onClick={() => {
                if (selectedReport) {
                  reviewMutation.mutate({ 
                    reportId: selectedReport.id, 
                    action: selectedAction || 'none', 
                    notes: reviewerNotes 
                  });
                }
              }}
              disabled={reviewMutation.isPending || !selectedAction}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {reviewMutation.isPending ? 'Processing...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ReportCardProps {
  report: UserReport;
  onReview: () => void;
}

function ReportCard({ report, onReview }: ReportCardProps) {
  const isPending = report.status === 'pending';
  const isHighPriority = report.priority === 'high' || report.priority === 'urgent';

  return (
    <div className={`p-4 rounded-lg border ${isPending && isHighPriority ? 'border-orange-500 bg-orange-500/5' : 'bg-card'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={STATUS_COLORS[report.status]}>
              {report.status.replace('_', ' ')}
            </Badge>
            {isHighPriority && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {report.priority}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
            </span>
          </div>

          <div>
            <p className="font-medium flex items-center gap-2">
              <Flag className="h-4 w-4 text-destructive" />
              {REASON_LABELS[report.reason] || report.reason}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Reported: {report.reported_profile?.display_name || 'Unknown'}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="h-3 w-3" />
              By: {report.reporter_profile?.display_name || 'Unknown'}
            </span>
          </div>

          {report.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              "{report.description}"
            </p>
          )}

          {report.action_taken && (
            <Badge variant="outline" className="gap-1">
              {report.action_taken === 'ban' && <Ban className="h-3 w-3" />}
              Action: {report.action_taken}
            </Badge>
          )}
        </div>

        {isPending && (
          <Button variant="outline" size="sm" onClick={onReview}>
            Review
          </Button>
        )}
      </div>
    </div>
  );
}
