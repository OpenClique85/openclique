/**
 * =============================================================================
 * InviteCodesTab - Club Invite Code Management
 * =============================================================================
 * 
 * Allows Social Chairs to generate, manage, and track invite codes for their club.
 * Codes can be configured with usage limits, expiration, and auto-role assignment.
 * 
 * ## Features
 * 
 * - **Generate Codes**: Create 8-character alphanumeric codes
 * - **Usage Tracking**: Monitor how many times each code has been redeemed
 * - **Expiration**: Set optional expiry dates
 * - **Role Assignment**: Auto-assign member or social_chair role on redemption
 * - **Toggle Active**: Enable/disable codes without deletion
 * 
 * ## Data Flow
 * 
 * ```
 * InviteCodesTab
 *   ├── Query: org_invite_codes (fetch existing codes)
 *   ├── Mutation: insert org_invite_codes (create new)
 *   └── Mutation: update org_invite_codes (toggle active)
 * ```
 * 
 * ## Related
 * - `@/pages/Auth` - Code redemption during signup
 * - `@/components/enterprise/ClubDetailView` - Admin view of codes
 * 
 * @module clubs/InviteCodesTab
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Ticket, Copy, Link2, Plus, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// -----------------------------------------------------------------------------
// TYPE DEFINITIONS
// -----------------------------------------------------------------------------

/**
 * Props for the InviteCodesTab component
 */
interface InviteCodesTabProps {
  /** UUID of the club/organization */
  clubId: string;
  /** Display name of the club (for UI labels) */
  clubName: string;
}

/**
 * Shape of an invite code record from the org_invite_codes table
 */
interface OrgInviteCode {
  id: string;
  org_id: string;
  code: string;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  /** Human-readable label (e.g., "Spring 2026 Cohort") */
  label: string | null;
  /** Role to auto-assign on redemption: 'member' | 'social_chair' */
  auto_assign_role: string | null;
}

export function InviteCodesTab({ clubId, clubName }: InviteCodesTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState({
    label: '',
    max_uses: '',
    expires_days: '',
    auto_assign_role: 'member',
  });

  // Fetch org invite codes
  const { data: codes, isLoading } = useQuery({
    queryKey: ['org-invite-codes', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_invite_codes')
        .select('*')
        .eq('org_id', clubId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OrgInviteCode[];
    },
  });

  // Generate random code
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Create new code mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const code = generateRandomCode();
      const expiresAt = newCode.expires_days 
        ? new Date(Date.now() + parseInt(newCode.expires_days) * 24 * 60 * 60 * 1000).toISOString()
        : null;
      
      const { data, error } = await supabase
        .from('org_invite_codes')
        .insert({
          org_id: clubId,
          code,
          created_by: user.id,
          expires_at: expiresAt,
          max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null,
          label: newCode.label || null,
          auto_assign_role: newCode.auto_assign_role as any,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Invite code created: ${data.code}`);
      queryClient.invalidateQueries({ queryKey: ['org-invite-codes', clubId] });
      setIsCreateOpen(false);
      setNewCode({ label: '', max_uses: '', expires_days: '', auto_assign_role: 'member' });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create code: ${error.message}`);
    },
  });

  // Toggle code active status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('org_invite_codes')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-invite-codes', clubId] });
      toast.success('Code status updated');
    },
  });

  const getInviteUrl = (code: string) => {
    return `${window.location.origin}/auth?club=${code}`;
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(getInviteUrl(code));
    toast.success('Invite link copied!');
  };

  const copyCodeOnly = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  const activeCodesCount = codes?.filter(c => c.is_active).length || 0;
  const totalRedemptions = codes?.reduce((sum, c) => sum + c.uses_count, 0) || 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Ticket className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{codes?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                <Ticket className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCodesCount}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRedemptions}</p>
                <p className="text-xs text-muted-foreground">Redeemed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Club Invite Codes
            </CardTitle>
            <CardDescription>
              Generate and manage invite codes for {clubName}
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Code
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : codes?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invite codes yet</p>
              <p className="text-sm mt-1">Create one to invite members</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes?.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {code.code}
                      </code>
                    </TableCell>
                    <TableCell>{code.label || '—'}</TableCell>
                    <TableCell>
                      {code.uses_count}
                      {code.max_uses && ` / ${code.max_uses}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {code.auto_assign_role || 'member'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {code.expires_at
                        ? format(new Date(code.expires_at), 'MMM d, yyyy')
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={code.is_active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: code.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCodeOnly(code.code)}
                          title="Copy code"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                          title="Copy invite link"
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Code Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invite Code</DialogTitle>
            <DialogDescription>
              Generate a new invite code for {clubName} members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input
                placeholder="e.g., Spring 2026 Cohort"
                value={newCode.label}
                onChange={(e) => setNewCode({ ...newCode, label: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Uses (optional)</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={newCode.max_uses}
                  onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expires In (days)</Label>
                <Input
                  type="number"
                  placeholder="Never"
                  value={newCode.expires_days}
                  onChange={(e) => setNewCode({ ...newCode, expires_days: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Auto-Assign Role</Label>
              <select
                value={newCode.auto_assign_role}
                onChange={(e) => setNewCode({ ...newCode, auto_assign_role: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="member">Member</option>
                <option value="social_chair">Social Chair</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Role automatically assigned when code is redeemed
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
