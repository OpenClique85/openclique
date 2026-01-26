/**
 * EnterpriseClubsTab - Manage child clubs under umbrella organizations
 * 
 * Features:
 * - List all clubs with parent org filter
 * - Create new clubs
 * - Assign social chair roles
 * - Delete clubs
 * - Suspend clubs
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCog,
  Users,
  GraduationCap,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  parent_org_id: string | null;
  parent_org?: { name: string; slug: string } | null;
  suspended_at: string | null;
  created_at: string;
  member_count?: number;
}

interface UmbrellaOrg {
  id: string;
  name: string;
  slug: string;
}

interface EnterpriseClubsTabProps {
  onSelectClub?: (clubId: string) => void;
}

export function EnterpriseClubsTab({ onSelectClub }: EnterpriseClubsTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentOrg, setSelectedParentOrg] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSocialChairModal, setShowSocialChairModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [socialChairEmail, setSocialChairEmail] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'student_org',
    parent_org_id: '',
  });

  // Fetch umbrella organizations for filter
  const { data: umbrellaOrgs } = useQuery({
    queryKey: ['umbrella-orgs-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('is_umbrella', true)
        .order('name');
      if (error) throw error;
      return data as UmbrellaOrg[];
    },
  });

  // Fetch clubs
  const { data: clubs, isLoading } = useQuery({
    queryKey: ['enterprise-clubs', selectedParentOrg],
    queryFn: async () => {
      let query = supabase
        .from('organizations')
        .select('id, name, slug, description, type, parent_org_id, suspended_at, created_at')
        .eq('is_umbrella', false)
        .order('name');

      if (selectedParentOrg !== 'all') {
        query = query.eq('parent_org_id', selectedParentOrg);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get member counts and parent org info
      const clubsWithCounts = await Promise.all(
        (data || []).map(async (club) => {
          const { count } = await supabase
            .from('profile_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', club.id);
          
          // Get parent org if exists
          let parent_org = null;
          if (club.parent_org_id) {
            const { data: parentData } = await supabase
              .from('organizations')
              .select('name, slug')
              .eq('id', club.parent_org_id)
              .single();
            parent_org = parentData;
          }
          
          return { ...club, member_count: count || 0, parent_org };
        })
      );

      return clubsWithCounts as Club[];
    },
  });

  // Create club mutation
  const createClubMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('organizations').insert([{
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        description: data.description || null,
        type: 'club' as const,
        parent_org_id: data.parent_org_id || null,
        is_umbrella: false,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-clubs'] });
      setShowCreateModal(false);
      resetForm();
      toast.success('Club created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create club: ' + error.message);
    },
  });

  // Delete club mutation
  const deleteClubMutation = useMutation({
    mutationFn: async (clubId: string) => {
      // First remove all members
      await supabase.from('profile_organizations').delete().eq('org_id', clubId);
      // Then delete the club
      const { error } = await supabase.from('organizations').delete().eq('id', clubId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-clubs'] });
      setShowDeleteModal(false);
      setSelectedClub(null);
      toast.success('Club deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete club: ' + error.message);
    },
  });

  // Assign social chair mutation
  const assignSocialChairMutation = useMutation({
    mutationFn: async ({ clubId, email }: { clubId: string; email: string }) => {
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
      setShowSocialChairModal(false);
      setSocialChairEmail('');
      setSelectedClub(null);
      toast.success('Social chair role assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      type: 'student_org',
      parent_org_id: '',
    });
  };

  const filteredClubs = clubs?.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Clubs Management</h2>
          <p className="text-muted-foreground text-sm">
            Create, manage, and assign social chairs to clubs
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Club
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clubs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedParentOrg} onValueChange={setSelectedParentOrg}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by parent org" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {umbrellaOrgs?.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clubs Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No Clubs Found</h3>
              <p className="text-muted-foreground text-sm">
                Create a new club or adjust your filters
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Club</TableHead>
                    <TableHead>Parent Org</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClubs.map((club) => (
                    <TableRow 
                      key={club.id}
                      className={onSelectClub ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={() => onSelectClub?.(club.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className={`font-medium ${onSelectClub ? "hover:text-primary" : ""}`}>{club.name}</p>
                            <p className="text-xs text-muted-foreground">/{club.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {club.parent_org ? (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5 text-primary" />
                            {club.parent_org.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {club.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {club.member_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        {club.suspended_at ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Suspended
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(club.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedClub(club);
                              setShowSocialChairModal(true);
                            }}
                            title="Assign Social Chair"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedClub(club);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Club"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Club</DialogTitle>
            <DialogDescription>
              Add a new club under an enterprise organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Club Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., GBAT - Graduate Business Association"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., gbat"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the club"
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Organization</Label>
              <Select
                value={formData.parent_org_id}
                onValueChange={(value) => setFormData({ ...formData, parent_org_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent organization" />
                </SelectTrigger>
                <SelectContent>
                  {umbrellaOrgs?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Club Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student_org">Student Organization</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="athletic">Athletic</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createClubMutation.mutate(formData)}
              disabled={!formData.name || createClubMutation.isPending}
            >
              {createClubMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Club
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Club</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedClub?.name}</strong>?
              This will remove all members and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedClub && deleteClubMutation.mutate(selectedClub.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Club
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Social Chair Modal */}
      <Dialog open={showSocialChairModal} onOpenChange={setShowSocialChairModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Social Chair</DialogTitle>
            <DialogDescription>
              Grant social chair admin access for <strong>{selectedClub?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User Email or ID</Label>
              <Input
                value={socialChairEmail}
                onChange={(e) => setSocialChairEmail(e.target.value)}
                placeholder="Enter user email or user ID"
              />
              <p className="text-xs text-muted-foreground">
                The user must already have an account to be assigned as social chair
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSocialChairModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedClub && assignSocialChairMutation.mutate({
                clubId: selectedClub.id,
                email: socialChairEmail
              })}
              disabled={!socialChairEmail || assignSocialChairMutation.isPending}
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
