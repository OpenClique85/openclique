/**
 * TierAccountsView - View and manage tier accounts (separate payers)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Building2, Briefcase, GraduationCap, Users, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePilotMode } from "@/hooks/usePilotMode";

interface Organization {
  id: string;
  name: string;
  account_tier: string | null;
  enterprise_type: string | null;
  billing_status: string | null;
  pricing_model: string | null;
  price_per_seat: number | null;
  price_per_cohort: number | null;
  annual_commit: number | null;
  seat_cap: number | null;
  cohort_cap: number | null;
  estimated_arr: number | null;
  billing_contact_email: string | null;
  contract_notes: string | null;
}

export function TierAccountsView() {
  const queryClient = useQueryClient();
  const { getBillingStatusLabel, getBillingStatusColor } = usePilotMode();
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Fetch organizations with billing info
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['tier-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, account_tier, enterprise_type, billing_status, pricing_model, price_per_seat, price_per_cohort, annual_commit, seat_cap, cohort_cap, estimated_arr, billing_contact_email, contract_notes')
        .not('account_tier', 'is', null)
        .order('estimated_arr', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data as Organization[];
    },
  });

  // Update organization mutation
  const updateOrgMutation = useMutation({
    mutationFn: async (org: Organization) => {
      const { error } = await supabase
        .from('organizations')
        .update({
          account_tier: org.account_tier as any,
          enterprise_type: org.enterprise_type as any,
          billing_status: org.billing_status as any,
          pricing_model: org.pricing_model as any,
          price_per_seat: org.price_per_seat,
          price_per_cohort: org.price_per_cohort,
          annual_commit: org.annual_commit,
          seat_cap: org.seat_cap,
          cohort_cap: org.cohort_cap,
          estimated_arr: org.estimated_arr,
          billing_contact_email: org.billing_contact_email,
          contract_notes: org.contract_notes,
        })
        .eq('id', org.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tier-accounts'] });
      setEditingOrg(null);
      toast.success('Account updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const getTierIcon = (tier: string | null, enterpriseType: string | null) => {
    if (tier === 'city') return <Building2 className="h-4 w-4 text-blue-500" />;
    if (tier === 'enterprise' && enterpriseType === 'university') return <GraduationCap className="h-4 w-4 text-violet-500" />;
    if (tier === 'enterprise') return <Briefcase className="h-4 w-4 text-indigo-500" />;
    return <Users className="h-4 w-4 text-emerald-500" />;
  };

  const getTierLabel = (tier: string | null, enterpriseType: string | null) => {
    if (tier === 'city') return 'City';
    if (tier === 'enterprise' && enterpriseType === 'university') return 'University';
    if (tier === 'enterprise' && enterpriseType === 'company') return 'Business';
    if (tier === 'enterprise') return 'Enterprise';
    return 'Organization';
  };

  const filteredOrgs = organizations?.filter(org => {
    if (filter === 'all') return true;
    if (filter === 'city') return org.account_tier === 'city';
    if (filter === 'enterprise') return org.account_tier === 'enterprise';
    if (filter === 'organization') return org.account_tier === 'organization';
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tier Accounts</h2>
          <p className="text-muted-foreground">Manage billing entities - each account is a separate payer</p>
        </div>
        
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="city">City</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
            <SelectItem value="organization">Organization</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Billing Status</TableHead>
                <TableHead>Pricing Model</TableHead>
                <TableHead className="text-right">Est. ARR</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrgs?.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTierIcon(org.account_tier, org.enterprise_type)}
                      <span>{getTierLabel(org.account_tier, org.enterprise_type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getBillingStatusColor(org.billing_status)}
                    >
                      {getBillingStatusLabel(org.billing_status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {org.pricing_model ? (
                      <span className="capitalize">{org.pricing_model.replace('_', ' ')}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {org.estimated_arr ? `$${org.estimated_arr.toLocaleString()}` : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingOrg(org)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {(!filteredOrgs || filteredOrgs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No tier accounts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingOrg} onOpenChange={() => setEditingOrg(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Account: {editingOrg?.name}</DialogTitle>
            <DialogDescription>Configure billing and pricing for this tenant</DialogDescription>
          </DialogHeader>
          
          {editingOrg && (
            <div className="space-y-4 mt-4">
              {/* Tier & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Tier</Label>
                  <Select 
                    value={editingOrg.account_tier || ''} 
                    onValueChange={(v) => setEditingOrg({ ...editingOrg, account_tier: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="city">City</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="organization">Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {editingOrg.account_tier === 'enterprise' && (
                  <div className="space-y-2">
                    <Label>Enterprise Type</Label>
                    <Select 
                      value={editingOrg.enterprise_type || ''} 
                      onValueChange={(v) => setEditingOrg({ ...editingOrg, enterprise_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="university">University</SelectItem>
                        <SelectItem value="military">Military</SelectItem>
                        <SelectItem value="program">Program</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Billing Status */}
              <div className="space-y-2">
                <Label>Billing Status</Label>
                <Select 
                  value={editingOrg.billing_status || ''} 
                  onValueChange={(v) => setEditingOrg({ ...editingOrg, billing_status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pilot_active">Pilot (Active)</SelectItem>
                    <SelectItem value="negotiating">Negotiating</SelectItem>
                    <SelectItem value="converted">Converted (Paying)</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pricing Model */}
              <div className="space-y-2">
                <Label>Pricing Model</Label>
                <Select 
                  value={editingOrg.pricing_model || ''} 
                  onValueChange={(v) => setEditingOrg({ ...editingOrg, pricing_model: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_seat">Per Seat</SelectItem>
                    <SelectItem value="per_cohort">Per Cohort</SelectItem>
                    <SelectItem value="annual_platform">Annual Platform</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pricing Values */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price Per Seat ($)</Label>
                  <Input
                    type="number"
                    value={editingOrg.price_per_seat || ''}
                    onChange={(e) => setEditingOrg({ 
                      ...editingOrg, 
                      price_per_seat: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder="e.g., 12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price Per Cohort ($)</Label>
                  <Input
                    type="number"
                    value={editingOrg.price_per_cohort || ''}
                    onChange={(e) => setEditingOrg({ 
                      ...editingOrg, 
                      price_per_cohort: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder="e.g., 4000"
                  />
                </div>
              </div>

              {/* Caps */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Seat Cap</Label>
                  <Input
                    type="number"
                    value={editingOrg.seat_cap || ''}
                    onChange={(e) => setEditingOrg({ 
                      ...editingOrg, 
                      seat_cap: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cohort Cap</Label>
                  <Input
                    type="number"
                    value={editingOrg.cohort_cap || ''}
                    onChange={(e) => setEditingOrg({ 
                      ...editingOrg, 
                      cohort_cap: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              {/* Annual & ARR */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Commit ($)</Label>
                  <Input
                    type="number"
                    value={editingOrg.annual_commit || ''}
                    onChange={(e) => setEditingOrg({ 
                      ...editingOrg, 
                      annual_commit: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated ARR ($)</Label>
                  <Input
                    type="number"
                    value={editingOrg.estimated_arr || ''}
                    onChange={(e) => setEditingOrg({ 
                      ...editingOrg, 
                      estimated_arr: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <Label>Billing Contact Email</Label>
                <Input
                  type="email"
                  value={editingOrg.billing_contact_email || ''}
                  onChange={(e) => setEditingOrg({ 
                    ...editingOrg, 
                    billing_contact_email: e.target.value 
                  })}
                  placeholder="billing@company.com"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Contract Notes</Label>
                <Textarea
                  value={editingOrg.contract_notes || ''}
                  onChange={(e) => setEditingOrg({ 
                    ...editingOrg, 
                    contract_notes: e.target.value 
                  })}
                  placeholder="Internal notes about this contract..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditingOrg(null)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={() => updateOrgMutation.mutate(editingOrg)} 
                  disabled={updateOrgMutation.isPending}
                  className="flex-1"
                >
                  {updateOrgMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
