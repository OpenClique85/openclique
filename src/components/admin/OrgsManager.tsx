/**
 * OrgsManager - Admin component for managing organizations
 * Approve/reject orgs, view members, manage settings
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { auditLog } from '@/lib/auditLog';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Copy,
  ExternalLink,
  Shield,
  GraduationCap,
  Plus,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Tables, Enums } from '@/integrations/supabase/types';

type Organization = Tables<'organizations'>;
type OrgType = Enums<'organization_type'>;

interface OrgWithMembers extends Organization {
  member_count?: number;
}

interface OrgMember {
  profile_id: string;
  role: string;
  joined_at: string;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

const ORG_TYPE_LABELS: Record<OrgType, string> = {
  university: '🎓 University',
  fraternity: '🏛️ Fraternity',
  sorority: '🌸 Sorority',
  club: '🎯 Club',
  company: '🏢 Company',
  nonprofit: '💚 Nonprofit',
  other: '📦 Other',
};

export function OrgsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<OrgWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<OrgWithMembers | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'umbrellas' | 'clubs'>('all');
  const [umbrellaOrgs, setUmbrellaOrgs] = useState<OrgWithMembers[]>([]);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'club' as OrgType,
    school_affiliation: '',
    description: '',
    contact_email: '',
    website_url: '',
    primary_color: '#14B8A6',
    is_verified: false,
    is_active: true,
    is_umbrella: false,
    parent_org_id: '' as string,
    verified_domains: [] as string[],
  });

  const fetchOrgs = async () => {
    setIsLoading(true);
    
    // Fetch orgs with member counts
    const { data: orgsData, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error loading organizations', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    // Get member counts for each org
    const orgsWithCounts: OrgWithMembers[] = await Promise.all(
      (orgsData || []).map(async (org) => {
        const { count } = await supabase
          .from('profile_organizations')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', org.id);
        
        return { ...org, member_count: count || 0 };
      })
    );

    setOrgs(orgsWithCounts);
    setUmbrellaOrgs(orgsWithCounts.filter(o => o.is_umbrella));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgMembers = async (orgId: string) => {
    const { data, error } = await supabase
      .from('profile_organizations')
      .select(`
        profile_id,
        role,
        joined_at,
        profile:profiles(display_name, email)
      `)
      .eq('org_id', orgId)
      .order('joined_at', { ascending: false });

    if (!error && data) {
      setOrgMembers(data as unknown as OrgMember[]);
    }
  };

  const handleViewMembers = async (org: OrgWithMembers) => {
    setSelectedOrg(org);
    await fetchOrgMembers(org.id);
    setShowMembersModal(true);
  };

  const handleEditOrg = (org: OrgWithMembers) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      slug: org.slug,
      type: org.type,
      school_affiliation: org.school_affiliation || '',
      description: org.description || '',
      contact_email: org.contact_email || '',
      website_url: org.website_url || '',
      primary_color: org.primary_color || '#14B8A6',
      is_verified: org.is_verified,
      is_active: org.is_active,
      is_umbrella: org.is_umbrella || false,
      parent_org_id: org.parent_org_id || '',
      verified_domains: (org.verified_domains as string[]) || [],
    });
    setShowEditModal(true);
  };

  const handleCreateOrg = () => {
    setSelectedOrg(null);
    setFormData({
      name: '',
      slug: '',
      type: 'club',
      school_affiliation: '',
      description: '',
      contact_email: '',
      website_url: '',
      primary_color: '#14B8A6',
      is_verified: false,
      is_active: true,
      is_umbrella: false,
      parent_org_id: '',
      verified_domains: [],
    });
    setShowCreateModal(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSaveOrg = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    const slug = formData.slug || generateSlug(formData.name);

    if (selectedOrg) {
      // Update existing org
      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          slug,
          type: formData.type,
          school_affiliation: formData.school_affiliation || null,
          description: formData.description || null,
          contact_email: formData.contact_email || null,
          website_url: formData.website_url || null,
          primary_color: formData.primary_color,
          is_verified: formData.is_verified,
          is_active: formData.is_active,
          is_umbrella: formData.is_umbrella,
          parent_org_id: formData.parent_org_id || null,
          verified_domains: formData.verified_domains.length > 0 ? formData.verified_domains : null,
        })
        .eq('id', selectedOrg.id);

      if (error) {
        toast({ title: 'Failed to update organization', variant: 'destructive' });
        return;
      }

      await auditLog({
        action: 'org_updated',
        targetTable: 'organization',
        targetId: selectedOrg.id,
        newValues: { name: formData.name, is_verified: formData.is_verified },
      });

      toast({ title: 'Organization updated!' });
    } else {
      // Create new org
      const { error } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          slug,
          type: formData.type,
          school_affiliation: formData.school_affiliation || null,
          description: formData.description || null,
          contact_email: formData.contact_email || null,
          website_url: formData.website_url || null,
          primary_color: formData.primary_color,
          is_verified: formData.is_verified,
          is_active: formData.is_active,
          is_umbrella: formData.is_umbrella,
          parent_org_id: formData.parent_org_id || null,
          verified_domains: formData.verified_domains.length > 0 ? formData.verified_domains : null,
        });

      if (error) {
        toast({ title: 'Failed to create organization', variant: 'destructive' });
        return;
      }

      await auditLog({
        action: 'org_created',
        targetTable: 'organization',
        targetId: 'new',
        newValues: { name: formData.name, slug },
      });

      toast({ title: 'Organization created!' });
    }

    setShowEditModal(false);
    setShowCreateModal(false);
    fetchOrgs();
  };

  const handleToggleVerified = async (org: OrgWithMembers) => {
    const newStatus = !org.is_verified;
    
    const { error } = await supabase
      .from('organizations')
      .update({ is_verified: newStatus })
      .eq('id', org.id);

    if (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
      return;
    }

    await auditLog({
      action: newStatus ? 'org_verified' : 'org_unverified',
      targetTable: 'organization',
      targetId: org.id,
      newValues: { name: org.name },
    });

    toast({ 
      title: newStatus ? 'Organization verified!' : 'Verification removed',
      description: org.name,
    });
    fetchOrgs();
  };

  const handleCopyInviteLink = (org: OrgWithMembers) => {
    const link = `${window.location.origin}/org/${org.slug}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Invite link copied!' });
  };

  const handleRemoveMember = async (profileId: string) => {
    if (!selectedOrg) return;

    const { error } = await supabase
      .from('profile_organizations')
      .delete()
      .eq('org_id', selectedOrg.id)
      .eq('profile_id', profileId);

    if (error) {
      toast({ title: 'Failed to remove member', variant: 'destructive' });
      return;
    }

    await auditLog({
      action: 'org_member_removed',
      targetTable: 'profile_organizations',
      targetId: profileId,
      newValues: { org_id: selectedOrg.id },
    });

    toast({ title: 'Member removed' });
    fetchOrgMembers(selectedOrg.id);
    fetchOrgs();
  };

  const handleUpdateMemberRole = async (profileId: string, newRole: string) => {
    if (!selectedOrg) return;

    const { error } = await supabase
      .from('profile_organizations')
      .update({ role: newRole as 'member' | 'admin' | 'creator' })
      .eq('org_id', selectedOrg.id)
      .eq('profile_id', profileId);

    if (error) {
      toast({ title: 'Failed to update role', variant: 'destructive' });
      return;
    }

    await auditLog({
      action: 'org_member_role_changed',
      targetTable: 'profile_organizations',
      targetId: profileId,
      newValues: { org_id: selectedOrg.id, new_role: newRole },
    });

    toast({ title: 'Role updated' });
    fetchOrgMembers(selectedOrg.id);
  };

  const filteredOrgs = orgs.filter(org => {
    if (filter === 'verified') return org.is_verified;
    if (filter === 'pending') return !org.is_verified;
    if (filter === 'umbrellas') return org.is_umbrella;
    if (filter === 'clubs') return !!org.parent_org_id;
    return true;
  });

  // Get parent org name helper
  const getParentOrgName = (parentOrgId: string | null) => {
    if (!parentOrgId) return null;
    const parent = orgs.find(o => o.id === parentOrgId);
    return parent?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Organizations</h2>
          <p className="text-muted-foreground">
            Manage university orgs, clubs, and partner organizations
          </p>
        </div>
        <Button onClick={handleCreateOrg}>
          <Plus className="h-4 w-4 mr-2" />
          Add Organization
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{orgs.length}</p>
                <p className="text-sm text-muted-foreground">Total Orgs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{orgs.filter(o => o.is_verified).length}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-[#BF5700]" />
              <div>
                <p className="text-2xl font-bold">
                  {orgs.filter(o => o.school_affiliation === 'ut_austin').length}
                </p>
                <p className="text-sm text-muted-foreground">UT Austin Orgs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {orgs.reduce((sum, o) => sum + (o.member_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'umbrellas' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('umbrellas')}
        >
          🏛️ Umbrellas
        </Button>
        <Button
          variant={filter === 'clubs' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('clubs')}
        >
          🎯 Clubs
        </Button>
        <Button
          variant={filter === 'verified' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('verified')}
        >
          Verified
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
      </div>

      {/* Orgs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: org.primary_color || '#14B8A6' }}
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="font-medium">{org.name}</p>
                          {org.is_umbrella && (
                            <Badge variant="outline" className="text-xs">🏛️</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">/{org.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {ORG_TYPE_LABELS[org.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {org.parent_org_id ? (
                      <Badge variant="secondary" className="text-xs">
                        {getParentOrgName(org.parent_org_id)}
                      </Badge>
                    ) : org.is_umbrella ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Independent</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{org.member_count || 0}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {org.is_verified ? (
                        <Badge className="bg-green-500">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      {!org.is_active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewMembers(org)}
                        title="View Members"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditOrg(org)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyInviteLink(org)}
                        title="Copy Invite Link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/org/${org.slug}`, '_blank')}
                        title="View Portal"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={org.is_verified ? 'ghost' : 'default'}
                        size="sm"
                        onClick={() => handleToggleVerified(org)}
                      >
                        {org.is_verified ? (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Unverify
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrgs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No organizations found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Modal */}
      <Dialog open={showEditModal || showCreateModal} onOpenChange={(open) => {
        if (!open) {
          setShowEditModal(false);
          setShowCreateModal(false);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedOrg ? 'Edit Organization' : 'Create Organization'}
            </DialogTitle>
            <DialogDescription>
              {selectedOrg ? 'Update organization details and settings' : 'Add a new organization'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: prev.slug || generateSlug(e.target.value),
                    }));
                  }}
                  placeholder="Organization name"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as OrgType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORG_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>School Affiliation</Label>
                <Select
                  value={formData.school_affiliation || 'none'}
                  onValueChange={(v) => setFormData(prev => ({ 
                    ...prev, 
                    school_affiliation: v === 'none' ? '' : v 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select school..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="ut_austin">🤘 UT Austin</SelectItem>
                    <SelectItem value="texas_state">Texas State</SelectItem>
                    <SelectItem value="st_edwards">St. Edward's</SelectItem>
                    <SelectItem value="acc">Austin CC</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
            </div>

            {/* Umbrella & Parent Org */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_umbrella}
                    onCheckedChange={(v) => setFormData(prev => ({ 
                      ...prev, 
                      is_umbrella: v,
                      parent_org_id: v ? '' : prev.parent_org_id 
                    }))}
                  />
                  <Label>Umbrella Organization</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Umbrellas have child clubs and rollup analytics
                </p>
              </div>
              {!formData.is_umbrella && (
                <div className="space-y-2">
                  <Label>Parent Organization</Label>
                  <Select
                    value={formData.parent_org_id || 'none'}
                    onValueChange={(v) => setFormData(prev => ({ 
                      ...prev, 
                      parent_org_id: v === 'none' ? '' : v 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Independent)</SelectItem>
                      {umbrellaOrgs.map((uo) => (
                        <SelectItem key={uo.id} value={uo.id}>
                          🏛️ {uo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Verified Domains */}
            <div className="space-y-2">
              <Label>Verified Domains (one per line)</Label>
              <Textarea
                value={formData.verified_domains.join('\n')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  verified_domains: e.target.value.split('\n').filter(d => d.trim()) 
                }))}
                placeholder="utexas.edu&#10;mba.utexas.edu"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Users with these email domains can auto-join
              </p>
            </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the organization"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="contact@org.edu"
                />
              </div>
              <div className="space-y-2">
                <Label>Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_verified}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_verified: v }))}
                />
                <Label>Verified Organization</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditModal(false);
              setShowCreateModal(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveOrg}>
              {selectedOrg ? 'Save Changes' : 'Create Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members Modal */}
      <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedOrg?.name} - Members ({orgMembers.length})
            </DialogTitle>
            <DialogDescription>
              Manage organization members and their roles
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgMembers.map((member) => (
                  <TableRow key={member.profile_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {member.profile?.display_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.profile?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(v) => handleUpdateMemberRole(member.profile_id, v)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="social_chair">Social Chair</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="creator">Creator</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {format(new Date(member.joined_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.profile_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {orgMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No members yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMembersModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
