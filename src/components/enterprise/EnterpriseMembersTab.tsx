/**
 * EnterpriseMembersTab - Manage members across organizations
 * 
 * Features:
 * - List all members with org filter
 * - Delete members from orgs
 * - Suspend user accounts
 * - Change member roles
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Users, 
  Search, 
  Trash2, 
  UserCog,
  Building2,
  Loader2,
  Shield,
  Ban,
  UserX
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface OrgMember {
  profile_id: string;
  org_id: string;
  role: string;
  joined_at: string;
  org: {
    id: string;
    name: string;
    slug: string;
    is_umbrella: boolean;
  };
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface Organization {
  id: string;
  name: string;
}

export function EnterpriseMembersTab() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
  const [newRole, setNewRole] = useState<string>('member');

  // Fetch organizations for filter
  const { data: orgs } = useQuery({
    queryKey: ['all-orgs-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data as Organization[];
    },
  });

  // Fetch members
  const { data: members, isLoading } = useQuery({
    queryKey: ['enterprise-members', selectedOrg],
    queryFn: async () => {
      let query = supabase
        .from('profile_organizations')
        .select(`
          profile_id,
          org_id,
          role,
          joined_at,
          org:organizations!profile_organizations_org_id_fkey(id, name, slug, is_umbrella),
          profile:profiles!profile_organizations_profile_id_fkey(id, display_name, avatar_url)
        `)
        .order('joined_at', { ascending: false });

      if (selectedOrg !== 'all') {
        query = query.eq('org_id', selectedOrg);
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      
      // Transform data to flatten org and profile
      return (data || []).map(item => ({
        ...item,
        org: Array.isArray(item.org) ? item.org[0] : item.org,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
      })) as OrgMember[];
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ profileId, orgId }: { profileId: string; orgId: string }) => {
      const { error } = await supabase
        .from('profile_organizations')
        .delete()
        .eq('profile_id', profileId)
        .eq('org_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-members'] });
      setShowRemoveModal(false);
      setSelectedMember(null);
      toast.success('Member removed from organization');
    },
    onError: (error) => {
      toast.error('Failed to remove member: ' + error.message);
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ profileId, orgId, role }: { profileId: string; orgId: string; role: 'admin' | 'creator' | 'member' | 'org_admin' | 'social_chair' }) => {
      const { error } = await supabase
        .from('profile_organizations')
        .update({ role })
        .eq('profile_id', profileId)
        .eq('org_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-members'] });
      setShowRoleModal(false);
      setSelectedMember(null);
      toast.success('Member role updated');
    },
    onError: (error) => {
      toast.error('Failed to update role: ' + error.message);
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
      case 'org_admin':
        return 'destructive';
      case 'social_chair':
        return 'default';
      case 'creator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredMembers = members?.filter(m =>
    m.profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.org?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-display font-bold">Members Management</h2>
        <p className="text-muted-foreground text-sm">
          View and manage members across all organizations
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members or organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedOrg} onValueChange={setSelectedOrg}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Filter by organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {orgs?.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Members Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        {filteredMembers.length} members found
      </div>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No Members Found</h3>
              <p className="text-muted-foreground text-sm">
                Adjust your search or filter criteria
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={`${member.profile_id}-${member.org_id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {member.profile?.avatar_url ? (
                              <img 
                                src={member.profile.avatar_url} 
                                alt="" 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {member.profile?.display_name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {member.profile_id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {member.org?.name || 'Unknown Org'}
                          {member.org?.is_umbrella && (
                            <Badge variant="outline" className="text-xs">Umbrella</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
                          {member.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.joined_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedMember(member);
                              setNewRole(member.role);
                              setShowRoleModal(true);
                            }}
                            title="Change Role"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedMember(member);
                              setShowRemoveModal(true);
                            }}
                            title="Remove from Organization"
                          >
                            <UserX className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Remove Member Modal */}
      <AlertDialog open={showRemoveModal} onOpenChange={setShowRemoveModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{selectedMember?.profile?.display_name}</strong> from <strong>{selectedMember?.org?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedMember && removeMemberMutation.mutate({
                profileId: selectedMember.profile_id,
                orgId: selectedMember.org_id
              })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update the role for <strong>{selectedMember?.profile?.display_name}</strong> in <strong>{selectedMember?.org?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="social_chair">Social Chair</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="org_admin">Org Admin</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedMember && updateRoleMutation.mutate({
                profileId: selectedMember.profile_id,
                orgId: selectedMember.org_id,
                role: newRole as 'admin' | 'creator' | 'member' | 'org_admin' | 'social_chair'
              })}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
