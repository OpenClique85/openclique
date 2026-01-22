import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SponsorPortalNav } from '@/components/sponsors/SponsorPortalNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Loader2, 
  Search, 
  FileText,
  Calendar,
  User,
  MapPin,
  Gift,
  ExternalLink,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  sent: { label: 'Pending', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
  pending_admin: { label: 'Awaiting Admin', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: AlertCircle },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
  live: { label: 'Live', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: CheckCircle },
};

interface Proposal {
  id: string;
  proposal_type: string;
  status: string;
  message: string | null;
  budget_or_reward: string | null;
  created_at: string;
  creator_response_at: string | null;
  admin_approved_at: string | null;
  quest_id: string | null;
  creator_id: string | null;
  venue_offering_id: string | null;
  reward_ids: string[] | null;
  quest?: { id: string; title: string; slug: string; start_datetime: string | null } | null;
  creator?: { id: string; display_name: string; photo_url: string | null } | null;
  venue?: { id: string; venue_name: string } | null;
}

export default function SponsorProposals() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  // Fetch sponsor profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['sponsor-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch proposals with related data
  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ['sponsor-proposals', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsorship_proposals')
        .select(`
          *,
          quest:quests(id, title, slug, start_datetime),
          venue:venue_offerings(id, venue_name)
        `)
        .eq('sponsor_id', profile!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fetch creator info separately if creator_id exists
      const proposalsWithCreators = await Promise.all(
        (data || []).map(async (proposal) => {
          if (proposal.creator_id) {
            const { data: creator } = await supabase
              .from('creator_profiles')
              .select('id, display_name, photo_url')
              .eq('user_id', proposal.creator_id)
              .maybeSingle();
            return { ...proposal, creator };
          }
          return { ...proposal, creator: null };
        })
      );

      return proposalsWithCreators as Proposal[];
    },
    enabled: !!profile?.id,
  });

  // Cancel proposal mutation
  const cancelProposal = useMutation({
    mutationFn: async (proposalId: string) => {
      const { error } = await supabase
        .from('sponsorship_proposals')
        .delete()
        .eq('id', proposalId)
        .eq('status', 'sent'); // Only allow canceling pending proposals
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Proposal cancelled');
      queryClient.invalidateQueries({ queryKey: ['sponsor-proposals'] });
      setCancelDialogOpen(false);
      setSelectedProposal(null);
    },
    onError: () => {
      toast.error('Failed to cancel proposal');
    },
  });

  const handleCancelClick = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setCancelDialogOpen(true);
  };

  const filterProposals = (status?: string) => {
    if (!proposals) return [];
    let filtered = proposals;
    
    if (status) {
      if (status === 'pending') {
        filtered = filtered.filter(p => ['sent', 'pending_admin'].includes(p.status));
      } else if (status === 'accepted') {
        filtered = filtered.filter(p => ['accepted', 'approved', 'live'].includes(p.status));
      } else if (status === 'declined') {
        filtered = filtered.filter(p => p.status === 'declined');
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.quest?.title?.toLowerCase().includes(query) ||
        p.creator?.display_name?.toLowerCase().includes(query) ||
        p.message?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <CardTitle>Become a Sponsor</CardTitle>
              <CardDescription>
                Partner with OpenClique to reach engaged local audiences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/partners">Learn More About Sponsorship</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <SponsorPortalNav />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Proposals</h1>
              <p className="text-muted-foreground">
                Track your sponsorship proposals and responses
              </p>
            </div>
            <Button asChild>
              <Link to="/sponsor/discover">
                <Search className="mr-2 h-4 w-4" />
                Find New Quests
              </Link>
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by quest, creator, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({proposals?.length || 0})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({filterProposals('pending').length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({filterProposals('accepted').length})</TabsTrigger>
              <TabsTrigger value="declined">Declined ({filterProposals('declined').length})</TabsTrigger>
            </TabsList>

            {['all', 'pending', 'accepted', 'declined'].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-6">
                {proposalsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filterProposals(tab === 'all' ? undefined : tab).length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No proposals found</h3>
                      <p className="text-muted-foreground mb-4">
                        {tab === 'all' 
                          ? "You haven't sent any proposals yet."
                          : `No ${tab} proposals.`}
                      </p>
                      <Button asChild>
                        <Link to="/sponsor/discover">Browse Quests</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filterProposals(tab === 'all' ? undefined : tab).map(proposal => {
                      const status = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.sent;
                      const StatusIcon = status.icon;

                      return (
                        <Card key={proposal.id}>
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                              {/* Main Content */}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="capitalize">
                                        {proposal.proposal_type === 'sponsor_quest' ? 'Sponsor Quest' : 'Request Quest'}
                                      </Badge>
                                      <Badge className={status.color}>
                                        <StatusIcon className="h-3 w-3 mr-1" />
                                        {status.label}
                                      </Badge>
                                    </div>
                                    
                                    {proposal.quest && (
                                      <Link 
                                        to={`/quests/${proposal.quest.slug}`}
                                        className="text-lg font-semibold hover:text-primary transition-colors"
                                      >
                                        {proposal.quest.title}
                                        <ExternalLink className="inline h-4 w-4 ml-1" />
                                      </Link>
                                    )}
                                    
                                    {proposal.creator && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <span>To: {proposal.creator.display_name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Details Row */}
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Sent {format(new Date(proposal.created_at), 'MMM d, yyyy')}
                                  </div>
                                  {proposal.quest?.start_datetime && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      Quest: {format(new Date(proposal.quest.start_datetime), 'MMM d')}
                                    </div>
                                  )}
                                  {proposal.venue && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {proposal.venue.venue_name}
                                    </div>
                                  )}
                                  {proposal.reward_ids && proposal.reward_ids.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Gift className="h-4 w-4" />
                                      {proposal.reward_ids.length} reward(s) attached
                                    </div>
                                  )}
                                </div>

                                {/* Message */}
                                {proposal.message && (
                                  <div className="bg-muted rounded-lg p-3 text-sm">
                                    <p className="text-muted-foreground line-clamp-2">{proposal.message}</p>
                                  </div>
                                )}

                                {/* Budget */}
                                {proposal.budget_or_reward && (
                                  <p className="text-sm">
                                    <span className="font-medium">Offering:</span>{' '}
                                    <span className="text-muted-foreground">{proposal.budget_or_reward}</span>
                                  </p>
                                )}

                                {/* Response info */}
                                {proposal.creator_response_at && (
                                  <p className="text-sm text-muted-foreground">
                                    Creator responded on {format(new Date(proposal.creator_response_at), 'MMM d, yyyy')}
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex flex-row lg:flex-col gap-2">
                                {proposal.quest && (
                                  <Button variant="outline" size="sm" asChild>
                                    <Link to={`/quests/${proposal.quest.slug}`}>
                                      View Quest
                                    </Link>
                                  </Button>
                                )}
                                {proposal.status === 'sent' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleCancelClick(proposal)}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
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
            ))}
          </Tabs>
        </div>
      </main>
      <Footer />

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will withdraw your sponsorship proposal. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Proposal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedProposal && cancelProposal.mutate(selectedProposal.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Proposal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
