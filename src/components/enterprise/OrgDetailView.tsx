/**
 * OrgDetailView - Drill-down view for an umbrella organization
 * 
 * Shows full org dashboard with:
 * - Org info & settings
 * - Child clubs list
 * - Member list
 * - Quests under this org
 * - Analytics
 * - Admin actions
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft,
  GraduationCap, 
  Building2,
  Users,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Settings,
  BarChart3,
  Ticket,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface OrgDetailViewProps {
  orgId: string;
  onBack: () => void;
  onSelectClub: (clubId: string) => void;
}

interface OrgDetails {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  school_affiliation: string | null;
  verified_domains: string[] | null;
  is_verified: boolean;
  is_umbrella: boolean;
  suspended_at: string | null;
  suspend_reason: string | null;
  created_at: string;
}

interface Club {
  id: string;
  name: string;
  slug: string;
  type: string;
  suspended_at: string | null;
  created_at: string;
  member_count?: number;
}

interface OrgMember {
  profile_id: string;
  org_id: string;
  role: string;
  joined_at: string;
  profile: {
    display_name: string | null;
    email: string | null;
  } | null;
}

interface OrgInviteCode {
  id: string;
  code: string;
  is_active: boolean;
  uses_count: number;
  max_uses: number | null;
  expires_at: string | null;
  created_at: string;
}

export function OrgDetailView({ orgId, onBack, onSelectClub }: OrgDetailViewProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    school_affiliation: '',
    verified_domains: '',
    is_verified: false,
  });

  // Fetch org details
  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['enterprise-org-detail', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      if (error) throw error;
      return data as OrgDetails;
    },
  });

  // Fetch child clubs
  const { data: clubs = [] } = useQuery({
    queryKey: ['enterprise-org-clubs', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('parent_org_id', orgId)
        .order('name');
      if (error) throw error;
      
      // Get member counts for each club
      const clubsWithCounts = await Promise.all(
        (data || []).map(async (club) => {
          const { count } = await supabase
            .from('profile_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', club.id);
          return { ...club, member_count: count || 0 };
        })
      );
      return clubsWithCounts as Club[];
    },
  });

  // Fetch org members (direct members of umbrella org)
  const { data: members = [] } = useQuery({
    queryKey: ['enterprise-org-members', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_organizations')
        .select(`
          profile_id,
          org_id,
          role,
          joined_at,
          profile:profiles(display_name, email)
        `)
        .eq('org_id', orgId)
        .order('joined_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(m => ({
        ...m,
        profile: Array.isArray(m.profile) ? m.profile[0] : m.profile
      })) as unknown as OrgMember[];
    },
  });

  // Fetch org invite codes
  const { data: inviteCodes = [] } = useQuery({
    queryKey: ['enterprise-org-invite-codes', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_invite_codes')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OrgInviteCode[];
    },
  });

  // Aggregate stats
  const totalMembers = members.length;
  const totalClubs = clubs.length;
  const totalClubMembers = clubs.reduce((sum, c) => sum + (c.member_count || 0), 0);
  const activeInviteCodes = inviteCodes.filter(c => c.is_active).length;

  // Update org mutation
  const updateOrgMutation = useMutation({
    mutationFn: async (updates: Partial<OrgDetails>) => {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-org-detail', orgId] });
      queryClient.invalidateQueries({ queryKey: ['enterprise-umbrella-orgs'] });
      setShowEditModal(false);
      toast.success('Organization updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  const handleEditSubmit = () => {
    const domains = editForm.verified_domains
      .split(',')
      .map(d => d.trim())
      .filter(Boolean);
    
    updateOrgMutation.mutate({
      name: editForm.name,
      description: editForm.description || null,
      school_affiliation: editForm.school_affiliation || null,
      verified_domains: domains.length > 0 ? domains : null,
      is_verified: editForm.is_verified,
    });
  };

  const openEditModal = () => {
    if (org) {
      setEditForm({
        name: org.name,
        description: org.description || '',
        school_affiliation: org.school_affiliation || '',
        verified_domains: (org.verified_domains || []).join(', '),
        is_verified: org.is_verified,
      });
      setShowEditModal(true);
    }
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/join?code=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied!');
  };

  if (orgLoading || !org) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">{org.name}</h2>
              <p className="text-muted-foreground text-sm">/{org.slug}</p>
            </div>
            {org.suspended_at ? (
              <Badge variant="destructive">Suspended</Badge>
            ) : org.is_verified ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline">Unverified</Badge>
            )}
          </div>
          {org.description && (
            <p className="text-muted-foreground">{org.description}</p>
          )}
        </div>
        <Button variant="outline" onClick={openEditModal}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalClubs}</p>
                <p className="text-xs text-muted-foreground">Clubs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalMembers}</p>
                <p className="text-xs text-muted-foreground">Direct Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalClubMembers}</p>
                <p className="text-xs text-muted-foreground">Club Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{activeInviteCodes}</p>
                <p className="text-xs text-muted-foreground">Active Codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clubs">Clubs ({totalClubs})</TabsTrigger>
          <TabsTrigger value="members">Members ({totalMembers})</TabsTrigger>
          <TabsTrigger value="codes">Invite Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">School Affiliation</p>
                  <p className="font-medium">{org.school_affiliation || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(org.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Verified Domains</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {org.verified_domains?.length ? (
                      org.verified_domains.map(domain => (
                        <Badge key={domain} variant="secondary">{domain}</Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {org.suspended_at ? 'Suspended' : org.is_verified ? 'Verified' : 'Unverified'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clubs">
          <Card>
            <CardContent className="p-0">
              {clubs.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No clubs under this organization</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Club</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clubs.map((club) => (
                        <TableRow 
                          key={club.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => onSelectClub(club.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Building2 className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium hover:text-primary">{club.name}</p>
                                <p className="text-xs text-muted-foreground">/{club.slug}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{club.type}</Badge>
                          </TableCell>
                          <TableCell>{club.member_count}</TableCell>
                          <TableCell>
                            {club.suspended_at ? (
                              <Badge variant="destructive">Suspended</Badge>
                            ) : (
                              <Badge variant="secondary">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(club.created_at), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardContent className="p-0">
              {members.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No direct members</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.profile_id}>
                          <TableCell className="font-medium">
                            {member.profile?.display_name || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {member.profile?.email || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(member.joined_at), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="codes">
          <Card>
            <CardContent className="p-0">
              {inviteCodes.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No invite codes</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Uses</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inviteCodes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell className="font-mono font-medium">
                            {code.code}
                          </TableCell>
                          <TableCell>
                            {code.uses_count}{code.max_uses ? ` / ${code.max_uses}` : ''}
                          </TableCell>
                          <TableCell>
                            {code.is_active ? (
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {code.expires_at ? format(new Date(code.expires_at), 'MMM d, yyyy') : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyInviteLink(code.code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>School Affiliation</Label>
              <Input
                value={editForm.school_affiliation}
                onChange={(e) => setEditForm({ ...editForm, school_affiliation: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Verified Domains (comma-separated)</Label>
              <Input
                value={editForm.verified_domains}
                onChange={(e) => setEditForm({ ...editForm, verified_domains: e.target.value })}
                placeholder="utexas.edu, mba.utexas.edu"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Verified Organization</Label>
              <Switch
                checked={editForm.is_verified}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_verified: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateOrgMutation.isPending}>
              {updateOrgMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
