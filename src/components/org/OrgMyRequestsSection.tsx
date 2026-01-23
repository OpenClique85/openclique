import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Users,
  Building2,
  Search,
  Handshake,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CollaborationChat } from '@/components/collaboration/CollaborationChat';

interface CreatorRequest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  creator_response_at: string | null;
  decline_reason: string | null;
  creator?: {
    id: string;
    display_name: string;
    photo_url: string | null;
    user_id: string;
  };
}

interface SponsorRequest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  sponsor_response_at: string | null;
  decline_reason: string | null;
  sponsor?: {
    id: string;
    name: string;
    logo_url: string | null;
    user_id: string;
  };
}

interface OrgMyRequestsSectionProps {
  orgId: string;
  orgName: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-500/10 text-red-600', icon: XCircle },
  negotiating: { label: 'Negotiating', color: 'bg-blue-500/10 text-blue-600', icon: MessageSquare },
};

export function OrgMyRequestsSection({ orgId, orgName }: OrgMyRequestsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCreatorId, setExpandedCreatorId] = useState<string | null>(null);
  const [expandedSponsorId, setExpandedSponsorId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{ id: string; type: 'creator' | 'sponsor' } | null>(null);

  // Fetch creator requests
  const { data: creatorRequests, isLoading: creatorLoading } = useQuery({
    queryKey: ['org-creator-requests', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_creator_requests')
        .select(`
          id, title, description, status, created_at, creator_response_at, decline_reason,
          creator:creator_profiles(id, display_name, photo_url, user_id)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CreatorRequest[];
    },
    enabled: !!orgId,
  });

  // Fetch sponsor requests
  const { data: sponsorRequests, isLoading: sponsorLoading } = useQuery({
    queryKey: ['org-sponsor-requests-sent', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_sponsor_requests')
        .select(`
          id, title, description, status, created_at, sponsor_response_at, decline_reason,
          sponsor:sponsor_profiles(id, name, logo_url, user_id)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SponsorRequest[];
    },
    enabled: !!orgId,
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'creator' | 'sponsor' }) => {
      const table = type === 'creator' ? 'org_creator_requests' : 'org_sponsor_requests';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const key = variables.type === 'creator' ? 'org-creator-requests' : 'org-sponsor-requests-sent';
      queryClient.invalidateQueries({ queryKey: [key, orgId] });
      setCancelDialogOpen(false);
      setSelectedRequest(null);
      toast({ title: 'Request cancelled' });
    },
    onError: () => {
      toast({ title: 'Failed to cancel request', variant: 'destructive' });
    },
  });

  const filterCreatorRequests = (status?: string) => {
    let filtered = creatorRequests || [];
    if (status && status !== 'all') {
      filtered = filtered.filter(r => r.status === status);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r => r.title.toLowerCase().includes(query) || r.creator?.display_name.toLowerCase().includes(query)
      );
    }
    return filtered;
  };

  const filterSponsorRequests = (status?: string) => {
    let filtered = sponsorRequests || [];
    if (status && status !== 'all') {
      filtered = filtered.filter(r => r.status === status);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r => r.title.toLowerCase().includes(query) || r.sponsor?.name.toLowerCase().includes(query)
      );
    }
    return filtered;
  };

  const pendingCreator = filterCreatorRequests('pending').length;
  const pendingSponsor = filterSponsorRequests('pending').length;

  const isLoading = creatorLoading || sponsorLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold mb-2">My Requests</h2>
        <p className="text-muted-foreground">
          Track the status of your outbound requests to creators and sponsors
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search requests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="creators">
        <TabsList>
          <TabsTrigger value="creators" className="gap-2">
            <Users className="h-4 w-4" />
            Creator Requests
            {pendingCreator > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingCreator}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sponsors" className="gap-2">
            <Handshake className="h-4 w-4" />
            Sponsor Petitions
            {pendingSponsor > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingSponsor}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Creator Requests */}
        <TabsContent value="creators" className="space-y-4 mt-4">
          {filterCreatorRequests().length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                No creator requests yet. Hire a creator to design quests for your org!
              </CardContent>
            </Card>
          ) : (
            filterCreatorRequests().map((request) => {
              const StatusIcon = STATUS_CONFIG[request.status]?.icon || Clock;
              const isExpanded = expandedCreatorId === request.id;

              return (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={request.creator?.photo_url || undefined} />
                          <AvatarFallback>
                            {request.creator?.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{request.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            To: {request.creator?.display_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className={STATUS_CONFIG[request.status]?.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {STATUS_CONFIG[request.status]?.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setSelectedRequest({ id: request.id, type: 'creator' });
                              setCancelDialogOpen(true);
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedCreatorId(isExpanded ? null : request.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        {request.description && (
                          <div>
                            <p className="text-sm font-medium">Description</p>
                            <p className="text-sm text-muted-foreground">{request.description}</p>
                          </div>
                        )}
                        {request.decline_reason && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                            <p className="text-sm font-medium text-red-600">Decline Reason</p>
                            <p className="text-sm text-red-600/80">{request.decline_reason}</p>
                          </div>
                        )}
                        {request.status === 'accepted' && request.creator && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Chat with Creator
                            </h4>
                            <CollaborationChat
                              collaborationType="org_creator"
                              collaborationId={request.id}
                              currentUserRole="org_admin"
                              otherPartyName={request.creator.display_name}
                              otherPartyAvatar={request.creator.photo_url}
                              otherPartyUserId={request.creator.user_id}
                              title={request.title}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Sponsor Petitions */}
        <TabsContent value="sponsors" className="space-y-4 mt-4">
          {filterSponsorRequests().length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                No sponsor petitions yet. Request sponsorship from local businesses!
              </CardContent>
            </Card>
          ) : (
            filterSponsorRequests().map((request) => {
              const StatusIcon = STATUS_CONFIG[request.status]?.icon || Clock;
              const isExpanded = expandedSponsorId === request.id;

              return (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={request.sponsor?.logo_url || undefined} />
                          <AvatarFallback>
                            <Building2 className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{request.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            To: {request.sponsor?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className={STATUS_CONFIG[request.status]?.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {STATUS_CONFIG[request.status]?.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setSelectedRequest({ id: request.id, type: 'sponsor' });
                              setCancelDialogOpen(true);
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedSponsorId(isExpanded ? null : request.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        {request.description && (
                          <div>
                            <p className="text-sm font-medium">Description</p>
                            <p className="text-sm text-muted-foreground">{request.description}</p>
                          </div>
                        )}
                        {request.decline_reason && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                            <p className="text-sm font-medium text-red-600">Decline Reason</p>
                            <p className="text-sm text-red-600/80">{request.decline_reason}</p>
                          </div>
                        )}
                        {request.status === 'accepted' && request.sponsor && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Negotiation Chat
                            </h4>
                            <CollaborationChat
                              collaborationType="org_sponsor"
                              collaborationId={request.id}
                              currentUserRole="org_admin"
                              otherPartyName={request.sponsor.name}
                              otherPartyAvatar={request.sponsor.logo_url}
                              otherPartyUserId={request.sponsor.user_id}
                              title={request.title}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Request
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && cancelMutation.mutate(selectedRequest)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Cancel Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
