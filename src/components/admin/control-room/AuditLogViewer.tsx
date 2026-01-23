/**
 * Audit Log Viewer
 * 
 * Comprehensive view of all admin actions with filtering and search.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  History, Search, Filter, ChevronDown, ChevronRight, 
  Loader2, ArrowRight, User, Calendar
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type AuditLog = Tables<'admin_audit_log'>;

const ACTION_COLORS: Record<string, string> = {
  quest_status_: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  quest_review_: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  quest_deleted: 'bg-destructive/20 text-destructive',
  instance_: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  signup_: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function getActionColor(action: string): string {
  for (const [prefix, color] of Object.entries(ACTION_COLORS)) {
    if (action.startsWith(prefix)) return color;
  }
  return 'bg-muted text-muted-foreground';
}

export function AuditLogViewer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Fetch audit logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, tableFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('admin_audit_log')
        .select('*')
        .gte('created_at', subDays(new Date(), parseInt(dateRange)).toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (tableFilter !== 'all') {
        query = query.eq('target_table', tableFilter);
      }

      if (actionFilter !== 'all') {
        query = query.ilike('action', `%${actionFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  // Get unique tables and actions for filters
  const { data: filterOptions } = useQuery({
    queryKey: ['audit-log-filters'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_audit_log')
        .select('action, target_table')
        .gte('created_at', subDays(new Date(), 30).toISOString());

      const actions = [...new Set(data?.map(d => d.action) || [])].sort();
      const tables = [...new Set(data?.map(d => d.target_table) || [])].sort();
      return { actions, tables };
    },
  });

  // Filter logs by search query
  const filteredLogs = logs?.filter((log) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.target_table?.toLowerCase().includes(searchLower) ||
      log.target_id?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.new_values).toLowerCase().includes(searchLower)
    );
  }) || [];

  const toggleExpanded = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Log
          </CardTitle>
          <CardDescription>
            Complete record of all admin actions. {logs?.length || 0} entries in the last {dateRange} days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search actions, IDs, values..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="w-[150px]">
              <Label htmlFor="table-filter" className="text-xs text-muted-foreground">Table</Label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger id="table-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tables</SelectItem>
                  {filterOptions?.tables.map((table) => (
                    <SelectItem key={table} value={table}>{table}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[150px]">
              <Label htmlFor="date-filter" className="text-xs text-muted-foreground">Date range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="date-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Logs list */}
          <ScrollArea className="h-[600px] pr-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No audit logs found matching your filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogs.has(log.id);
                  
                  return (
                    <Collapsible
                      key={log.id}
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(log.id)}
                    >
                      <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            
                            <Badge 
                              variant="outline" 
                              className={`shrink-0 ${getActionColor(log.action)}`}
                            >
                              {log.action}
                            </Badge>
                            
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <span className="font-mono text-xs">{log.target_table}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="font-mono text-xs truncate max-w-[120px]">
                                {log.target_id}
                              </span>
                            </div>
                            
                            <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>Admin</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(log.created_at), 'MMM d, HH:mm')}</span>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4">
                            {log.old_values && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Before</Label>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-[200px]">
                                  {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_values && (
                              <div>
                                <Label className="text-xs text-muted-foreground">After</Label>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-[200px]">
                                  {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
