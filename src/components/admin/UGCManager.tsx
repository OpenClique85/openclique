/**
 * UGC Manager - Admin panel for reviewing user-generated content
 * 
 * Allows admins to:
 * - View pending UGC submissions
 * - Approve/reject content
 * - Filter by status
 * - View content details and consent info
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  Check,
  X,
  Flag,
  Image,
  Video,
  User,
  Calendar,
  ExternalLink,
  Download,
  Instagram,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';

interface UGCSubmission {
  id: string;
  user_id: string;
  quest_id: string | null;
  instance_id: string | null;
  file_url: string;
  file_type: 'image' | 'video';
  thumbnail_url: string | null;
  caption: string | null;
  consent_marketing: boolean;
  consent_social_media: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
  profiles?: { display_name: string | null; email: string | null } | null;
  quests?: { title: string } | null;
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  flagged: { label: 'Flagged', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
};

export function UGCManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<UGCSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Fetch submissions
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['ugc-submissions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('ugc_submissions')
        .select(`
          *,
          quests:quest_id(title)
        `)
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query.limit(100);
      if (error) throw error;
      
      // Fetch user profiles separately
      const userIds = [...new Set((data || []).map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return (data || []).map(submission => ({
        ...submission,
        file_type: submission.file_type as 'image' | 'video',
        status: submission.status as 'pending' | 'approved' | 'rejected' | 'flagged',
        profiles: profileMap.get(submission.user_id) || null,
      })) as UGCSubmission[];
    },
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('ugc_submissions')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: notes || null,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ugc-submissions'] });
      toast({
        title: 'Review saved',
        description: 'The submission status has been updated.',
      });
      setSelectedSubmission(null);
      setReviewNotes('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update submission',
        variant: 'destructive',
      });
    },
  });

  const handleQuickAction = (submission: UGCSubmission, status: 'approved' | 'rejected' | 'flagged') => {
    reviewMutation.mutate({ id: submission.id, status });
  };

  const handleDetailedReview = (status: 'approved' | 'rejected' | 'flagged') => {
    if (!selectedSubmission) return;
    reviewMutation.mutate({ 
      id: selectedSubmission.id, 
      status, 
      notes: reviewNotes 
    });
  };

  // Stats
  const pendingCount = submissions?.filter(s => s.status === 'pending').length || 0;
  const approvedCount = submissions?.filter(s => s.status === 'approved').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User-Generated Content</h2>
          <p className="text-muted-foreground">Review and approve media for marketing use</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-amber-600">{pendingCount}</span> pending
            <span className="mx-2">•</span>
            <span className="font-medium text-green-600">{approvedCount}</span> approved
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : submissions?.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">No submissions</h3>
          <p className="text-muted-foreground">
            {statusFilter === 'all' 
              ? 'No UGC submissions yet.' 
              : `No ${statusFilter} submissions.`}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {submissions?.map((submission) => (
            <Card 
              key={submission.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedSubmission(submission);
                setReviewNotes(submission.reviewer_notes || '');
              }}
            >
              {/* Media preview */}
              <div className="aspect-square relative bg-muted">
                {submission.file_type === 'image' ? (
                  <img 
                    src={submission.file_url} 
                    alt="UGC"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                {/* Status badge */}
                <Badge 
                  className={`absolute top-2 right-2 ${STATUS_CONFIG[submission.status].color}`}
                >
                  {STATUS_CONFIG[submission.status].label}
                </Badge>
                
                {/* Type indicator */}
                <div className="absolute bottom-2 left-2 p-1.5 bg-background/80 rounded-full">
                  {submission.file_type === 'image' ? (
                    <Image className="h-4 w-4" />
                  ) : (
                    <Video className="h-4 w-4" />
                  )}
                </div>
              </div>
              
              <CardContent className="p-3">
                <div className="space-y-2">
                  {/* User info */}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">
                      {submission.profiles?.display_name || 'Anonymous'}
                    </span>
                  </div>
                  
                  {/* Quest */}
                  {submission.quests && (
                    <div className="text-xs text-muted-foreground truncate">
                      {submission.quests.title}
                    </div>
                  )}
                  
                  {/* Consent icons */}
                  <div className="flex gap-2">
                    {submission.consent_marketing && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Globe className="h-3 w-3" />
                        <span>Web</span>
                      </div>
                    )}
                    {submission.consent_social_media && (
                      <div className="flex items-center gap-1 text-xs text-pink-600">
                        <Instagram className="h-3 w-3" />
                        <span>Social</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick actions for pending */}
                  {submission.status === 'pending' && (
                    <div className="flex gap-1 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-green-600 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAction(submission, 'approved');
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAction(submission, 'rejected');
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-purple-600 hover:bg-purple-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAction(submission, 'flagged');
                        }}
                      >
                        <Flag className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              {/* Media */}
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {selectedSubmission.file_type === 'image' ? (
                  <img 
                    src={selectedSubmission.file_url} 
                    alt="UGC"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video 
                    src={selectedSubmission.file_url}
                    controls
                    className="w-full h-full"
                  />
                )}
              </div>
              
              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">User:</span>
                  <span className="ml-2 font-medium">
                    {selectedSubmission.profiles?.display_name || 'Anonymous'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="ml-2">
                    {format(new Date(selectedSubmission.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Quest:</span>
                  <span className="ml-2">
                    {selectedSubmission.quests?.title || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={`ml-2 ${STATUS_CONFIG[selectedSubmission.status].color}`}>
                    {STATUS_CONFIG[selectedSubmission.status].label}
                  </Badge>
                </div>
              </div>
              
              {/* Caption */}
              {selectedSubmission.caption && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm italic">"{selectedSubmission.caption}"</p>
                </div>
              )}
              
              {/* Consent info */}
              <div className="flex gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className={`h-4 w-4 ${selectedSubmission.consent_marketing ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <span className="text-sm">
                    Marketing: {selectedSubmission.consent_marketing ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className={`h-4 w-4 ${selectedSubmission.consent_social_media ? 'text-pink-600' : 'text-muted-foreground'}`} />
                  <span className="text-sm">
                    Social: {selectedSubmission.consent_social_media ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              {/* Review notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Review Notes</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this submission..."
                  rows={2}
                />
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <a 
                  href={selectedSubmission.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                </a>
                <a 
                  href={selectedSubmission.file_url} 
                  download
                  className="flex-shrink-0"
                >
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => handleDetailedReview('rejected')}
              disabled={reviewMutation.isPending}
              className="text-red-600"
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleDetailedReview('flagged')}
              disabled={reviewMutation.isPending}
              className="text-purple-600"
            >
              <Flag className="h-4 w-4 mr-1" />
              Flag
            </Button>
            <Button 
              onClick={() => handleDetailedReview('approved')}
              disabled={reviewMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
