import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, Send, X, Check, Eye, UserX, UserCheck, ExternalLink, Users, FileText, Clock, CheckCircle } from 'lucide-react';
import { QuestReviewModal } from './QuestReviewModal';

type CreatorApplication = Tables<'creator_applications'>;
type CreatorProfile = Tables<'creator_profiles'>;
type Quest = Tables<'quests'>;

interface CreatorWithStats extends CreatorProfile {
  quest_count?: number;
  published_count?: number;
  profile_display_name?: string;
}

interface QuestWithCreator extends Quest {
  creator_profile?: {
    display_name: string;
  };
}

export function CreatorsManager() {
  const [activeTab, setActiveTab] = useState('applications');
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="creators">Active Creators</TabsTrigger>
          <TabsTrigger value="review">Quest Review</TabsTrigger>
        </TabsList>
        
        <TabsContent value="applications" className="mt-6">
          <ApplicationsTab />
        </TabsContent>
        
        <TabsContent value="creators" className="mt-6">
          <ActiveCreatorsTab />
        </TabsContent>
        
        <TabsContent value="review" className="mt-6">
          <QuestReviewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== APPLICATIONS TAB ====================
function ApplicationsTab() {
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<CreatorApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  async function fetchApplications() {
    setLoading(true);
    let query = supabase
      .from('creator_applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    
    const { data, error } = await query;
    
    if (error) {
      toast.error('Failed to load applications');
      console.error(error);
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  }

  async function handleApproveAndInvite(app: CreatorApplication) {
    setSendingInvite(app.id);
    try {
      // Update application status
      const { error: updateError } = await supabase
        .from('creator_applications')
        .update({ status: 'approved' })
        .eq('id', app.id);
      
      if (updateError) throw updateError;

      // Call edge function to create invite and send email
      const { error: inviteError } = await supabase.functions.invoke('send-creator-invite', {
        body: {
          application_id: app.id,
          email: app.email,
          name: app.name
        }
      });

      if (inviteError) throw inviteError;

      toast.success(`Invite sent to ${app.email}`);
      fetchApplications();
    } catch (error) {
      console.error(error);
      toast.error('Failed to send invite');
    } finally {
      setSendingInvite(null);
    }
  }

  async function handleReject() {
    if (!selectedApp) return;
    
    try {
      const { error } = await supabase
        .from('creator_applications')
        .update({ status: 'rejected' })
        .eq('id', selectedApp.id);
      
      if (error) throw error;
      
      toast.success('Application rejected');
      setRejectModalOpen(false);
      setSelectedApp(null);
      setRejectReason('');
      fetchApplications();
    } catch (error) {
      console.error(error);
      toast.error('Failed to reject application');
    }
  }

  function getStatusBadge(status: string | null) {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  }

  function parseSocialLinks(links: unknown): Record<string, string> {
    if (!links) return {};
    if (typeof links === 'object' && links !== null) {
      return links as Record<string, string>;
    }
    return {};
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="text-sm text-muted-foreground">
          {applications.length} application{applications.length !== 1 ? 's' : ''}
        </div>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No applications found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Social</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => {
                const socials = parseSocialLinks(app.social_links);
                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{app.creator_type || 'Not specified'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {Object.entries(socials).slice(0, 2).map(([platform, url]) => (
                          url && (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-xs flex items-center gap-1"
                            >
                              {platform}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {app.created_at ? format(new Date(app.created_at), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {app.status === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleApproveAndInvite(app)}
                            disabled={sendingInvite === app.id}
                          >
                            {sendingInvite === app.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-1" />
                                Invite
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedApp(app);
                              setRejectModalOpen(true);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Reject Confirmation Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {selectedApp?.name}'s application?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Optional: Reason for rejection (internal note)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== ACTIVE CREATORS TAB ====================
function ActiveCreatorsTab() {
  const [creators, setCreators] = useState<CreatorWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 });
  const [selectedCreator, setSelectedCreator] = useState<CreatorWithStats | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, []);

  async function fetchCreators() {
    setLoading(true);
    
    // Fetch creator profiles
    const { data: profiles, error } = await supabase
      .from('creator_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to load creators');
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch quest counts for each creator
    const creatorsWithStats: CreatorWithStats[] = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { count: totalCount } = await supabase
          .from('quests')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', profile.user_id);
        
        const { count: publishedCount } = await supabase
          .from('quests')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', profile.user_id)
          .eq('status', 'open');
        
        return {
          ...profile,
          quest_count: totalCount || 0,
          published_count: publishedCount || 0
        };
      })
    );

    setCreators(creatorsWithStats);
    setStats({
      total: creatorsWithStats.length,
      active: creatorsWithStats.filter(c => c.status === 'active').length,
      pending: creatorsWithStats.filter(c => c.status === 'pending').length
    });
    setLoading(false);
  }

  async function toggleCreatorStatus(creator: CreatorWithStats) {
    const newStatus = creator.status === 'active' ? 'suspended' : 'active';
    
    const { error } = await supabase
      .from('creator_profiles')
      .update({ status: newStatus })
      .eq('id', creator.id);
    
    if (error) {
      toast.error('Failed to update creator status');
      console.error(error);
    } else {
      toast.success(`Creator ${newStatus === 'active' ? 'activated' : 'suspended'}`);
      fetchCreators();
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Suspended</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Creators</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending Onboarding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {creators.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No creators yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Quests</TableHead>
                <TableHead className="text-center">Published</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators.map((creator) => (
                <TableRow key={creator.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {creator.photo_url ? (
                        <img
                          src={creator.photo_url}
                          alt={creator.display_name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">{creator.display_name.charAt(0)}</span>
                        </div>
                      )}
                      {creator.display_name}
                    </div>
                  </TableCell>
                  <TableCell>{creator.city || '-'}</TableCell>
                  <TableCell>{getStatusBadge(creator.status)}</TableCell>
                  <TableCell className="text-center">{creator.quest_count}</TableCell>
                  <TableCell className="text-center">{creator.published_count}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(creator.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCreator(creator);
                          setViewModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={creator.status === 'active' ? 'outline' : 'default'}
                        onClick={() => toggleCreatorStatus(creator)}
                      >
                        {creator.status === 'active' ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* View Creator Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Creator Profile</DialogTitle>
          </DialogHeader>
          {selectedCreator && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedCreator.photo_url ? (
                  <img
                    src={selectedCreator.photo_url}
                    alt={selectedCreator.display_name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-medium">{selectedCreator.display_name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{selectedCreator.display_name}</h3>
                  <p className="text-muted-foreground">{selectedCreator.city || 'Location not set'}</p>
                </div>
              </div>
              
              {selectedCreator.bio && (
                <div>
                  <h4 className="font-medium mb-1">Bio</h4>
                  <p className="text-muted-foreground text-sm">{selectedCreator.bio}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Total Quests</h4>
                  <p className="text-2xl font-bold">{selectedCreator.quest_count}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Published</h4>
                  <p className="text-2xl font-bold">{selectedCreator.published_count}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Status</h4>
                {getStatusBadge(selectedCreator.status)}
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Member Since</h4>
                <p className="text-muted-foreground">{format(new Date(selectedCreator.created_at), 'MMMM d, yyyy')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== QUEST REVIEW TAB ====================
function QuestReviewTab() {
  const [quests, setQuests] = useState<QuestWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending_review');
  const [selectedQuest, setSelectedQuest] = useState<QuestWithCreator | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  useEffect(() => {
    fetchQuests();
  }, [statusFilter]);

  async function fetchQuests() {
    setLoading(true);
    
    let query = supabase
      .from('quests')
      .select('*')
      .not('creator_id', 'is', null)
      .order('submitted_at', { ascending: false });
    
    if (statusFilter !== 'all') {
      query = query.eq('review_status', statusFilter as 'draft' | 'pending_review' | 'needs_changes' | 'approved' | 'rejected');
    }
    
    const { data, error } = await query;
    
    if (error) {
      toast.error('Failed to load quests');
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch creator names for each quest
    const questsWithCreators: QuestWithCreator[] = await Promise.all(
      (data || []).map(async (quest) => {
        if (quest.creator_id) {
          const { data: profile } = await supabase
            .from('creator_profiles')
            .select('display_name')
            .eq('user_id', quest.creator_id)
            .single();
          
          return {
            ...quest,
            creator_profile: profile ? { display_name: profile.display_name } : undefined
          };
        }
        return quest;
      })
    );

    setQuests(questsWithCreators);
    setLoading(false);
  }

  function getReviewStatusBadge(status: string | null) {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      case 'needs_changes':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Needs Changes</Badge>;
      case 'pending_review':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pending Review</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quests</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="needs_changes">Needs Changes</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="text-sm text-muted-foreground">
          {quests.length} quest{quests.length !== 1 ? 's' : ''}
        </div>
      </div>

      {quests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No quests to review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quests.map((quest) => (
            <Card
              key={quest.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => {
                setSelectedQuest(quest);
                setReviewModalOpen(true);
              }}
            >
              {quest.image_url && (
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <img
                    src={quest.image_url}
                    alt={quest.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold line-clamp-1">{quest.title}</h3>
                  <span className="text-lg">{quest.icon}</span>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {quest.short_description || 'No description'}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    by {quest.creator_profile?.display_name || quest.creator_name || 'Unknown'}
                  </span>
                  {getReviewStatusBadge(quest.review_status)}
                </div>
                
                {quest.submitted_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Submitted {format(new Date(quest.submitted_at), 'MMM d, yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quest Review Modal */}
      <QuestReviewModal
        quest={selectedQuest}
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        onActionComplete={() => {
          fetchQuests();
          setReviewModalOpen(false);
        }}
      />
    </div>
  );
}
