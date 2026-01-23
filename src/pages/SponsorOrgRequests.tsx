import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SponsorPortalNav } from '@/components/sponsors/SponsorPortalNav';
import { CollaborationChat } from '@/components/collaboration/CollaborationChat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { createNotification } from '@/lib/notifications';

interface OrgRequest {
  id: string;
  org_id: string;
  sponsor_id: string;
  requester_id: string;
  quest_id: string | null;
  title: string;
  description: string | null;
  event_type: string | null;
  expected_attendance: number | null;
  budget_ask: string | null;
  preferred_dates: string | null;
  offering_request: { items?: string[] } | null;
  status: string;
  decline_reason: string | null;
  sponsor_response_at: string | null;
  created_at: string;
  organization?: {
    id: string;
    name: string;
    logo_url: string | null;
    type: string;
    school_affiliation: string | null;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
  negotiating: { label: 'Negotiating', color: 'bg-blue-500/10 text-blue-600', icon: MessageSquare },
  accepted: { label: 'Accepted', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-500/10 text-red-600', icon: XCircle },
};

export default function SponsorOrgRequests() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OrgRequest | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // Fetch sponsor profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['sponsor-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  // Fetch org requests sent to this sponsor
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['sponsor-org-requests', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_sponsor_requests')
        .select(`
          *,
          organization:organizations(id, name, logo_url, type, school_affiliation)
        `)
        .eq('sponsor_id', profile!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OrgRequest[];
    },
    enabled: !!profile?.id,
  });

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: async (request: OrgRequest) => {
      const { error } = await supabase
        .from('org_sponsor_requests')
        .update({
          status: 'accepted',
          sponsor_response_at: new Date().toISOString(),
        })
        .eq('id', request.id);
      if (error) throw error;

      // Notify requester
      await createNotification({
        userId: request.requester_id,
        type: 'org_sponsor_request',
        title: `${profile?.name} accepted your sponsorship request!`,
        body: `Your request "${request.title}" has been accepted. Start negotiating the details.`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-org-requests'] });
      toast({ title: 'Request accepted!' });
    },
    onError: () => {
      toast({ title: 'Failed to accept request', variant: 'destructive' });
    },
  });

  // Decline mutation
  const declineMutation = useMutation({
    mutationFn: async ({ request, reason }: { request: OrgRequest; reason?: string }) => {
      const { error } = await supabase
        .from('org_sponsor_requests')
        .update({
          status: 'declined',
          decline_reason: reason || null,
          sponsor_response_at: new Date().toISOString(),
        })
        .eq('id', request.id);
      if (error) throw error;

      await createNotification({
        userId: request.requester_id,
        type: 'org_sponsor_request',
        title: `${profile?.name} declined your sponsorship request`,
        body: reason || 'Your sponsorship request was not accepted at this time.',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-org-requests'] });
      setDeclineDialogOpen(false);
      setSelectedRequest(null);
      setDeclineReason('');
      toast({ title: 'Request declined' });
    },
    onError: () => {
      toast({ title: 'Failed to decline request', variant: 'destructive' });
    },
  });

  const filterRequests = (status?: string) => {
    let filtered = requests || [];
    if (status && status !== 'all') {
      filtered = filtered.filter(r => r.status === status);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.title.toLowerCase().includes(query) ||
          r.organization?.name.toLowerCase().includes(query)
      );
    }
    return filtered;
  };

  const handleDecline = (request: OrgRequest) => {
    setSelectedRequest(request);
    setDeclineDialogOpen(true);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Sponsor Portal</CardTitle>
              <CardDescription>You need to be a sponsor to access this page.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/sponsors/onboard">Become a Sponsor</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <SponsorPortalNav />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Organization Requests</h1>
          <p className="text-muted-foreground">
            Review sponsorship requests from organizations
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              Pending
              {filterRequests('pending').length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filterRequests('pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          {['pending', 'accepted', 'declined', 'all'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {requestsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filterRequests(tab === 'all' ? undefined : tab).length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No {tab === 'all' ? '' : tab} requests found.
                  </CardContent>
                </Card>
              ) : (
                filterRequests(tab === 'all' ? undefined : tab).map((request) => {
                  const StatusIcon = STATUS_CONFIG[request.status]?.icon || Clock;
                  const isExpanded = expandedRequestId === request.id;

                  return (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={request.organization?.logo_url || undefined} />
                              <AvatarFallback>
                                <Users className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{request.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                From: {request.organization?.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="secondary"
                                  className={STATUS_CONFIG[request.status]?.color}
                                >
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
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => acceptMutation.mutate(request)}
                                  disabled={acceptMutation.isPending}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDecline(request)}
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedRequestId(isExpanded ? null : request.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t space-y-4">
                            {/* Request Details */}
                            <div className="grid gap-4 md:grid-cols-2">
                              {request.description && (
                                <div className="md:col-span-2">
                                  <p className="text-sm font-medium">Description</p>
                                  <p className="text-sm text-muted-foreground">{request.description}</p>
                                </div>
                              )}
                              {request.event_type && (
                                <div>
                                  <p className="text-sm font-medium">Event Type</p>
                                  <p className="text-sm text-muted-foreground capitalize">{request.event_type}</p>
                                </div>
                              )}
                              {request.expected_attendance && (
                                <div>
                                  <p className="text-sm font-medium">Expected Attendance</p>
                                  <p className="text-sm text-muted-foreground">{request.expected_attendance}</p>
                                </div>
                              )}
                              {request.budget_ask && (
                                <div>
                                  <p className="text-sm font-medium">Budget Request</p>
                                  <p className="text-sm text-muted-foreground">{request.budget_ask}</p>
                                </div>
                              )}
                              {request.preferred_dates && (
                                <div>
                                  <p className="text-sm font-medium">Preferred Dates</p>
                                  <p className="text-sm text-muted-foreground">{request.preferred_dates}</p>
                                </div>
                              )}
                              {request.offering_request?.items && request.offering_request.items.length > 0 && (
                                <div className="md:col-span-2">
                                  <p className="text-sm font-medium mb-2">What they're looking for</p>
                                  <div className="flex flex-wrap gap-2">
                                    {request.offering_request.items.map((item) => (
                                      <Badge key={item} variant="outline" className="capitalize">
                                        {item}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Chat for accepted requests */}
                            {request.status === 'accepted' && (
                              <div className="mt-4">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4" />
                                  Negotiation Chat
                                </h4>
                                <CollaborationChat
                                  collaborationType="org_sponsor"
                                  collaborationId={request.id}
                                  currentUserRole="sponsor"
                                  otherPartyName={request.organization?.name || 'Organization'}
                                  otherPartyAvatar={request.organization?.logo_url}
                                  otherPartyUserId={request.requester_id}
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
          ))}
        </Tabs>
      </main>

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Request</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for declining this request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Reason for declining (optional)..."
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
              {declineMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
