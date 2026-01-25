/**
 * =============================================================================
 * AI INFERENCE LOGS VIEWER - Admin audit trail for AI decisions
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, Eye, Brain, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type InferenceLog = Tables<'ai_inference_log'>;

interface InferenceLogWithProfile extends InferenceLog {
  profiles?: { display_name: string | null } | null;
}

export function AIInferenceLogsViewer() {
  const [runTypeFilter, setRunTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<InferenceLogWithProfile | null>(null);
  const [limit, setLimit] = useState(50);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['ai-inference-logs', runTypeFilter, limit],
    queryFn: async () => {
      let query = supabase
        .from('ai_inference_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (runTypeFilter !== 'all') {
        query = query.eq('run_type', runTypeFilter);
      }
      
      const { data: logs, error } = await query;
      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(logs.map(l => l.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return logs.map(log => ({
        ...log,
        profiles: profileMap.get(log.user_id) || null,
      })) as InferenceLogWithProfile[];
    },
  });

  const filteredLogs = logs?.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.profiles?.display_name?.toLowerCase().includes(search) ||
      log.user_id.toLowerCase().includes(search) ||
      log.traits_suggested.some(t => t.toLowerCase().includes(search))
    );
  });

  const getRunTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      intake: 'default',
      post_quest: 'secondary',
      admin_rerun: 'outline',
      monthly_refresh: 'secondary',
    };
    return (
      <Badge variant={variants[type] || 'default'}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">AI Inference Logs</h2>
        <p className="text-muted-foreground">
          Complete audit trail of AI-generated trait suggestions and decision traces
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or trait..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={runTypeFilter} onValueChange={setRunTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Run type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="intake">Intake</SelectItem>
                <SelectItem value="post_quest">Post-Quest</SelectItem>
                <SelectItem value="admin_rerun">Admin Rerun</SelectItem>
                <SelectItem value="monthly_refresh">Monthly Refresh</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto text-sm text-muted-foreground">
              {filteredLogs?.length || 0} logs
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Traits Suggested</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs?.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {log.created_at ? format(new Date(log.created_at), 'MMM d, HH:mm') : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {log.profiles?.display_name || 'Unknown User'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getRunTypeBadge(log.run_type)}</TableCell>
                  <TableCell className="text-sm font-mono">{log.model_used}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {log.traits_suggested.slice(0, 3).map(trait => (
                        <Badge key={trait} variant="outline" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                      {log.traits_suggested.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{log.traits_suggested.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.tokens_used || '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedLog(log)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No inference logs found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Inference Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && <InferenceLogDetail log={selectedLog} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InferenceLogDetail({ log }: { log: InferenceLogWithProfile }) {
  return (
    <ScrollArea className="h-[60vh]">
      <div className="space-y-6 pr-4">
        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">User</p>
            <p className="font-medium">{log.profiles?.display_name || log.user_id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Run Type</p>
            <p className="font-medium capitalize">{log.run_type.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Model</p>
            <p className="font-mono text-xs">{log.model_used}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Prompt Version</p>
            <p className="font-mono text-xs">{log.prompt_version}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">
              {log.created_at ? format(new Date(log.created_at), 'PPpp') : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Tokens Used</p>
            <p className="font-medium">{log.tokens_used || 'N/A'}</p>
          </div>
        </div>

        {/* Traits Suggested */}
        <div>
          <h4 className="font-medium mb-2">Traits Suggested ({log.traits_suggested.length})</h4>
          <div className="flex flex-wrap gap-2">
            {log.traits_suggested.map(trait => (
              <Badge key={trait} variant="secondary">
                {trait}
              </Badge>
            ))}
          </div>
        </div>

        {/* Input Snapshot */}
        <div>
          <h4 className="font-medium mb-2">Input Snapshot</h4>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
            {JSON.stringify(log.input_snapshot, null, 2)}
          </pre>
        </div>

        {/* Decision Traces */}
        <div>
          <h4 className="font-medium mb-2">Decision Traces</h4>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-60">
            {JSON.stringify(log.decision_traces, null, 2)}
          </pre>
        </div>

        {/* Raw Output */}
        <div>
          <h4 className="font-medium mb-2">Raw AI Output</h4>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
            {JSON.stringify(log.raw_output, null, 2)}
          </pre>
        </div>

        {/* Admin Trigger */}
        {log.admin_triggered_by && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ This inference was manually triggered by an admin
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
