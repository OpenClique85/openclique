import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileSearch, Filter, Download, Eye, Users, Search, Ghost } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface PIIAccessEntry {
  id: string;
  admin_user_id: string;
  access_type: string;
  target_user_id: string | null;
  target_table: string | null;
  accessed_fields: string[] | null;
  reason: string | null;
  created_at: string;
  admin_profile?: {
    display_name: string;
    email: string;
  };
  target_profile?: {
    display_name: string;
    email: string;
  };
}

const ACCESS_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  shadow_mode: {
    label: 'Shadow Mode',
    icon: <Ghost className="h-3 w-3" />,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  profile_view: {
    label: 'Profile View',
    icon: <Eye className="h-3 w-3" />,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  rbac_inspection: {
    label: 'RBAC Inspection',
    icon: <Users className="h-3 w-3" />,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  search: {
    label: 'User Search',
    icon: <Search className="h-3 w-3" />,
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  export: {
    label: 'Data Export',
    icon: <Download className="h-3 w-3" />,
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
};

export function PIIAccessLog() {
  const [dateFilter, setDateFilter] = useState('7');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [adminFilter, setAdminFilter] = useState('');

  const { data: accessLogs, isLoading } = useQuery({
    queryKey: ['pii-access-logs', dateFilter, typeFilter, adminFilter],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(dateFilter));
      
      let query = supabase
        .from('pii_access_log')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (typeFilter !== 'all') {
        query = query.eq('access_type', typeFilter);
      }

      const { data: logs, error } = await query;
      if (error) throw error;

      // Fetch admin and target profiles
      const adminIds = [...new Set(logs?.map(l => l.admin_user_id) || [])];
      const targetIds = [...new Set(logs?.filter(l => l.target_user_id).map(l => l.target_user_id!) || [])];
      const allUserIds = [...new Set([...adminIds, ...targetIds])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return logs?.map(log => ({
        ...log,
        admin_profile: profileMap.get(log.admin_user_id),
        target_profile: log.target_user_id ? profileMap.get(log.target_user_id) : undefined,
      })) as PIIAccessEntry[];
    },
  });

  // Calculate stats
  const stats = {
    total: accessLogs?.length || 0,
    byType: accessLogs?.reduce((acc, log) => {
      acc[log.access_type] = (acc[log.access_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    uniqueAdmins: new Set(accessLogs?.map(l => l.admin_user_id) || []).size,
    uniqueTargets: new Set(accessLogs?.filter(l => l.target_user_id).map(l => l.target_user_id) || []).size,
  };

  const filteredLogs = accessLogs?.filter(log => {
    if (adminFilter) {
      const adminName = log.admin_profile?.display_name?.toLowerCase() || '';
      const adminEmail = log.admin_profile?.email?.toLowerCase() || '';
      const filterLower = adminFilter.toLowerCase();
      return adminName.includes(filterLower) || adminEmail.includes(filterLower);
    }
    return true;
  });

  const getAccessTypeBadge = (type: string) => {
    const config = ACCESS_TYPE_CONFIG[type] || {
      label: type,
      icon: <Eye className="h-3 w-3" />,
      color: 'bg-muted',
    };
    
    return (
      <Badge variant="outline" className={config.color}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Accesses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.uniqueAdmins}</p>
            <p className="text-xs text-muted-foreground">Unique Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.uniqueTargets}</p>
            <p className="text-xs text-muted-foreground">Users Accessed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.byType['shadow_mode'] || 0}</p>
            <p className="text-xs text-muted-foreground">Shadow Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Access Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Access Type Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                {getAccessTypeBadge(type)}
                <span className="text-sm font-semibold">{count}</span>
              </div>
            ))}
            {Object.keys(stats.byType).length === 0 && (
              <p className="text-sm text-muted-foreground">No access logs in selected period</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSearch className="h-4 w-4" />
            PII Access Log
          </CardTitle>
          <CardDescription>
            Audit trail of admin access to personally identifiable information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Access type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {Object.entries(ACCESS_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Filter by admin..."
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              className="w-[200px]"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Access Type</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Fields Accessed</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{log.admin_profile?.display_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{log.admin_profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getAccessTypeBadge(log.access_type)}
                      </TableCell>
                      <TableCell>
                        {log.target_profile ? (
                          <div>
                            <p className="text-sm">{log.target_profile.display_name}</p>
                            <p className="text-xs text-muted-foreground">{log.target_profile.email}</p>
                          </div>
                        ) : log.target_user_id ? (
                          <span className="text-xs font-mono text-muted-foreground">
                            {log.target_user_id.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.accessed_fields && log.accessed_fields.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {log.accessed_fields.map((field, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-xs text-muted-foreground truncate" title={log.reason || ''}>
                          {log.reason || '-'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileSearch className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No PII access logs found for the selected filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
