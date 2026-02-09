/**
 * =============================================================================
 * ClubDetailView - Enterprise Portal Club Drill-Down
 * =============================================================================
 * 
 * Full-featured admin view for a single club within the Enterprise Portal.
 * Provides comprehensive management capabilities for platform administrators.
 * 
 * ## Features
 * 
 * - **Overview**: Club details, stats, and social chairs
 * - **Members**: List all members, remove members, assign social chairs
 * - **Quests**: View quests associated with this club
 * - **Invite Codes**: Manage all invite codes with label/role info
 * 
 * ## Tab Structure
 * 
 * ```
 * ClubDetailView
 *   ├── Overview Tab
 *   │     ├── Club details (type, created, parent org)
 *   │     └── Social Chairs section
 *   ├── Members Tab
 *   │     └── Member table with role badges and remove action
 *   ├── Quests Tab
 *   │     └── Quest table with status badges
 *   └── Invite Codes Tab
 *         └── Code table with label, role, usage, actions
 * ```
 * 
 * ## Data Sources
 * 
 * - `organizations` - Club details
 * - `profile_organizations` - Member list and roles
 * - `org_invite_codes` - Invite codes with new label/role fields
 * - `quests` - Quests where org_id matches
 * 
 * @module enterprise/ClubDetailView
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
  Building2,
  Users,
  UserCog,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Settings,
  Ticket,
  Copy,
  Trash2,
  Plus,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// -----------------------------------------------------------------------------
// TYPE DEFINITIONS
// -----------------------------------------------------------------------------

/**
 * Props for the ClubDetailView component
 */
interface ClubDetailViewProps {
  /** UUID of the club to display */
  clubId: string;
  /** Callback to navigate back to the clubs list */
  onBack: () => void;
}

/**
 * Club record with parent organization info
 */
interface ClubDetails {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  parent_org_id: string | null;
  suspended_at: string | null;
  created_at: string;
  /** Resolved parent organization info */
  parent_org?: { name: string; slug: string } | null;
}

/**
 * Club member record with profile info
 */
interface ClubMember {
  profile_id: string;
  org_id: string;
  role: string;
  joined_at: string;
  profile: {
    display_name: string | null;
    email: string | null;
  } | null;
}

/**
 * Invite code record with new label/role fields
 */
interface ClubInviteCode {
  id: string;
  code: string;
  /** Human-readable label (e.g., "Spring 2026 Cohort") */
  label: string | null;
  /** Role auto-assigned on redemption */
  auto_assign_role: string | null;
  is_active: boolean;
  uses_count: number;
  max_uses: number | null;
  expires_at: string | null;
  created_at: string;
}

/**
 * Quest record for the quests tab
 */
