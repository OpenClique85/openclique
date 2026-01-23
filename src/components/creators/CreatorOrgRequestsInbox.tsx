/**
 * CreatorOrgRequestsInbox - Org requests list for the unified inbox
 * Extracted from CreatorOrgRequests page for reuse
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CollaborationChat } from '@/components/collaboration/CollaborationChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Building2,
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Inbox,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrgRequest {
  id: string;
  org_id: string;
  creator_id: string;
  requester_id: string;
  title: string;
  description: string | null;
  quest_theme: string | null;
  preferred_dates: string | null;
  budget_range: string | null;
  estimated_participants: number | null;
  status: string;
  creator_response_at: string | null;
  decline_reason: string | null;
  notes: string | null;
  created_at: string;
  organization?: {
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    school_affiliation: string | null;
  };
}

interface CreatorOrgRequestsInboxProps {
  creatorProfileId?: string;
}

const THEME_LABELS: Record<string, string> = {
  social: '🎉 Social / Mixer',
  outdoor: '🌲 Outdoor Adventure',
  wellness: '🧘 Wellness / Fitness',
  culture: '🎭 Arts & Culture',
  food: '🍕 Food & Drink',
  volunteer: '🤝 Volunteering',
  professional: '💼 Professional Development',
  custom: '✨ Custom / Other',
};

const BUDGET_LABELS: Record<string, string> = {
  free: 'Free (no budget)',
  low: '$1-50 per person',
  medium: '$50-100 per person',
  high: '$100+ per person',
  sponsorship: 'Looking for sponsored options',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Inbox }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Inbox },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-800', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

export function CreatorOrgRequestsInbox({ creatorProfileId }: CreatorOrgRequestsInboxProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OrgRequest | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // Fetch creator profile if not provided
  const { data: creatorProfile } = useQuery({
    queryKey: ['creator-profile-for-inbox', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('creator_profiles')
        .select('id, display_name, user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !creatorProfileId,
  });

  const effectiveCreatorId = creatorProfileId || creatorProfile?.id;

  // Fetch requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['creator-org-requests', effectiveCreatorId],
    queryFn: async () => {
      if (!effectiveCreatorId) return [];
      const { data, error } = await supabase
        .from('org_creator_requests')
        .select(`
          *,
          organization:organizations(name, slug, logo_url, primary_color, school_affiliation)
        `)
        .eq('creator_id', effectiveCreatorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OrgRequest[];
    },
    enabled: !!effectiveCreatorId,
  });

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: async (request: OrgRequest) => {
      const { error } = await supabase
        .from('org_creator_requests')
        .update({
          status: 'accepted',
          creator_response_at: new Date().toISOString(),
        })
        .eq('id', request.id);
      if (error) throw error;

      // Notify requester
      await supabase.from('notifications').insert({
        user_id: request.requester_id,
        type: 'general',
        title: `🎉 ${creatorProfile?.display_name || 'Creator'} accepted your request!`,
        body: `Your request for "${request.title}" has been accepted.`,
      });
    },
    onSuccess: () => {
      toast({ title: 'Request accepted!' });
      queryClient.invalidateQueries({ queryKey: ['creator-org-requests'] });
      queryClient.invalidateQueries({ queryKey: ['creator-org-requests-count'] });
    },
    onError: () => {
      toast({ title: 'Failed to accept', variant: 'destructive' });
    },
  });

  // Decline mutation
  const declineMutation = useMutation({
    mutationFn: async ({ request, reason }: { request: OrgRequest; reason?: string }) => {
      const { error } = await supabase
        .from('org_creator_requests')
        .update({
          status: 'declined',
          creator_response_at: new Date().toISOString(),
          decline_reason: reason || null,
        })
        .eq('id', request.id);
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: request.requester_id,
        type: 'general',
        title: `${creatorProfile?.display_name || 'Creator'} declined your request`,
        body: reason || `Your request for "${request.title}" was declined.`,
      });
    },
    onSuccess: () => {
      toast({ title: 'Request declined' });
      queryClient.invalidateQueries({ queryKey: ['creator-org-requests'] });
      queryClient.invalidateQueries({ queryKey: ['creator-org-requests-count'] });
      setDeclineDialogOpen(false);
      setSelectedRequest(null);
      setDeclineReason('');
    },
    onError: () => {
      toast({ title: 'Failed to decline', variant: 'destructive' });
    },
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const pastRequests = requests.filter(r => r.status !== 'pending');

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No organization requests</h3>
          <p className="text-muted-foreground">
            When organizations want to hire you for quests, their requests will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderRequest = (request: OrgRequest, showActions: boolean) => {
    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
    const isExpanded = expandedId === request.id;
    const isUT = request.organization?.school_affiliation === 'ut_austin';

    return (
      <Card key={request.id} className={request.status === 'pending' ? 'border-primary/50' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Org logo */}
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ backgroundColor: request.organization?.primary_color || '#14B8A6' }}
            >
              {isUT ? '🤘' : request.organization?.name?.charAt(0) || '?'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-semibold">{request.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    from{' '}
                    <Link
                      to={`/org/${request.organization?.slug}`}
                      className="text-primary hover:underline"
                    >
                      {request.organization?.name}
                    </Link>
                  </p>
                </div>
                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
              </div>

              {/* Details */}
              <div className="flex flex-wrap gap-3 text-sm mb-3">
                {request.quest_theme && (
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-muted-foreground" />
                    {THEME_LABELS[request.quest_theme] || request.quest_theme}
                  </span>
                )}
                {request.estimated_participants && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    ~{request.estimated_participants}
                  </span>
                )}
                {request.preferred_dates && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {request.preferred_dates}
                  </span>
                )}
                {request.budget_range && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    {BUDGET_LABELS[request.budget_range] || request.budget_range}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </span>

                <div className="flex gap-2">
                  {showActions && request.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setDeclineDialogOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => acceptMutation.mutate(request)}
                        disabled={acceptMutation.isPending}
                      >
                        {acceptMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Accept
                      </Button>
                    </>
                  )}
                  {request.status === 'accepted' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : request.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {isExpanded ? 'Hide Chat' : 'Chat'}
                      {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Chat */}
          {isExpanded && request.status === 'accepted' && (
            <div className="mt-4 pt-4 border-t">
              <CollaborationChat
                collaborationType="org_creator"
                collaborationId={request.id}
                currentUserRole="creator"
                otherPartyName={request.organization?.name || 'Organization'}
                otherPartyAvatar={request.organization?.logo_url}
                otherPartyUserId={request.requester_id}
                title={request.title}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Pending */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Pending ({pendingRequests.length})
          </h3>
          <div className="space-y-4">
            {pendingRequests.map(r => renderRequest(r, true))}
          </div>
        </div>
      )}

      {/* Past */}
      {pastRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Past Requests ({pastRequests.length})</h3>
          <div className="space-y-4">
            {pastRequests.map(r => renderRequest(r, false))}
          </div>
        </div>
      )}

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Request</DialogTitle>
            <DialogDescription>
              Let the organization know why you're declining (optional).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g., Schedule conflict, not my specialty..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && declineMutation.mutate({ request: selectedRequest, reason: declineReason })}
              disabled={declineMutation.isPending}
            >
              {declineMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Decline Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
