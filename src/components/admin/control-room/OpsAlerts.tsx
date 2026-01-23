/**
 * Ops Alerts
 * 
 * Auto-generated alerts for quests and instances requiring attention.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, Clock, Users, XOctagon, CalendarClock, 
  Loader2, CheckCircle, ArrowRight 
} from 'lucide-react';
import { formatDistanceToNow, differenceInHours, differenceInDays, parseISO, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Alert {
  id: string;
  type: 'pending_review' | 'low_signups' | 'revoked_recent' | 'cancelled_users' | 'stale_instance';
  severity: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  questId?: string;
  instanceId?: string;
  timestamp: string;
}

const SEVERITY_STYLES = {
  error: 'border-destructive bg-destructive/5',
  warning: 'border-amber-500 bg-amber-50 dark:bg-amber-900/10',
  info: 'border-blue-500 bg-blue-50 dark:bg-blue-900/10',
};

const SEVERITY_ICONS = {
  error: <XOctagon className="h-5 w-5 text-destructive" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Clock className="h-5 w-5 text-blue-500" />,
};

export function OpsAlerts() {
  const navigate = useNavigate();

  // Fetch data for alerts
  const { data: alertData, isLoading } = useQuery({
    queryKey: ['ops-alerts'],
    queryFn: async () => {
      const now = new Date();
      const alerts: Alert[] = [];

      // 1. Quests pending review > 48 hours
      const { data: pendingQuests } = await supabase
        .from('quests')
        .select('id, title, created_at')
        .eq('review_status', 'pending_review')
        .is('deleted_at', null);

      pendingQuests?.forEach((quest) => {
        const hoursAgo = differenceInHours(now, new Date(quest.created_at));
        if (hoursAgo > 48) {
          alerts.push({
            id: `pending-${quest.id}`,
            type: 'pending_review',
            severity: hoursAgo > 72 ? 'error' : 'warning',
            title: 'Quest pending review too long',
            description: `"${quest.title}" has been waiting for review for ${Math.floor(hoursAgo / 24)} days.`,
            questId: quest.id,
            timestamp: quest.created_at,
          });
        }
      });

      // 2. Instances going live in < 24h with low signups
      const { data: upcomingInstances } = await supabase
        .from('quest_instances')
        .select('id, title, scheduled_date, start_time, current_signup_count, capacity')
        .in('status', ['recruiting', 'locked'])
        .gte('scheduled_date', now.toISOString().split('T')[0])
        .lte('scheduled_date', addDays(now, 1).toISOString().split('T')[0]);

      upcomingInstances?.forEach((instance) => {
        const fillRate = instance.current_signup_count / instance.capacity;
        if (fillRate < 0.25) {
          alerts.push({
            id: `low-signup-${instance.id}`,
            type: 'low_signups',
            severity: fillRate < 0.1 ? 'error' : 'warning',
            title: 'Instance launching with low signups',
            description: `"${instance.title}" on ${instance.scheduled_date} has only ${instance.current_signup_count}/${instance.capacity} signups (${Math.round(fillRate * 100)}%).`,
            instanceId: instance.id,
            timestamp: `${instance.scheduled_date}T${instance.start_time}`,
          });
        }
      });

      // 3. Recently revoked quests (last 7 days)
      const { data: revokedQuests } = await supabase
        .from('quests')
        .select('id, title, revoked_at, revoked_reason')
        .eq('status', 'revoked')
        .gte('revoked_at', addDays(now, -7).toISOString());

      revokedQuests?.forEach((quest) => {
        alerts.push({
          id: `revoked-${quest.id}`,
          type: 'revoked_recent',
          severity: 'error',
          title: 'Quest recently revoked',
          description: `"${quest.title}" was revoked${quest.revoked_reason ? `: ${quest.revoked_reason}` : ''}`,
          questId: quest.id,
          timestamp: quest.revoked_at || now.toISOString(),
        });
      });

      // 4. Cancelled instances with users who need notification
      const { data: cancelledInstances } = await supabase
        .from('quest_instances')
        .select('id, title, updated_at')
        .eq('status', 'cancelled')
        .gte('updated_at', addDays(now, -3).toISOString());

      cancelledInstances?.forEach((instance) => {
        alerts.push({
          id: `cancelled-${instance.id}`,
          type: 'cancelled_users',
          severity: 'warning',
          title: 'Instance cancelled recently',
          description: `"${instance.title}" was cancelled. Verify users have been notified.`,
          instanceId: instance.id,
          timestamp: instance.updated_at,
        });
      });

      // 5. Stale draft instances (older than 14 days)
      const { data: staleInstances } = await supabase
        .from('quest_instances')
        .select('id, title, created_at')
        .eq('status', 'draft')
        .lt('created_at', addDays(now, -14).toISOString());

      staleInstances?.forEach((instance) => {
        const daysAgo = differenceInDays(now, new Date(instance.created_at));
        alerts.push({
          id: `stale-${instance.id}`,
          type: 'stale_instance',
          severity: 'info',
          title: 'Stale draft instance',
          description: `"${instance.title}" has been in draft for ${daysAgo} days. Consider publishing or archiving.`,
          instanceId: instance.id,
          timestamp: instance.created_at,
        });
      });

      // Sort by severity then timestamp
      const severityOrder = { error: 0, warning: 1, info: 2 };
      return alerts.sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const alerts = alertData || [];
  const errorCount = alerts.filter(a => a.severity === 'error').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex gap-4 items-center">
        <Card className="flex-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`p-2 rounded-full ${errorCount > 0 ? 'bg-destructive/10' : 'bg-muted'}`}>
              <XOctagon className={`h-5 w-5 ${errorCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <div className="text-2xl font-bold">{errorCount}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`p-2 rounded-full ${warningCount > 0 ? 'bg-amber-100' : 'bg-muted'}`}>
              <AlertTriangle className={`h-5 w-5 ${warningCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <div className="text-2xl font-bold">{warningCount}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/20">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{alerts.length === 0 ? '✓' : alerts.length}</div>
              <div className="text-sm text-muted-foreground">
                {alerts.length === 0 ? 'All clear' : 'Total alerts'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Operational Alerts
          </CardTitle>
          <CardDescription>
            Auto-generated alerts for quests and instances requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
              <p className="font-medium">All systems operational</p>
              <p className="text-sm">No alerts at this time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${SEVERITY_STYLES[alert.severity]}`}
                >
                  <div className="flex items-start gap-3">
                    {SEVERITY_ICONS[alert.severity]}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{alert.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (alert.instanceId) {
                          navigate(`/admin/pilot/${alert.instanceId}`);
                        }
                        // Quest navigation would go to approval inbox with filter
                      }}
                    >
                      View <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
