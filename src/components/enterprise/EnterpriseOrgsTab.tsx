/**
 * EnterpriseOrgsTab - Manage umbrella organizations
 * 
 * Features:
 * - List all umbrella organizations
 * - Create new umbrella orgs
 * - Edit org details
 * - Suspend/unsuspend orgs
 * - View aggregate stats
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
  GraduationCap, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Building2,
  Users,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UmbrellaOrg {
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
  child_count?: number;
  member_count?: number;
}

export function EnterpriseOrgsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<UmbrellaOrg | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    school_affiliation: '',
    verified_domains: '',
    is_verified: false,
  });

  // Fetch umbrella organizations
  const { data: orgs, isLoading } = useQuery({
    queryKey: ['enterprise-umbrella-orgs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_umbrella', true)
        .order('name');

      if (error) throw error;

      // Get counts for each org
      const orgsWithCounts = await Promise.all(
        (data || []).map(async (org) => {
          const { count: childCount } = await supabase
            .from('organizations')
            .select('*', { count: 'exact', head: true })
            .eq('parent_org_id', org.id);

          const { count: memberCount } = await supabase
            .from('profile_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id);

          return {
            ...org,
            child_count: childCount || 0,
            member_count: memberCount || 0,
          };
        })
      );

      return orgsWithCounts as UmbrellaOrg[];
    },
  });

  // Create org mutation
  const createOrgMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('organizations').insert({
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        description: data.description || null,
        school_affiliation: data.school_affiliation || null,
        verified_domains: data.verified_domains ? data.verified_domains.split(',').map(d => d.trim()) : [],
        is_verified: data.is_verified,
        is_umbrella: true,
        type: 'university',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-umbrella-orgs'] });
      setShowCreateModal(false);
      resetForm();
      toast.success('Organization created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create organization: ' + error.message);
    },
  });

  // Update org mutation
  const updateOrgMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          school_affiliation: data.school_affiliation || null,
          verified_domains: data.verified_domains ? data.verified_domains.split(',').map(d => d.trim()) : [],
          is_verified: data.is_verified,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-umbrella-orgs'] });
      setShowEditModal(false);
      setSelectedOrg(null);
      resetForm();
      toast.success('Organization updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update organization: ' + error.message);
    },
  });

  // Suspend org mutation
  const suspendOrgMutation = useMutation({
    mutationFn: async ({ orgId, suspend, reason }: { orgId: string; suspend: boolean; reason?: string }) => {
      const { error } = await supabase
        .from('organizations')
        .update({
          suspended_at: suspend ? new Date().toISOString() : null,
          suspend_reason: suspend ? reason : null,
          suspended_by: suspend ? user?.id : null,
        })
        .eq('id', orgId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-umbrella-orgs'] });
      setShowSuspendModal(false);
      setSelectedOrg(null);
      setSuspendReason('');
      toast.success(variables.suspend ? 'Organization suspended' : 'Organization reactivated');
    },
    onError: (error) => {
      toast.error('Failed to update organization status: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      school_affiliation: '',
      verified_domains: '',
      is_verified: false,
    });
  };

  const handleEdit = (org: UmbrellaOrg) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      slug: org.slug,
      description: org.description || '',
      school_affiliation: org.school_affiliation || '',
      verified_domains: (org.verified_domains || []).join(', '),
      is_verified: org.is_verified,
    });
    setShowEditModal(true);
  };

  const handleSuspend = (org: UmbrellaOrg) => {
    setSelectedOrg(org);
    setSuspendReason('');
    setShowSuspendModal(true);
  };

  const filteredOrgs = orgs?.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.school_affiliation?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Enterprise Organizations</h2>
          <p className="text-muted-foreground text-sm">
            Manage umbrella organizations like universities and large institutions
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Organization
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search organizations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Organizations Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No Organizations Found</h3>
              <p className="text-muted-foreground text-sm">
                Create your first enterprise organization to get started
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Affiliation</TableHead>
                    <TableHead>Clubs</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <GraduationCap className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{org.name}</p>
                            <p className="text-xs text-muted-foreground">/{org.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.school_affiliation || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {org.child_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {org.member_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.suspended_at ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Suspended
                          </Badge>
                        ) : org.is_verified ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(org.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(org)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSuspend(org)}
                          >
                            {org.suspended_at ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                            )}
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
            <DialogTitle>Create Enterprise Organization</DialogTitle>
            <DialogDescription>
              Add a new umbrella organization like a university or large institution
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., University of Texas at Austin"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., ut-austin"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the organization"
              />
            </div>
            <div className="space-y-2">
              <Label>School Affiliation</Label>
              <Input
                value={formData.school_affiliation}
                onChange={(e) => setFormData({ ...formData, school_affiliation: e.target.value })}
                placeholder="e.g., UT Austin"
              />
            </div>
            <div className="space-y-2">
              <Label>Verified Domains (comma-separated)</Label>
              <Input
                value={formData.verified_domains}
                onChange={(e) => setFormData({ ...formData, verified_domains: e.target.value })}
                placeholder="e.g., utexas.edu, austin.utexas.edu"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_verified}
                onCheckedChange={(checked) => setFormData({ ...formData, is_verified: checked })}
              />
              <Label>Mark as Verified</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createOrgMutation.mutate(formData)}
              disabled={!formData.name || createOrgMutation.isPending}
            >
              {createOrgMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>School Affiliation</Label>
              <Input
                value={formData.school_affiliation}
                onChange={(e) => setFormData({ ...formData, school_affiliation: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Verified Domains (comma-separated)</Label>
              <Input
                value={formData.verified_domains}
                onChange={(e) => setFormData({ ...formData, verified_domains: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_verified}
                onCheckedChange={(checked) => setFormData({ ...formData, is_verified: checked })}
              />
              <Label>Verified Organization</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedOrg && updateOrgMutation.mutate({ ...formData, id: selectedOrg.id })}
              disabled={!formData.name || updateOrgMutation.isPending}
            >
              {updateOrgMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Modal */}
      <AlertDialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedOrg?.suspended_at ? 'Reactivate Organization' : 'Suspend Organization'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedOrg?.suspended_at ? (
                <>This will reactivate <strong>{selectedOrg?.name}</strong> and allow normal operations.</>
              ) : (
                <>
                  This will suspend <strong>{selectedOrg?.name}</strong> and prevent all operations.
                  <div className="mt-4">
                    <Label>Reason for suspension</Label>
                    <Textarea
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="Enter reason for suspension..."
                      className="mt-2"
                    />
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedOrg && suspendOrgMutation.mutate({
                orgId: selectedOrg.id,
                suspend: !selectedOrg.suspended_at,
                reason: suspendReason
              })}
              className={selectedOrg?.suspended_at ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
            >
              {selectedOrg?.suspended_at ? 'Reactivate' : 'Suspend Organization'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
