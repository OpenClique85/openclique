import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Shield, Loader2, Lock, UserX, Clock, TrendingUp } from 'lucide-react';
import { format, subDays, subHours } from 'date-fns';

interface AuthEvent {
  id: string;
  identifier: string;
  identifier_type: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface SuspiciousPattern {
  identifier: string;
  type: string;
  count: number;
  lastSeen: string;
  severity: 'low' | 'medium' | 'high';
}

const EVENT_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  login_failed: {
    label: 'Failed Login',
    icon: <Lock className="h-3 w-3" />,
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
  signup_blocked: {
    label: 'Signup Blocked',
    icon: <UserX className="h-3 w-3" />,
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  },
  rate_limited: {
    label: 'Rate Limited',
    icon: <Clock className="h-3 w-3" />,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  suspicious_activity: {
    label: 'Suspicious',
    icon: <AlertTriangle className="h-3 w-3" />,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
};

export function AbuseMonitor() {
  const [timeRange, setTimeRange] = useState('24');

  // Fetch auth rate monitor events
  const { data: authEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['auth-rate-monitor', timeRange],
    queryFn: async () => {
      const startDate = timeRange === '1' 
        ? subHours(new Date(), 1) 
        : subDays(new Date(), parseInt(timeRange));
      
      const { data, error } = await supabase
        .from('auth_rate_monitor')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as AuthEvent[];
    },
  });

  // Calculate suspicious patterns
  const suspiciousPatterns: SuspiciousPattern[] = (() => {
    if (!authEvents) return [];
    
    const grouped = authEvents.reduce<Record<string, { identifier: string; type: string; count: number; lastSeen: string; events: AuthEvent[] }>>((acc, event) => {
      const key = `${event.identifier}-${event.identifier_type}`;
      if (!acc[key]) {
        acc[key] = {
          identifier: event.identifier,
          type: event.identifier_type,
          count: 0,
          lastSeen: event.created_at,
          events: [],
        };
      }
      acc[key].count++;
      acc[key].events.push(event);
      return acc;
    }, {});

    return Object.values(grouped)
      .filter(g => g.count >= 3) // At least 3 events to be suspicious
      .map(g => {
        const severity: 'low' | 'medium' | 'high' = g.count >= 10 ? 'high' : g.count >= 5 ? 'medium' : 'low';
        return {
          identifier: g.identifier,
          type: g.type,
          count: g.count,
          lastSeen: g.lastSeen,
          severity,
        };
      })
      .sort((a, b) => b.count - a.count);
  })();

  // Stats
  const stats = {
    totalEvents: authEvents?.length || 0,
    failedLogins: authEvents?.filter(e => e.event_type === 'login_failed').length || 0,
    rateLimited: authEvents?.filter(e => e.event_type === 'rate_limited').length || 0,
    uniqueIdentifiers: new Set(authEvents?.map(e => e.identifier) || []).size,
    highSeverity: suspiciousPatterns.filter(p => p.severity === 'high').length,
  };

  const getEventBadge = (type: string) => {
    const config = EVENT_CONFIG[type] || {
      label: type,
      icon: <AlertTriangle className="h-3 w-3" />,
      color: 'bg-muted',
    };
    
    return (
      <Badge variant="outline" className={config.color}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    const config = {
      low: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      medium: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      high: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    
    return (
      <Badge variant="outline" className={config[severity]}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Read-Only MVP</p>
              <p className="text-xs text-muted-foreground">
                This monitor displays auth failures and suspicious patterns. 
                Automated blocking is not yet implemented - use this for awareness and manual investigation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.totalEvents}</p>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-red-500">{stats.failedLogins}</p>
            <p className="text-xs text-muted-foreground">Failed Logins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-amber-500">{stats.rateLimited}</p>
            <p className="text-xs text-muted-foreground">Rate Limited</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.uniqueIdentifiers}</p>
            <p className="text-xs text-muted-foreground">Unique Sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-red-600">{stats.highSeverity}</p>
            <p className="text-xs text-muted-foreground">High Severity</p>
          </CardContent>
        </Card>
      </div>

      {/* Suspicious Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Suspicious Patterns
          </CardTitle>
          <CardDescription>
            Identifiers with repeated security events (≥3 occurrences)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suspiciousPatterns.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Event Count</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspiciousPatterns.map((pattern, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {getSeverityBadge(pattern.severity)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {pattern.type === 'email' 
                          ? pattern.identifier.replace(/(.{3}).*(@.*)/, '$1***$2')
                          : pattern.identifier}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{pattern.type}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {pattern.count}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(pattern.lastSeen), 'MMM d, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No suspicious patterns detected</p>
              <p className="text-xs">All identifiers have fewer than 3 security events</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Recent Security Events
              </CardTitle>
              <CardDescription>
                Failed logins, rate limits, and blocked signups
              </CardDescription>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last hour</SelectItem>
                <SelectItem value="24">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : authEvents && authEvents.length > 0 ? (
            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authEvents.slice(0, 100).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        {getEventBadge(event.event_type)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.identifier_type === 'email' 
                          ? event.identifier.replace(/(.{3}).*(@.*)/, '$1***$2')
                          : event.identifier}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {event.identifier_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {event.metadata ? (
                          <span className="text-xs text-muted-foreground truncate block" title={JSON.stringify(event.metadata)}>
                            {JSON.stringify(event.metadata).slice(0, 50)}...
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No security events in selected time range</p>
              <p className="text-xs">This is good! No failed logins or rate limits detected.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
