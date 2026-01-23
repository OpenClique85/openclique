import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Loader2, 
  Check, 
  X, 
  Mail, 
  Building2, 
  MapPin, 
  Globe,
  Eye,
  Send
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Tables } from '@/integrations/supabase/types';
import { auditLog } from '@/lib/auditLog';

type SponsorApplication = Tables<'sponsor_applications'>;
type SponsorProfile = Tables<'sponsor_profiles'>;
type SponsorshipProposal = Tables<'sponsorship_proposals'>;

export function SponsorsManager() {
  return (
    <Tabs defaultValue="applications" className="space-y-4">
      <TabsList>
        <TabsTrigger value="applications">Applications</TabsTrigger>
        <TabsTrigger value="active">Active Sponsors</TabsTrigger>
        <TabsTrigger value="proposals">Proposal Review</TabsTrigger>
      </TabsList>

      <TabsContent value="applications">
        <ApplicationsTab />
      </TabsContent>
      <TabsContent value="active">
        <ActiveSponsorsTab />
      </TabsContent>
      <TabsContent value="proposals">
        <ProposalReviewTab />
      </TabsContent>
    </Tabs>
  );
}

function ApplicationsTab() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedApp, setSelectedApp] = useState<SponsorApplication | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['sponsor-applications', statusFilter],
    queryFn: async () => {
      const query = supabase
        .from('sponsor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SponsorApplication[];
    },
  });

  const handleApproveAndInvite = async (app: SponsorApplication) => {
    setIsProcessing(true);
    try {
      // Update status
      const { error: updateError } = await supabase
        .from('sponsor_applications')
        .update({ status: 'approved' })
        .eq('id', app.id);

      if (updateError) throw updateError;

      // Audit log the approval
      await auditLog({
        action: 'application_approve',
        targetTable: 'sponsor_applications',
        targetId: app.id,
        oldValues: { status: 'pending' },
        newValues: { status: 'approved', email: app.contact_email, business_name: app.business_name },
      });

      // Send invite
      const { error: inviteError } = await supabase.functions.invoke('send-sponsor-invite', {
        body: {
          application_id: app.id,
          email: app.contact_email,
          name: app.contact_name,
        },
      });

      if (inviteError) throw inviteError;

      toast.success('Application approved and invite sent!');
      queryClient.invalidateQueries({ queryKey: ['sponsor-applications'] });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('sponsor_applications')
        .update({ 
          status: 'rejected',
          internal_notes: rejectNotes || null,
        })
        .eq('id', selectedApp.id);

      if (error) throw error;

      // Audit log the rejection
      await auditLog({
        action: 'application_reject',
        targetTable: 'sponsor_applications',
        targetId: selectedApp.id,
        oldValues: { status: 'pending' },
        newValues: { status: 'rejected', reason: rejectNotes || null },
      });

      toast.success('Application rejected');
      setRejectDialogOpen(false);
      setSelectedApp(null);
      setRejectNotes('');
      queryClient.invalidateQueries({ queryKey: ['sponsor-applications'] });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to reject application');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'venue': return <MapPin className="h-4 w-4" />;
      case 'both': return <Building2 className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No applications found
                </TableCell>
              </TableRow>
            ) : (
              applications?.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="font-medium">{app.business_name}</div>
                    {app.website && (
                      <a 
                        href={app.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        {new URL(app.website).hostname}
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getTypeIcon(app.sponsor_type || 'brand')}
                      <span className="capitalize">{app.sponsor_type || 'brand'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{app.contact_name}</div>
                    <div className="text-xs text-muted-foreground">{app.contact_email}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(app.created_at!), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      app.status === 'approved' ? 'default' :
                      app.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {app.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveAndInvite(app)}
                          disabled={isProcessing}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Approve & Invite
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedApp(app);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Reject the application from {selectedApp?.business_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Internal Notes (optional)</Label>
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActiveSponsorsTab() {
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorProfile | null>(null);
  const queryClient = useQueryClient();

  const { data: sponsors, isLoading } = useQuery({
    queryKey: ['active-sponsors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SponsorProfile[];
    },
  });

  const toggleStatus = async (sponsor: SponsorProfile) => {
    const newStatus = sponsor.status === 'approved' ? 'paused' : 'approved';
    
    const { error } = await supabase
      .from('sponsor_profiles')
      .update({ status: newStatus })
      .eq('id', sponsor.id);

    if (error) {
      toast.error('Failed to update status');
      return;
    }

    // Audit log the status change
    await auditLog({
      action: 'status_change',
      targetTable: 'sponsor_profiles',
      targetId: sponsor.id,
      oldValues: { status: sponsor.status, name: sponsor.name },
      newValues: { status: newStatus },
    });

    toast.success(`Sponsor ${newStatus === 'approved' ? 'activated' : 'paused'}`);
    queryClient.invalidateQueries({ queryKey: ['active-sponsors'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{sponsors?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total Sponsors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {sponsors?.filter(s => s.status === 'approved').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {sponsors?.filter(s => s.sponsor_type === 'venue' || s.sponsor_type === 'both').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Venues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {sponsors?.filter(s => s.sponsor_type === 'brand' || s.sponsor_type === 'both').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Brands</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sponsor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sponsors?.map((sponsor) => (
              <TableRow key={sponsor.id}>
                <TableCell>
                  <div className="font-medium">{sponsor.name}</div>
                  {sponsor.website && (
                    <a 
                      href={sponsor.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      {sponsor.website}
                    </a>
                  )}
                </TableCell>
                <TableCell className="capitalize">{sponsor.sponsor_type}</TableCell>
                <TableCell>{sponsor.city}</TableCell>
                <TableCell className="text-sm">
                  {format(new Date(sponsor.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    sponsor.status === 'approved' ? 'default' :
                    sponsor.status === 'paused' ? 'secondary' :
                    sponsor.status === 'suspended' ? 'destructive' : 'outline'
                  }>
                    {sponsor.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedSponsor(sponsor)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleStatus(sponsor)}
                    >
                      {sponsor.status === 'approved' ? 'Pause' : 'Activate'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSponsor} onOpenChange={() => setSelectedSponsor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSponsor?.name}</DialogTitle>
          </DialogHeader>
          {selectedSponsor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedSponsor.sponsor_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">City</p>
                  <p className="font-medium">{selectedSponsor.city}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p className="font-medium">{selectedSponsor.contact_name}</p>
                  <p className="text-xs">{selectedSponsor.contact_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Website</p>
                  <p className="font-medium">{selectedSponsor.website || '-'}</p>
                </div>
              </div>
              {selectedSponsor.description && (
                <div>
                  <p className="text-muted-foreground text-sm">Description</p>
                  <p className="text-sm">{selectedSponsor.description}</p>
                </div>
              )}
              {selectedSponsor.preferred_quest_types && selectedSponsor.preferred_quest_types.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Preferred Quest Types</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedSponsor.preferred_quest_types.map((type: string) => (
                      <Badge key={type} variant="secondary">{type}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProposalReviewTab() {
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: proposals, isLoading } = useQuery({
    queryKey: ['pending-proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsorship_proposals')
        .select(`
          *,
          sponsor:sponsor_profiles(id, name, slug, user_id),
          quest:quests(id, title, slug, creator_id),
          creator:creator_profiles!sponsorship_proposals_creator_id_fkey(display_name, user_id),
          venue:venue_offerings(venue_name)
        `)
        .in('status', ['accepted', 'pending_admin'])
        .order('creator_response_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleApprove = async () => {
    if (!selectedProposal) return;
    setIsProcessing(true);
    
    try {
      // Update proposal status
      const { error: updateError } = await supabase
        .from('sponsorship_proposals')
        .update({ 
          status: 'approved',
          admin_approved_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', selectedProposal.id);

      if (updateError) throw updateError;

      // Audit log the proposal approval
      await auditLog({
        action: 'proposal_approve',
        targetTable: 'sponsorship_proposals',
        targetId: selectedProposal.id,
        oldValues: { status: selectedProposal.status },
        newValues: { 
          status: 'approved', 
          sponsor_name: selectedProposal.sponsor?.name || null,
          quest_title: selectedProposal.quest?.title || null,
        },
      });

      // If quest exists, update it to be sponsored
      if (selectedProposal.quest?.id) {
        await supabase
          .from('quests')
          .update({ 
            is_sponsored: true,
            sponsor_id: selectedProposal.sponsor?.id,
          })
          .eq('id', selectedProposal.quest.id);

        // Create sponsored_quests link
        await supabase
          .from('sponsored_quests')
          .insert({
            quest_id: selectedProposal.quest.id,
            sponsor_id: selectedProposal.sponsor?.id,
            proposal_id: selectedProposal.id,
            rewards_attached: selectedProposal.reward_ids || [],
          });
      }

      // Send notification to sponsor
      if (selectedProposal.sponsor?.user_id) {
        await supabase.from('notifications').insert({
          user_id: selectedProposal.sponsor.user_id,
          type: 'sponsored_quest_approved',
          title: 'Sponsorship approved!',
          body: selectedProposal.quest?.title 
            ? `Your sponsorship for "${selectedProposal.quest.title}" is now live.`
            : 'Your sponsorship has been approved by the admin team.',
        });
      }

      toast.success('Proposal approved and sponsorship activated');
      setApproveDialogOpen(false);
      setSelectedProposal(null);
      setAdminNotes('');
      queryClient.invalidateQueries({ queryKey: ['pending-proposals'] });
    } catch (error) {
      console.error('Error approving proposal:', error);
      toast.error('Failed to approve proposal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProposal) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('sponsorship_proposals')
        .update({ 
          status: 'declined',
          admin_notes: adminNotes || 'Rejected by admin',
        })
        .eq('id', selectedProposal.id);

      if (error) throw error;

      // Audit log the proposal rejection
      await auditLog({
        action: 'proposal_reject',
        targetTable: 'sponsorship_proposals',
        targetId: selectedProposal.id,
        oldValues: { status: selectedProposal.status },
        newValues: { 
          status: 'declined', 
          sponsor_name: selectedProposal.sponsor?.name || null,
          reason: adminNotes || 'Rejected by admin',
        },
      });

      // Notify sponsor
      if (selectedProposal.sponsor?.user_id) {
        await supabase.from('notifications').insert({
          user_id: selectedProposal.sponsor.user_id,
          type: 'sponsorship_proposal_declined',
          title: 'Sponsorship proposal not approved',
          body: adminNotes || 'Your sponsorship proposal was not approved at this time.',
        });
      }

      toast.success('Proposal rejected');
      setRejectDialogOpen(false);
      setSelectedProposal(null);
      setAdminNotes('');
      queryClient.invalidateQueries({ queryKey: ['pending-proposals'] });
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error('Failed to reject proposal');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingCount = proposals?.filter(p => p.status === 'accepted' || p.status === 'pending_admin').length || 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">Awaiting Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {proposals?.filter(p => p.proposal_type === 'sponsor_quest').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Quest Sponsorships</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {proposals?.filter(p => p.proposal_type === 'request_quest').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Custom Requests</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Proposals Awaiting Admin Review
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sponsor</TableHead>
              <TableHead>Quest / Request</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Accepted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No proposals awaiting review
                </TableCell>
              </TableRow>
            ) : (
              proposals?.map((proposal: any) => (
                <TableRow key={proposal.id}>
                  <TableCell>
                    <div className="font-medium">{proposal.sponsor?.name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {proposal.proposal_type.replace('_', ' ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {proposal.quest?.title || (
                      <span className="text-muted-foreground italic">Custom Request</span>
                    )}
                    {proposal.venue?.venue_name && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {proposal.venue.venue_name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {proposal.creator?.display_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{proposal.budget_or_reward || '—'}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {proposal.creator_response_at 
                      ? format(new Date(proposal.creator_response_at), 'MMM d, h:mm a')
                      : '—'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedProposal(proposal)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setApproveDialogOpen(true);
                        }}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setRejectDialogOpen(true);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Preview Dialog */}
      <Dialog open={!!selectedProposal && !approveDialogOpen && !rejectDialogOpen} onOpenChange={() => setSelectedProposal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Proposal Details</DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Sponsor</p>
                  <p className="font-medium">{selectedProposal.sponsor?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedProposal.proposal_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quest</p>
                  <p className="font-medium">{selectedProposal.quest?.title || 'Custom Request'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Creator</p>
                  <p className="font-medium">{selectedProposal.creator?.display_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Budget/Offering</p>
                  <p className="font-medium">{selectedProposal.budget_or_reward || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="secondary">{selectedProposal.status}</Badge>
                </div>
              </div>
              
              {selectedProposal.message && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Message</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedProposal.message}</p>
                </div>
              )}

              {selectedProposal.reward_ids && selectedProposal.reward_ids.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Rewards Attached</p>
                  <Badge variant="outline">{selectedProposal.reward_ids.length} reward(s)</Badge>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1"
                  onClick={() => setApproveDialogOpen(true)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve Sponsorship
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Sponsorship</DialogTitle>
            <DialogDescription>
              This will activate the sponsorship and notify the sponsor.
              {selectedProposal?.quest?.title && (
                <span className="block mt-2 font-medium">
                  Quest: "{selectedProposal.quest.title}"
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Admin Notes (optional)</Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes about this approval..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Approve & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
            <DialogDescription>
              Reject the proposal from {selectedProposal?.sponsor?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional, shared with sponsor)</Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Reason for rejection..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
