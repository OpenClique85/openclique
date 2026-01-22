import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Loader2, 
  FileText,
  Calendar,
  MapPin,
  Gift,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Proposal {
  id: string;
  proposal_type: string;
  status: string;
  message: string | null;
  budget_or_reward: string | null;
  created_at: string;
  quest_id: string | null;
  venue_offering_id: string | null;
  reward_ids: string[] | null;
  sponsor_id: string;
  sponsor?: {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    website: string | null;
  };
  quest?: {
    id: string;
    title: string;
    slug: string;
    start_datetime: string | null;
  } | null;
  venue?: {
    id: string;
    venue_name: string;
    address: string | null;
    capacity: number | null;
  } | null;
  rewards?: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
}

interface CreatorProposalInboxProps {
  creatorId?: string; // Optional for preview mode
}

export function CreatorProposalInbox({ creatorId }: CreatorProposalInboxProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const effectiveCreatorId = creatorId || user?.id;
  
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // Fetch proposals sent to this creator
  const { data: proposals, isLoading } = useQuery({
    queryKey: ['creator-proposals', effectiveCreatorId],
    queryFn: async () => {
      // Get proposals where creator_id matches OR quest.creator_id matches
      const { data: directProposals, error: directError } = await supabase
        .from('sponsorship_proposals')
        .select(`
          *,
          sponsor:sponsor_id(id, name, logo_url, description, website),
          quest:quest_id(id, title, slug, start_datetime),
          venue:venue_offering_id(id, venue_name, address, capacity)
        `)
        .eq('creator_id', effectiveCreatorId)
        .order('created_at', { ascending: false });

      if (directError) throw directError;

      // Get proposals for quests created by this creator
      const { data: creatorQuests } = await supabase
        .from('quests')
        .select('id')
        .eq('creator_id', effectiveCreatorId);

      const questIds = creatorQuests?.map(q => q.id) || [];
      
      let questProposals: typeof directProposals = [];
      if (questIds.length > 0) {
        const { data: qProposals, error: qError } = await supabase
          .from('sponsorship_proposals')
          .select(`
            *,
            sponsor:sponsor_id(id, name, logo_url, description, website),
            quest:quest_id(id, title, slug, start_datetime),
            venue:venue_offering_id(id, venue_name, address, capacity)
          `)
          .in('quest_id', questIds)
          .is('creator_id', null)
          .order('created_at', { ascending: false });

        if (!qError) {
          questProposals = qProposals || [];
        }
      }

      // Combine and dedupe
      const allProposals = [...(directProposals || []), ...questProposals];
      const uniqueProposals = allProposals.filter((p, i, arr) => 
        arr.findIndex(x => x.id === p.id) === i
      );

      // Fetch rewards for each proposal
      const proposalsWithRewards = await Promise.all(
        uniqueProposals.map(async (proposal) => {
          if (proposal.reward_ids && proposal.reward_ids.length > 0) {
            const { data: rewards } = await supabase
              .from('rewards')
              .select('id, name, description')
              .in('id', proposal.reward_ids);
            return { ...proposal, rewards: rewards || [] };
          }
          return { ...proposal, rewards: [] };
        })
      );

      return proposalsWithRewards as Proposal[];
    },
    enabled: !!effectiveCreatorId,
  });

  // Accept proposal
  const acceptProposal = useMutation({
    mutationFn: async (proposalId: string) => {
      const { error } = await supabase
        .from('sponsorship_proposals')
        .update({ 
          status: 'accepted',
          creator_response_at: new Date().toISOString()
        })
        .eq('id', proposalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Proposal accepted! The sponsor will be notified.');
      queryClient.invalidateQueries({ queryKey: ['creator-proposals'] });
    },
    onError: () => {
      toast.error('Failed to accept proposal');
    },
  });

  // Decline proposal
  const declineProposal = useMutation({
    mutationFn: async ({ proposalId, reason }: { proposalId: string; reason?: string }) => {
      const updateData: Record<string, unknown> = {
        status: 'declined',
        creator_response_at: new Date().toISOString(),
      };
      if (reason) {
        updateData.admin_notes = `Creator declined: ${reason}`;
      }
      
      const { error } = await supabase
        .from('sponsorship_proposals')
        .update(updateData)
        .eq('id', proposalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Proposal declined');
      queryClient.invalidateQueries({ queryKey: ['creator-proposals'] });
      setDeclineDialogOpen(false);
      setSelectedProposal(null);
      setDeclineReason('');
    },
    onError: () => {
      toast.error('Failed to decline proposal');
    },
  });

  const handleDeclineClick = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setDeclineDialogOpen(true);
  };

  const pendingProposals = proposals?.filter(p => p.status === 'sent') || [];
  const respondedProposals = proposals?.filter(p => p.status !== 'sent') || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proposals || proposals.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No sponsorship proposals</h3>
          <p className="text-muted-foreground">
            When sponsors want to partner with you, their proposals will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Proposals */}
      {pendingProposals.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Pending Proposals ({pendingProposals.length})
          </h2>
          <div className="space-y-4">
            {pendingProposals.map(proposal => (
              <ProposalCard 
                key={proposal.id} 
                proposal={proposal}
                onAccept={() => acceptProposal.mutate(proposal.id)}
                onDecline={() => handleDeclineClick(proposal)}
                isAccepting={acceptProposal.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Responded Proposals */}
      {respondedProposals.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Proposals ({respondedProposals.length})</h2>
          <div className="space-y-4">
            {respondedProposals.map(proposal => (
              <ProposalCard 
                key={proposal.id} 
                proposal={proposal}
                readOnly
              />
            ))}
          </div>
        </div>
      )}

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Proposal</DialogTitle>
            <DialogDescription>
              Let the sponsor know why you're declining (optional).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g., Schedule conflict, not taking sponsorships currently..."
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
              onClick={() => selectedProposal && declineProposal.mutate({ 
                proposalId: selectedProposal.id, 
                reason: declineReason 
              })}
              disabled={declineProposal.isPending}
            >
              {declineProposal.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Decline Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProposalCardProps {
  proposal: Proposal;
  onAccept?: () => void;
  onDecline?: () => void;
  isAccepting?: boolean;
  readOnly?: boolean;
}

function ProposalCard({ proposal, onAccept, onDecline, isAccepting, readOnly }: ProposalCardProps) {
  const sponsor = proposal.sponsor;
  
  const statusBadge = {
    sent: { label: 'Pending', color: 'bg-blue-100 text-blue-700' },
    accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700' },
    declined: { label: 'Declined', color: 'bg-red-100 text-red-700' },
    pending_admin: { label: 'Under Review', color: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
    live: { label: 'Live', color: 'bg-purple-100 text-purple-700' },
  }[proposal.status] || { label: proposal.status, color: 'bg-gray-100 text-gray-700' };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sponsor Info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 rounded-lg">
              <AvatarImage src={sponsor?.logo_url || undefined} className="object-cover" />
              <AvatarFallback className="rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold text-lg">{sponsor?.name || 'Unknown Sponsor'}</h3>
              {sponsor?.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                  {sponsor.description}
                </p>
              )}
              {sponsor?.website && (
                <a 
                  href={sponsor.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                >
                  Visit Website <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="capitalize">
                    {proposal.proposal_type === 'sponsor_quest' ? 'Sponsor Quest' : 'Request Quest'}
                  </Badge>
                  <Badge className={statusBadge.color}>
                    {statusBadge.label}
                  </Badge>
                </div>
                
                {proposal.quest && (
                  <Link 
                    to={`/quests/${proposal.quest.slug}`}
                    className="font-medium hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    For: {proposal.quest.title}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
              </div>

              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {format(new Date(proposal.created_at), 'MMM d, yyyy')}
              </span>
            </div>

            {/* Message */}
            {proposal.message && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm">{proposal.message}</p>
              </div>
            )}

            {/* Details Row */}
            <div className="flex flex-wrap gap-4 text-sm">
              {proposal.budget_or_reward && (
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Offering:</strong> {proposal.budget_or_reward}</span>
                </div>
              )}
              {proposal.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Venue:</strong> {proposal.venue.venue_name}</span>
                  {proposal.venue.capacity && (
                    <span className="text-muted-foreground">(Cap: {proposal.venue.capacity})</span>
                  )}
                </div>
              )}
              {proposal.quest?.start_datetime && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Quest: {format(new Date(proposal.quest.start_datetime), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>

            {/* Attached Rewards */}
            {proposal.rewards && proposal.rewards.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Attached Rewards:</p>
                <div className="flex flex-wrap gap-2">
                  {proposal.rewards.map(reward => (
                    <Badge key={reward.id} variant="secondary">
                      <Gift className="h-3 w-3 mr-1" />
                      {reward.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {!readOnly && proposal.status === 'sent' && (
              <div className="flex gap-3 pt-2">
                <Button onClick={onAccept} disabled={isAccepting} className="gap-2">
                  {isAccepting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Accept Proposal
                </Button>
                <Button variant="outline" onClick={onDecline} className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Decline
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
