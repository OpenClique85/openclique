/**
 * OrgApplicationsManager - Admin component for reviewing org/club applications
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { auditLog } from '@/lib/auditLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  Users,
  Clock,
  FileText,
  Globe,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';

interface OrgApplication {
  id: string;
  applicant_id: string;
  parent_org_id: string | null;
  name: string;
  type: string;
  description: string | null;
  category: string | null;
  visibility: string;
  intended_audience: string | null;
  requested_admins: string[] | null;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  decline_reason: string | null;
  agreed_to_terms: boolean;
  created_at: string;
  applicant?: { display_name: string | null; email: string | null };
  parent_org?: { name: string; slug: string } | null;
}

export function OrgApplicationsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<'pending' | 'approved' | 'declined' | 'all'>('pending');
  const [selectedApp, setSelectedApp] = useState<OrgApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['org-applications', filter],
    queryFn: async () => {
      let query = supabase
        .from('org_applications')
        .select(`
          *,
          applicant:profiles!org_applications_applicant_id_fkey(display_name, email),
          parent_org:organizations!org_applications_parent_org_id_fkey(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as OrgApplication[];
    },
  });

  const handleApprove = async (app: OrgApplication) => {
    setIsProcessing(true);

    try {
      // Generate slug
      const slug = app.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Create the organization
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: app.name,
          slug,
          type: app.type as any,
          parent_org_id: app.parent_org_id,
          description: app.description,
          category: app.category,
          visibility: app.visibility,
          is_verified: true,
          is_active: true,
          status: 'active',
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add applicant as admin
      await supabase.from('profile_organizations').insert({
        profile_id: app.applicant_id,
        org_id: newOrg.id,
        role: 'admin',
      });

      // Update application status
      await supabase
        .from('org_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', app.id);

      await auditLog({
        action: 'org_application_approved',
        targetTable: 'org_applications',
        targetId: app.id,
        newValues: { org_id: newOrg.id, org_name: app.name },
      });

      toast({ title: 'Application approved!', description: `${app.name} has been created.` });
      queryClient.invalidateQueries({ queryKey: ['org-applications'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setShowDetailModal(false);
    } catch (err) {
      toast({ title: 'Failed to approve application', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async (app: OrgApplication) => {
    if (!declineReason.trim()) {
      toast({ title: 'Please provide a reason', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      await supabase
        .from('org_applications')
        .update({
          status: 'declined',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          decline_reason: declineReason,
        })
        .eq('id', app.id);

      await auditLog({
        action: 'org_application_declined',
        targetTable: 'org_applications',
        targetId: app.id,
        newValues: { reason: declineReason },
      });

      toast({ title: 'Application declined' });
      queryClient.invalidateQueries({ queryKey: ['org-applications'] });
      setShowDetailModal(false);
      setDeclineReason('');
    } catch (err) {
      toast({ title: 'Failed to decline application', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = applications?.filter((a) => a.status === 'pending').length || 0;

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
          <h2 className="text-2xl font-display font-bold">Organization Applications</h2>
          <p className="text-muted-foreground">
            Review and approve organization and club creation requests
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive">{pendingCount} pending</Badge>
        )}
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1">
            <Clock className="h-3.5 w-3.5" />
            Pending
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="declined">
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Declined
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Applications Table */}
      {applications?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No applications found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent Org</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications?.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{app.name}</p>
                        {app.category && (
                          <p className="text-xs text-muted-foreground">{app.category}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{app.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {app.parent_org ? (
                      <span className="text-sm">{app.parent_org.name}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {app.applicant?.display_name || app.applicant?.email || 'Unknown'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(app.created_at), 'MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        app.status === 'approved'
                          ? 'default'
                          : app.status === 'declined'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setShowDetailModal(true);
                        setDeclineReason('');
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review this organization/club application
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedApp.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline">{selectedApp.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p>{selectedApp.category || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Visibility</p>
                  <div className="flex items-center gap-1">
                    {selectedApp.visibility === 'public' ? (
                      <Globe className="h-3.5 w-3.5" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                    {selectedApp.visibility}
                  </div>
                </div>
              </div>

              {selectedApp.parent_org && (
                <div>
                  <p className="text-sm text-muted-foreground">Parent Organization</p>
                  <p className="font-medium">{selectedApp.parent_org.name}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{selectedApp.description || '—'}</p>
              </div>

              {selectedApp.intended_audience && (
                <div>
                  <p className="text-sm text-muted-foreground">Intended Audience</p>
                  <p className="text-sm">{selectedApp.intended_audience}</p>
                </div>
              )}

              {selectedApp.requested_admins && selectedApp.requested_admins.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Requested Admins</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedApp.requested_admins.map((admin, i) => (
                      <Badge key={i} variant="secondary">
                        {admin}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Applicant</p>
                <p>
                  {selectedApp.applicant?.display_name || selectedApp.applicant?.email || 'Unknown'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p>{format(new Date(selectedApp.created_at), 'MMM d, yyyy h:mm a')}</p>
              </div>

              {selectedApp.status === 'pending' && (
                <div className="space-y-3 pt-4 border-t">
                  <Textarea
                    placeholder="Reason for declining (required if declining)"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              <DialogFooter className="gap-2">
                {selectedApp.status === 'pending' ? (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleDecline(selectedApp)}
                      disabled={isProcessing}
                    >
                      {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <XCircle className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                    <Button onClick={() => handleApprove(selectedApp)} disabled={isProcessing}>
                      {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
