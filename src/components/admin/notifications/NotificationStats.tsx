import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { 
  Mail, 
  Bell, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Loader2
} from 'lucide-react';

const COLORS = ['#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'];

export function NotificationStats() {
  // Fetch email stats by type
  const { data: emailsByType, isLoading: loadingTypes } = useQuery({
    queryKey: ['email-stats-by-type'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comms_log')
        .select('type')
        .gte('sent_at', subDays(new Date(), 30).toISOString());

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data || []) {
        counts[row.type] = (counts[row.type] || 0) + 1;
      }

      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  // Fetch daily volume
  const { data: dailyVolume, isLoading: loadingDaily } = useQuery({
    queryKey: ['email-daily-volume'],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 14);

      const { data, error } = await supabase
        .from('comms_log')
        .select('sent_at, status')
        .gte('sent_at', startDate.toISOString());

      if (error) throw error;

      // Create buckets for each day
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const buckets: Record<string, { date: string; sent: number; failed: number }> = {};

      for (const day of days) {
        const key = format(day, 'yyyy-MM-dd');
        buckets[key] = { date: format(day, 'MMM d'), sent: 0, failed: 0 };
      }

      for (const row of data || []) {
        const key = format(new Date(row.sent_at), 'yyyy-MM-dd');
        if (buckets[key]) {
          if (row.status === 'failed' || row.status === 'bounced') {
            buckets[key].failed++;
          } else {
            buckets[key].sent++;
          }
        }
      }

      return Object.values(buckets);
    },
  });

  // Fetch in-app notification stats
  const { data: notificationStats } = useQuery({
    queryKey: ['in-app-notification-stats'],
    queryFn: async () => {
      const last30d = subDays(new Date(), 30).toISOString();

      const { count: total } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', last30d);

      const { count: read } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', last30d)
        .not('read_at', 'is', null);

      const { data: byType } = await supabase
        .from('notifications')
        .select('type')
        .gte('created_at', last30d);

      const typeCounts: Record<string, number> = {};
      for (const row of byType || []) {
        typeCounts[row.type] = (typeCounts[row.type] || 0) + 1;
      }

      return {
        total: total || 0,
        read: read || 0,
        readRate: total ? ((read || 0) / total * 100).toFixed(1) : '0',
        byType: Object.entries(typeCounts)
          .map(([name, value]) => ({ name: formatNotificationType(name), value }))
          .sort((a, b) => b.value - a.value),
      };
    },
  });

  const isLoading = loadingTypes || loadingDaily;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {emailsByType?.reduce((sum, t) => sum + t.value, 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Emails (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notificationStats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">In-App (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notificationStats?.read || 0}</p>
                <p className="text-xs text-muted-foreground">Read</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notificationStats?.readRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Read Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Email Volume (14d)</CardTitle>
            <CardDescription>Daily sent vs failed emails</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyVolume} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="sent" fill="hsl(var(--primary))" name="Sent" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill="hsl(var(--destructive))" name="Failed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Email Types Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Emails by Type (30d)</CardTitle>
            <CardDescription>Distribution of email categories</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : emailsByType && emailsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={emailsByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {emailsByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center py-12 text-muted-foreground">
                No email data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notification Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications by Type</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {notificationStats?.byType.map((item, idx) => (
              <Badge
                key={item.name}
                variant="outline"
                className="px-3 py-1 text-sm"
                style={{ borderColor: COLORS[idx % COLORS.length] }}
              >
                <span
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                {item.name}: {item.value}
              </Badge>
            ))}
            {(!notificationStats?.byType || notificationStats.byType.length === 0) && (
              <p className="text-muted-foreground text-sm">No notifications in the last 30 days</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatNotificationType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
