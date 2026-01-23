import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Copy, Plus, Link2, Users, Shield, Sparkles, BarChart3, Download, ExternalLink } from 'lucide-react';

type InviteCodeType = 'admin' | 'tester' | 'early_access';

interface InviteCode {
  id: string;
  code: string;
  type: InviteCodeType;
  label: string | null;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  notes: string | null;
}

interface Redemption {
  id: string;
  code_id: string;
  user_id: string;
  redeemed_at: string;
  referral_source: string | null;
  invite_codes: { code: string; type: InviteCodeType; label: string | null } | null;
  profiles: { display_name: string; email: string | null } | null;
}

export function InviteCodesManager() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState<{
    type: InviteCodeType;
    label: string;
    max_uses: string;
    expires_days: string;
    notes: string;
  }>({
    type: 'tester',
    label: '',
    max_uses: '',
    expires_days: '',
    notes: '',
  });

  // Fetch invite codes
  const { data: codes, isLoading: codesLoading } = useQuery({
    queryKey: ['invite-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InviteCode[];
    },
  });

  // Fetch redemptions with user info
  const { data: redemptions, isLoading: redemptionsLoading } = useQuery({
    queryKey: ['invite-redemptions'],
    queryFn: async () => {
      // First get redemptions with invite codes
      const { data: redemptionData, error } = await supabase
        .from('invite_redemptions')
        .select(`
          *,
          invite_codes(code, type, label)
        `)
        .order('redeemed_at', { ascending: false });
      if (error) throw error;
      
      // Then get profiles for each user
      const userIds = [...new Set(redemptionData.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return redemptionData.map(r => ({
        ...r,
        profiles: profileMap.get(r.user_id) || null,
      })) as Redemption[];
    },
  });

  // Generate new code
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('generate_invite_code', {
        p_type: newCode.type,
        p_label: newCode.label || null,
        p_max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null,
        p_expires_days: newCode.expires_days ? parseInt(newCode.expires_days) : null,
        p_notes: newCode.notes || null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (code) => {
      toast.success(`Invite code created: ${code}`);
      queryClient.invalidateQueries({ queryKey: ['invite-codes'] });
      setIsCreateOpen(false);
      setNewCode({ type: 'tester', label: '', max_uses: '', expires_days: '', notes: '' });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create code: ${error.message}`);
    },
  });

  // Toggle code active status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('invite_codes')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invite-codes'] });
      toast.success('Code status updated');
    },
  });

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}/auth?invite=${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied to clipboard');
  };

  const copyCodeOnly = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  // Analytics
  const adminCodes = codes?.filter(c => c.type === 'admin') || [];
  const testerCodes = codes?.filter(c => c.type === 'tester') || [];
  const earlyCodes = codes?.filter(c => c.type === 'early_access') || [];
  const totalRedemptions = redemptions?.length || 0;
  const activeCodesCount = codes?.filter(c => c.is_active).length || 0;

  const getTypeIcon = (type: InviteCodeType) => {
    switch (type) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'tester': return <Users className="h-4 w-4" />;
      case 'early_access': return <Sparkles className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: InviteCodeType) => {
    switch (type) {
      case 'admin': return 'destructive';
      case 'tester': return 'default';
      case 'early_access': return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Codes</CardDescription>
            <CardTitle className="text-2xl">{activeCodesCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Redemptions</CardDescription>
            <CardTitle className="text-2xl">{totalRedemptions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Admin Codes</CardDescription>
            <CardTitle className="text-2xl">{adminCodes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tester Codes</CardDescription>
            <CardTitle className="text-2xl">{testerCodes.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="codes" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="codes">Invite Codes</TabsTrigger>
            <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
          </TabsList>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invite Code</DialogTitle>
                <DialogDescription>
                  Generate a new invite code for users to join OpenClique.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Code Type</Label>
                  <Select
                    value={newCode.type}
                    onValueChange={(v) => setNewCode({ ...newCode, type: v as InviteCodeType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin - Full admin access
                        </div>
                      </SelectItem>
                      <SelectItem value="tester">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Tester - Pilot tester access
                        </div>
                      </SelectItem>
                      <SelectItem value="early_access">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Early Access - General early access
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Label (optional)</Label>
                  <Input
                    placeholder="e.g., Cofounder, UT Austin Batch 1"
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
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Internal notes about this code..."
                    value={newCode.notes}
                    onChange={(e) => setNewCode({ ...newCode, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                  {generateMutation.isPending ? 'Generating...' : 'Generate Code'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="codes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Invite Codes</CardTitle>
              <CardDescription>Manage invite codes and copy shareable links</CardDescription>
            </CardHeader>
            <CardContent>
              {codesLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : codes?.length === 0 ? (
                <p className="text-muted-foreground">No invite codes yet. Create one to get started.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
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
                        <TableCell>
                          <Badge variant={getTypeBadgeVariant(code.type)} className="flex items-center gap-1 w-fit">
                            {getTypeIcon(code.type)}
                            {code.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{code.label || '—'}</TableCell>
                        <TableCell>
                          {code.uses_count}
                          {code.max_uses && ` / ${code.max_uses}`}
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
                          <div className="flex items-center gap-2">
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
        </TabsContent>

        <TabsContent value="redemptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Redemption History</CardTitle>
              <CardDescription>Track who has used invite codes</CardDescription>
            </CardHeader>
            <CardContent>
              {redemptionsLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : redemptions?.length === 0 ? (
                <p className="text-muted-foreground">No redemptions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Code Used</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Redeemed At</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions?.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{r.profiles?.display_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{r.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {r.invite_codes?.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          {r.invite_codes?.type && (
                            <Badge variant={getTypeBadgeVariant(r.invite_codes.type)}>
                              {r.invite_codes.type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{r.invite_codes?.label || '—'}</TableCell>
                        <TableCell>{format(new Date(r.redeemed_at), 'MMM d, yyyy h:mm a')}</TableCell>
                        <TableCell>{r.referral_source || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}