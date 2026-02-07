import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Search, 
  RefreshCw, 
  RotateCcw, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2
} from 'lucide-react';

interface CommsLogEntry {
  id: string;
  user_id: string | null;
  quest_id: string | null;
  type: string;
  subject: string | null;
  status: string | null;
  error_message: string | null;
  provider_message_id: string | null;
  metadata: Record<string, unknown> | null;
  sent_at: string;
  quest?: { title: string } | null;
  profile?: { display_name: string; email: string } | null;
}

const STATUS_CONFIG = {
  sent: { label: 'Sent', icon: CheckCircle, variant: 'default' as const, color: 'text-green-600' },
  delivered: { label: 'Delivered', icon: CheckCircle, variant: 'default' as const, color: 'text-green-600' },
  failed: { label: 'Failed', icon: XCircle, variant: 'destructive' as const, color: 'text-red-600' },
  bounced: { label: 'Bounced', icon: XCircle, variant: 'destructive' as const, color: 'text-red-600' },
  pending: { label: 'Pending', icon: Clock, variant: 'secondary' as const, color: 'text-amber-600' },
};

export function DeliveryLog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<CommsLogEntry | null>(null);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['comms-log', statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('comms_log')
        .select(`*, quest:quests(title)`)
        .order('sent_at', { ascending: false })
        .limit(200);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles separately for user_ids
      const userIds = [...new Set((data || []).map(d => d.user_id).filter(Boolean))] as string[];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, display_name, email').in('id', userIds)
        : { data: [] };

      const profileMap = new Map<string, { id: string; display_name: string; email: string | null }>(
        (profiles || []).map(p => [p.id, p] as const)
      );

      return (data || []).map(log => ({
        ...log,
        profile: log.user_id ? profileMap.get(log.user_id) || null : null,
      })) as CommsLogEntry[];
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (entry: CommsLogEntry) => {
      // Resend using the send-email edge function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: entry.profile?.email,
          subject: entry.subject || 'OpenClique Notification',
          template: 'custom',
          customHtml: (entry.metadata as any)?.original_html || `<p>Resent notification</p>`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Email resent successfully' });
      queryClient.invalidateQueries({ queryKey: ['comms-log'] });
    },
    onError: (error: Error) => {
      toast({ 
        variant: 'destructive', 
        title: 'Failed to resend', 
        description: error.message 
      });
    },
  });

  const filteredLogs = logs?.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.subject?.toLowerCase().includes(query) ||
      log.profile?.display_name?.toLowerCase().includes(query) ||
      log.profile?.email?.toLowerCase().includes(query) ||
      log.quest?.title?.toLowerCase().includes(query)
    );
  });

  const getStatusConfig = (status: string | null) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Email Delivery Log</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by subject, recipient, quest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="email_invite">Email Invite</SelectItem>
              <SelectItem value="admin_dm">Admin DM</SelectItem>
              <SelectItem value="push">Push Notification</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quest</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No emails found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs?.map((log) => {
                    const statusConfig = getStatusConfig(log.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant={statusConfig.variant} className="gap-1">
                            <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {log.profile?.display_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {log.profile?.email || 'No email'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.subject || '(No subject)'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.quest?.title || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.sent_at), 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedEntry(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(log.status === 'failed' || log.status === 'bounced') && log.profile?.email && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => resendMutation.mutate(log)}
                                disabled={resendMutation.isPending}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Email Details</DialogTitle>
            </DialogHeader>
            {selectedEntry && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Recipient</p>
                    <p className="font-medium">{selectedEntry.profile?.display_name}</p>
                    <p className="text-xs">{selectedEntry.profile?.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={getStatusConfig(selectedEntry.status).variant}>
                      {getStatusConfig(selectedEntry.status).label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Subject</p>
                    <p className="font-medium">{selectedEntry.subject}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sent At</p>
                    <p className="font-medium">
                      {format(new Date(selectedEntry.sent_at), 'PPpp')}
                    </p>
                  </div>
                  {selectedEntry.provider_message_id && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Provider Message ID</p>
                      <p className="font-mono text-xs">{selectedEntry.provider_message_id}</p>
                    </div>
                  )}
                  {selectedEntry.error_message && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Error</p>
                      <p className="text-red-600 text-sm bg-red-50 p-2 rounded">
                        {selectedEntry.error_message}
                      </p>
                    </div>
                  )}
                </div>

                {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Metadata</p>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[200px]">
                      {JSON.stringify(selectedEntry.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {(selectedEntry.status === 'failed' || selectedEntry.status === 'bounced') && 
                  selectedEntry.profile?.email && (
                  <Button
                    onClick={() => {
                      resendMutation.mutate(selectedEntry);
                      setSelectedEntry(null);
                    }}
                    disabled={resendMutation.isPending}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Resend Email
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
