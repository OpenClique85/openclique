/**
 * CreatorOrgRequests - Inbox for organization quest requests
 * Creators can view, accept, or decline requests from organizations
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CreatorPortalNav } from '@/components/creators/CreatorPortalNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

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

export default function CreatorOrgRequests() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [requests, setRequests] = useState<OrgRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<OrgRequest | null>(null);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const fetchData = async () => {
    if (!user) return;

    setIsLoading(true);

    // Get creator profile
    const { data: creatorData, error: creatorError } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (creatorError || !creatorData) {
      setIsLoading(false);
      return;
    }

    setCreatorProfile(creatorData);

    // Fetch requests for this creator
    const { data: requestsData, error: requestsError } = await supabase
      .from('org_creator_requests')
      .select(`
        *,
        organization:organizations(name, slug, logo_url, primary_color, school_affiliation)
      `)
      .eq('creator_id', creatorData.id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Failed to fetch requests:', requestsError);
    } else {
      setRequests(requestsData || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRespond = async (accept: boolean) => {
    if (!selectedRequest) return;

    setIsResponding(true);

    try {
      const updateData: any = {
        status: accept ? 'accepted' : 'declined',
        creator_response_at: new Date().toISOString(),
      };

      if (!accept && declineReason) {
        updateData.decline_reason = declineReason;
      }

      const { error } = await supabase
        .from('org_creator_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Notify the org admin
      await supabase.from('notifications').insert({
        user_id: selectedRequest.requester_id,
        type: 'general',
        title: accept 
          ? `🎉 ${creatorProfile.display_name} accepted your quest request!`
          : `${creatorProfile.display_name} declined your quest request`,
        body: accept
          ? `Your request for "${selectedRequest.title}" has been accepted. They'll be in touch soon!`
          : declineReason || `Your request for "${selectedRequest.title}" was declined.`,
      });

      toast({
        title: accept ? 'Request accepted!' : 'Request declined',
        description: accept 
          ? `You can now reach out to ${selectedRequest.organization?.name} to plan the quest.`
          : 'The organization has been notified.',
      });

      setIsRespondModalOpen(false);
      setSelectedRequest(null);
      setDeclineReason('');
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Failed to respond',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsResponding(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'accepted') return r.status === 'accepted';
    if (activeTab === 'declined') return ['declined', 'cancelled'].includes(r.status);
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!creatorProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Creator Access Required</h1>
          <p className="text-muted-foreground mb-6">
            You need a creator profile to view organization requests.
          </p>
          <Button asChild>
            <Link to="/creators">Become a Creator</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              to="/creator/dashboard"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </div>

          <CreatorPortalNav />

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                <Inbox className="h-8 w-8 text-primary" />
                Organization Requests
                {pendingCount > 0 && (
                  <Badge className="bg-primary">{pendingCount} new</Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">
                Quest proposals from organizations looking to hire you
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending" className="relative">
                Pending
                {pendingCount > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="declined">Declined</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredRequests.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Inbox className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {activeTab === 'pending'
                        ? 'No pending requests'
                        : activeTab === 'accepted'
                        ? 'No accepted requests'
                        : activeTab === 'declined'
                        ? 'No declined requests'
                        : 'No requests yet'}
                    </h3>
                    <p className="text-muted-foreground">
                      Organizations can find you through the creator directory and send quest requests.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredRequests.map((request) => {
                    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                    const isUT = request.organization?.school_affiliation === 'ut_austin';

                    return (
                      <Card 
                        key={request.id} 
                        className={`hover:shadow-md transition-shadow ${
                          request.status === 'pending' ? 'border-primary/50' : ''
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Org logo */}
                            <div
                              className="w-14 h-14 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                              style={{
                                backgroundColor:
                                  request.organization?.primary_color || '#14B8A6',
                              }}
                            >
                              {isUT ? '🤘' : request.organization?.name?.charAt(0) || '?'}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                  <h3 className="font-semibold text-lg">{request.title}</h3>
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
                                <Badge className={statusConfig.color}>
                                  {statusConfig.label}
                                </Badge>
                              </div>

                              {request.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {request.description}
                                </p>
                              )}

                              {/* Details */}
                              <div className="flex flex-wrap gap-4 text-sm mb-4">
                                {request.quest_theme && (
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                                    {THEME_LABELS[request.quest_theme] || request.quest_theme}
                                  </span>
                                )}
                                {request.estimated_participants && (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    ~{request.estimated_participants} attendees
                                  </span>
                                )}
                                {request.preferred_dates && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {request.preferred_dates}
                                  </span>
                                )}
                                {request.budget_range && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    {BUDGET_LABELS[request.budget_range] || request.budget_range}
                                  </span>
                                )}
                              </div>

                              {/* Footer */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(request.created_at), {
                                    addSuffix: true,
                                  })}
                                </span>

                                {request.status === 'pending' && (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedRequest(request);
                                        setIsRespondModalOpen(true);
                                      }}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Decline
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedRequest(request);
                                        handleRespond(true);
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Accept
                                    </Button>
                                  </div>
                                )}

                                {request.status === 'accepted' && (
                                  <Button variant="outline" size="sm" asChild>
                                    <Link to={`/org/${request.organization?.slug}`}>
                                      View Organization
                                    </Link>
                                  </Button>
                                )}
                              </div>

                              {/* Decline reason */}
                              {request.status === 'declined' && request.decline_reason && (
                                <div className="mt-3 p-3 bg-muted rounded-lg">
                                  <p className="text-sm text-muted-foreground">
                                    <strong>Your response:</strong> {request.decline_reason}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Decline Modal */}
      <Dialog open={isRespondModalOpen} onOpenChange={setIsRespondModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Request</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for declining this request from{' '}
              {selectedRequest?.organization?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="e.g., I'm fully booked for that time period, or this isn't a good fit for my expertise..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRespondModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleRespond(false)}
              disabled={isResponding}
            >
              {isResponding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
