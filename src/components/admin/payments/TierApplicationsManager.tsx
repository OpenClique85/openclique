/**
 * TierApplicationsManager - Manage City/Enterprise applications
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, Briefcase, GraduationCap, Eye, Check, X, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface TierApplication {
  id: string;
  applicant_name: string;
  applicant_email: string;
  organization_name: string;
  tier: string;
  enterprise_type: string | null;
  city_name: string | null;
  estimated_population: number | null;
  estimated_headcount: number | null;
  use_case_description: string | null;
  demo_requested: boolean;
  demo_scheduled_at: string | null;
  status: string;
  created_at: string;
  notes: string | null;
}

export function TierApplicationsManager() {
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<TierApplication | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [actionNotes, setActionNotes] = useState('');

  const { data: applications, isLoading } = useQuery({
    queryKey: ['tier-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tier_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TierApplication[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString(),
      };
      if (notes) updateData.notes = notes;
      
      const { error } = await supabase
        .from('tier_applications')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tier-applications'] });
      setSelectedApp(null);
      setActionNotes('');
      toast.success('Application updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const getTierIcon = (tier: string, enterpriseType: string | null) => {
    if (tier === 'city') return <Building2 className="h-4 w-4 text-blue-500" />;
    if (tier === 'enterprise' && enterpriseType === 'university') return <GraduationCap className="h-4 w-4 text-violet-500" />;
    return <Briefcase className="h-4 w-4 text-indigo-500" />;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
      demo_scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      in_review: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      approved: 'bg-green-500/10 text-green-600 border-green-500/30',
      declined: 'bg-red-500/10 text-red-600 border-red-500/30',
      converted: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    };
    return styles[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/30';
  };

  const filteredApps = applications?.filter(app => {
    if (filter === 'all') return true;
    if (filter === 'pending') return app.status === 'pending';
    if (filter === 'city') return app.tier === 'city';
    if (filter === 'enterprise') return app.tier === 'enterprise';
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
          <h2 className="text-2xl font-bold">Tier Applications</h2>
          <p className="text-muted-foreground">Review City and Enterprise pilot applications</p>
        </div>
        
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending">Pending Only</SelectItem>
            <SelectItem value="city">City Only</SelectItem>
            <SelectItem value="enterprise">Enterprise Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Demo</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps?.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.organization_name}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{app.applicant_name}</p>
                      <p className="text-xs text-muted-foreground">{app.applicant_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTierIcon(app.tier, app.enterprise_type)}
                      <span className="capitalize">
                        {app.tier === 'enterprise' && app.enterprise_type 
                          ? app.enterprise_type 
                          : app.tier}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusBadge(app.status)}>
                      {app.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {app.demo_requested ? (
                      app.demo_scheduled_at ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          Scheduled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                          Requested
                        </Badge>
                      )
                    ) : (
                      <span className="text-muted-foreground text-sm">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(app.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedApp(app)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {(!filteredApps || filteredApps.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No applications found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedApp?.organization_name}</DialogTitle>
            <DialogDescription>
              {selectedApp?.tier === 'city' ? 'City' : 'Enterprise'} Application
            </DialogDescription>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-4 mt-4">
              {/* Contact Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Contact</h4>
                <p className="text-sm">{selectedApp.applicant_name}</p>
                <p className="text-sm text-muted-foreground">{selectedApp.applicant_email}</p>
              </div>

              {/* Tier Details */}
              <div className="grid grid-cols-2 gap-4">
                {selectedApp.tier === 'city' && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">City</p>
                      <p className="font-medium">{selectedApp.city_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Population</p>
                      <p className="font-medium">
                        {selectedApp.estimated_population?.toLocaleString() || '—'}
                      </p>
                    </div>
                  </>
                )}
                {selectedApp.tier === 'enterprise' && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{selectedApp.enterprise_type || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Headcount</p>
                      <p className="font-medium">
                        {selectedApp.estimated_headcount?.toLocaleString() || '—'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Use Case */}
              {selectedApp.use_case_description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Use Case</p>
                  <p className="text-sm">{selectedApp.use_case_description}</p>
                </div>
              )}

              {/* Existing Notes */}
              {selectedApp.notes && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Internal Notes</p>
                  <p className="text-sm">{selectedApp.notes}</p>
                </div>
              )}

              {/* Action Notes */}
              <div className="space-y-2">
                <Label>Add Notes</Label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Internal notes..."
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-green-500/30 text-green-600 hover:bg-green-500/10"
                  onClick={() => updateStatusMutation.mutate({ 
                    id: selectedApp.id, 
                    status: 'approved',
                    notes: actionNotes || undefined,
                  })}
                  disabled={updateStatusMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                  onClick={() => updateStatusMutation.mutate({ 
                    id: selectedApp.id, 
                    status: 'demo_scheduled',
                    notes: actionNotes || undefined,
                  })}
                  disabled={updateStatusMutation.isPending}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Demo
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-600 hover:bg-red-500/10"
                  onClick={() => updateStatusMutation.mutate({ 
                    id: selectedApp.id, 
                    status: 'declined',
                    notes: actionNotes || undefined,
                  })}
                  disabled={updateStatusMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