interface ClubQuest {
  id: string;
  title: string;
  icon: string | null;
  status: string;
  start_datetime: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

export function ClubDetailView({ clubId, onBack }: ClubDetailViewProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSocialChairModal, setShowSocialChairModal] = useState(false);
  const [socialChairEmail, setSocialChairEmail] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    type: '',
  });

  // Fetch club details
  const { data: club, isLoading: clubLoading } = useQuery({
    queryKey: ['enterprise-club-detail', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          parent_org:organizations!parent_org_id(name, slug)
        `)
        .eq('id', clubId)
        .single();
      if (error) throw error;
      return {
        ...data,
        parent_org: Array.isArray(data.parent_org) ? data.parent_org[0] : data.parent_org
      } as ClubDetails;
    },
  });

  // Fetch club members
  const { data: members = [] } = useQuery({
    queryKey: ['enterprise-club-members', clubId],
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
        .eq('org_id', clubId)
        .order('joined_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(m => ({
        ...m,
        profile: Array.isArray(m.profile) ? m.profile[0] : m.profile
      })) as unknown as ClubMember[];
    },
  });

  // Fetch club invite codes
  const { data: inviteCodes = [] } = useQuery({
    queryKey: ['enterprise-club-invite-codes', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_invite_codes')
        .select('*')
        .eq('org_id', clubId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ClubInviteCode[];
    },
  });

  // Fetch quests associated with this club
  const { data: quests = [] } = useQuery({
    queryKey: ['enterprise-club-quests', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select('id, title, icon, status, start_datetime, created_at')
        .eq('org_id', clubId)
        .order('start_datetime', { ascending: false });
      if (error) throw error;
      return data as ClubQuest[];
    },
  });

  // Aggregate stats
  const totalMembers = members.length;
  const socialChairs = members.filter(m => m.role === 'social_chair');
  const activeInviteCodes = inviteCodes.filter(c => c.is_active).length;
  const activeQuests = quests.filter(q => q.status === 'open').length;

  // Update club mutation
  const updateClubMutation = useMutation({
    mutationFn: async (updates: { name: string; description: string | null; type: string }) => {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: updates.name,
          description: updates.description,
          type: updates.type as 'club' | 'company' | 'fraternity' | 'nonprofit' | 'other' | 'sorority' | 'university',
        })
        .eq('id', clubId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-club-detail', clubId] });
      queryClient.invalidateQueries({ queryKey: ['enterprise-clubs'] });
      setShowEditModal(false);
      toast.success('Club updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  // Assign social chair mutation
  const assignSocialChairMutation = useMutation({
    mutationFn: async (email: string) => {
      // First, find the user by their email in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profile) {
        throw new Error(`No user found with email: ${email}. Make sure they have an account first.`);
      }

      // Now assign the social_chair role using the user's UUID
      const { error } = await supabase
        .from('profile_organizations')
        .upsert({
          profile_id: profile.id,
          org_id: clubId,
          role: 'social_chair',
        }, {
          onConflict: 'profile_id,org_id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-club-members', clubId] });
      setShowSocialChairModal(false);
      setSocialChairEmail('');
      toast.success('Social chair assigned');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('profile_organizations')
        .delete()
        .eq('org_id', clubId)
        .eq('profile_id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-club-members', clubId] });
      toast.success('Member removed');
    },
    onError: (error) => {
      toast.error('Failed to remove member: ' + error.message);
    },
  });

  const handleEditSubmit = () => {
    updateClubMutation.mutate({
      name: editForm.name,
      description: editForm.description || null,
      type: editForm.type,
    });
  };

  const openEditModal = () => {
    if (club) {
      setEditForm({
        name: club.name,
        description: club.description || '',
        type: club.type,
      });
      setShowEditModal(true);
    }
  };

  const copyInviteLink = (code: string) => {
    const link = `${PUBLISHED_URL}/auth?club=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied!');
  };

  if (clubLoading || !club) {
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
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">{club.name}</h2>
              <p className="text-muted-foreground text-sm">/{club.slug}</p>
            </div>
            {club.suspended_at ? (
              <Badge variant="destructive">Suspended</Badge>
            ) : (
              <Badge variant="secondary">Active</Badge>
            )}
            <Badge variant="outline">{club.type}</Badge>
          </div>
          {club.parent_org && (
            <p className="text-muted-foreground text-sm">
              Part of <span className="font-medium">{club.parent_org.name}</span>
            </p>
          )}
          {club.description && (
            <p className="text-muted-foreground mt-2">{club.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSocialChairModal(true)}>
            <UserCog className="h-4 w-4 mr-2" />
            Add Social Chair
          </Button>
          <Button variant="outline" onClick={openEditModal}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalMembers}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <UserCog className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{socialChairs.length}</p>
                <p className="text-xs text-muted-foreground">Social Chairs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{activeQuests}</p>
                <p className="text-xs text-muted-foreground">Active Quests</p>
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
          <TabsTrigger value="members">Members ({totalMembers})</TabsTrigger>
          <TabsTrigger value="quests">Quests ({quests.length})</TabsTrigger>
          <TabsTrigger value="codes">Invite Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Club Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{club.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(club.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Parent Organization</p>
                  <p className="font-medium">{club.parent_org?.name || 'None'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{club.suspended_at ? 'Suspended' : 'Active'}</p>
                </div>
              </div>

              {/* Social Chairs Section */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Social Chairs
                </h4>
                {socialChairs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No social chairs assigned</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {socialChairs.map(sc => (
                      <Badge key={sc.profile_id} variant="secondary" className="gap-2">
                        {sc.profile?.display_name || sc.profile?.email || 'Unknown'}
                        <Mail className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardContent className="p-0">
              {members.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No members</p>
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
                        <TableHead className="text-right">Actions</TableHead>
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
                            <Badge variant={member.role === 'social_chair' ? 'default' : 'secondary'}>
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(member.joined_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMemberMutation.mutate(member.profile_id)}
                              disabled={removeMemberMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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

        <TabsContent value="quests">
          <Card>
            <CardContent className="p-0">
              {quests.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No quests created by this club</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quest</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quests.map((quest) => (
                        <TableRow key={quest.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{quest.icon || '🎯'}</span>
                              <p className="font-medium">{quest.title}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={quest.status === 'open' ? 'default' : 'secondary'}>
                              {quest.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {quest.start_datetime 
                              ? format(new Date(quest.start_datetime), 'MMM d, yyyy')
                              : '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(quest.created_at), 'MMM d, yyyy')}
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
                        <TableHead>Label</TableHead>
                        <TableHead>Role</TableHead>
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
                            {code.label || <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {code.auto_assign_role || 'member'}
                            </Badge>
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
            <DialogTitle>Edit Club</DialogTitle>
            <DialogDescription>
              Update club details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Club Name</Label>
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
              <Label>Type</Label>
              <Input
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateClubMutation.isPending}>
              {updateClubMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Social Chair Modal */}
      <Dialog open={showSocialChairModal} onOpenChange={setShowSocialChairModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Social Chair</DialogTitle>
            <DialogDescription>
              Enter the email address of the user to assign as social chair for {club.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={socialChairEmail}
                onChange={(e) => setSocialChairEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSocialChairModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => assignSocialChairMutation.mutate(socialChairEmail)}
              disabled={assignSocialChairMutation.isPending || !socialChairEmail}
            >
              {assignSocialChairMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
