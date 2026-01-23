import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Clock, AlertTriangle, CheckCircle, PieChart as PieChartIcon, BarChart3, MapPin } from 'lucide-react';
import { useSupportAnalytics } from '@/hooks/useSupportAnalytics';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const URGENCY_COLORS: Record<string, string> = {
  low: 'hsl(var(--muted-foreground))',
  medium: 'hsl(var(--primary))',
  high: 'hsl(var(--warning))',
  critical: 'hsl(var(--destructive))',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'hsl(var(--primary))',
  investigating: 'hsl(var(--warning))',
  waiting_response: 'hsl(var(--accent))',
  resolved: 'hsl(var(--success))',
  closed: 'hsl(var(--muted-foreground))',
};

const CATEGORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--muted-foreground))',
];

export function SupportAnalytics() {
  const [timeRange, setTimeRange] = useState<string>('30');
  const { data: analytics, isLoading } = useSupportAnalytics(parseInt(timeRange));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No analytics data available
      </div>
    );
  }

  const formatHours = (hours: number | null): string => {
    if (hours === null) return '—';
    if (hours < 1) return '<1h';
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  return (
    <div className="space-y-6">
      {/* Header with time range */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Support Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track ticket trends, resolution times, and identify friction points
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalTickets}</p>
            <p className="text-xs text-muted-foreground">
              {analytics.ticketsLast7Days} in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Open Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">{analytics.resolutionMetrics.openCount}</p>
            <p className="text-xs text-muted-foreground">
              {analytics.resolutionMetrics.resolvedCount} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatHours(analytics.resolutionMetrics.avgResolutionHours)}
            </p>
            <p className="text-xs text-muted-foreground">
              Median: {formatHours(analytics.resolutionMetrics.medianResolutionHours)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resolved &lt;24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">
              {analytics.resolutionMetrics.percentResolvedIn24h.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {analytics.resolutionMetrics.percentResolvedIn48h.toFixed(0)}% in 48h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ticket Trends
          </CardTitle>
          <CardDescription>Tickets opened vs resolved over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.ticketTrends}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="opened"
                  name="Opened"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="hsl(var(--success))"
                  fill="hsl(var(--success) / 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category and Status Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              By Category
            </CardTitle>
            <CardDescription>Ticket distribution by issue type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categoryBreakdown}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ category, count }) => `${category}: ${count}`}
                    labelLine={false}
                  >
                    {analytics.categoryBreakdown.map((entry, index) => (
                      <Cell 
                        key={entry.category} 
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value, name, props) => [
                      `${value} tickets (avg ${formatHours(props.payload.avgResolutionHours)} resolution)`,
                      props.payload.category
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Urgency</CardTitle>
            <CardDescription>Ticket severity distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.urgencyBreakdown} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="urgency" 
                    tick={{ fontSize: 12 }} 
                    width={80}
                    tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value, name) => [value, name === 'count' ? 'Total' : 'Still Open']}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="openCount" name="Open" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Distribution</CardTitle>
          <CardDescription>Current ticket statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {analytics.statusBreakdown.map((item) => (
              <div 
                key={item.status} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                style={{ borderColor: STATUS_COLORS[item.status] || 'hsl(var(--border))' }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[item.status] || 'hsl(var(--muted))' }}
                />
                <span className="text-sm font-medium capitalize">
                  {item.status.replace('_', ' ')}
                </span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Friction Points */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Friction Points
          </CardTitle>
          <CardDescription>
            Pages generating the most support tickets — higher urgency scores indicate more critical issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.frictionPoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No friction points detected</p>
          ) : (
            <div className="space-y-3">
              {analytics.frictionPoints.map((point, index) => (
                <div 
                  key={point.page} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium capitalize">{point.page}</p>
                      <p className="text-xs text-muted-foreground">
                        {point.ticketCount} ticket{point.ticketCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Avg Urgency:</span>
                    <Badge 
                      variant={point.avgUrgency >= 3 ? 'destructive' : point.avgUrgency >= 2 ? 'default' : 'secondary'}
                    >
                      {point.avgUrgency.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Resolution Times Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resolution Times by Category</CardTitle>
          <CardDescription>
            Average time to resolve tickets in each category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Category</th>
                  <th className="text-right py-2 font-medium">Tickets</th>
                  <th className="text-right py-2 font-medium">Avg Resolution</th>
                </tr>
              </thead>
              <tbody>
                {analytics.categoryBreakdown.map((cat) => (
                  <tr key={cat.category} className="border-b last:border-0">
                    <td className="py-2">{cat.category}</td>
                    <td className="py-2 text-right">{cat.count}</td>
                    <td className="py-2 text-right">
                      <Badge variant={
                        cat.avgResolutionHours === null ? 'secondary' :
                        cat.avgResolutionHours <= 24 ? 'default' :
                        cat.avgResolutionHours <= 48 ? 'secondary' : 'destructive'
                      }>
                        {formatHours(cat.avgResolutionHours)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
