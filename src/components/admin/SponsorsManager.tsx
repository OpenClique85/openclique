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
  const { data: proposals, isLoading } = useQuery({
    queryKey: ['pending-proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsorship_proposals')
        .select(`
          *,
          sponsor:sponsor_profiles(name, slug),
          quest:quests(title, slug)
        `)
        .in('status', ['accepted', 'pending_admin'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const queryClient = useQueryClient();

  const handleApprove = async (proposalId: string) => {
    const { error } = await supabase
      .from('sponsorship_proposals')
      .update({ 
        status: 'approved',
        admin_approved_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    if (error) {
      toast.error('Failed to approve proposal');
      return;
    }

    toast.success('Proposal approved');
    queryClient.invalidateQueries({ queryKey: ['pending-proposals'] });
  };

  const handleReject = async (proposalId: string) => {
    const { error } = await supabase
      .from('sponsorship_proposals')
      .update({ status: 'declined' })
      .eq('id', proposalId);

    if (error) {
      toast.error('Failed to reject proposal');
      return;
    }

    toast.success('Proposal rejected');
    queryClient.invalidateQueries({ queryKey: ['pending-proposals'] });
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Proposals Awaiting Admin Review</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sponsor</TableHead>
              <TableHead>Quest</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
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
                  <TableCell className="font-medium">
                    {proposal.sponsor?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>{proposal.quest?.title || 'Custom Request'}</TableCell>
                  <TableCell className="capitalize">
                    {proposal.proposal_type.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{proposal.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(proposal.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(proposal.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(proposal.id)}
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
    </div>
  );
}
