import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Clock, AlertTriangle, CheckCircle, PieChart as PieChartIcon, BarChart3, MapPin, Download, MessageSquare, Star, Bell } from 'lucide-react';
import { useSupportAnalytics, SupportAnalytics as SupportAnalyticsData } from '@/hooks/useSupportAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

const RATING_COLORS = [
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--primary))',
  'hsl(var(--success))',
];

export function SupportAnalytics() {
  const [timeRange, setTimeRange] = useState<string>('30');
  const [isExporting, setIsExporting] = useState(false);
  const [isCheckingSLA, setIsCheckingSLA] = useState(false);
  const { data: analytics, isLoading } = useSupportAnalytics(parseInt(timeRange));

  const formatHours = (hours: number | null): string => {
    if (hours === null) return '—';
    if (hours < 1) return '<1h';
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const checkSLABreaches = async () => {
    setIsCheckingSLA(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-sla-breaches');
      if (error) throw error;
      
      if (data.breachCount > 0) {
        toast.warning(`Found ${data.breachCount} SLA breach(es)`, {
          description: `${data.firstResponseBreaches || 0} first response, ${data.resolutionBreaches || 0} resolution`,
        });
      } else {
        toast.success('No SLA breaches found');
      }
    } catch (error: any) {
      console.error('SLA check error:', error);
      toast.error('Failed to check SLA breaches');
    } finally {
      setIsCheckingSLA(false);
    }
  };

  const exportCSV = (analytics: SupportAnalyticsData) => {
    setIsExporting(true);
    
    // Prepare CSV data
    const rows = [
      ['Support Analytics Report'],
      [`Time Range: Last ${timeRange} days`],
      [`Generated: ${new Date().toISOString()}`],
      [],
      ['Summary Metrics'],
      ['Metric', 'Value'],
      ['Total Tickets', analytics.totalTickets.toString()],
      ['Tickets (Last 7 Days)', analytics.ticketsLast7Days.toString()],
      ['Open Tickets', analytics.resolutionMetrics.openCount.toString()],
      ['Resolved Tickets', analytics.resolutionMetrics.resolvedCount.toString()],
      ['Avg Resolution Time', formatHours(analytics.resolutionMetrics.avgResolutionHours)],
      ['Median Resolution Time', formatHours(analytics.resolutionMetrics.medianResolutionHours)],
      ['Avg First Response Time', formatHours(analytics.resolutionMetrics.avgFirstResponseHours)],
      ['Median First Response Time', formatHours(analytics.resolutionMetrics.medianFirstResponseHours)],
      ['% Resolved in 24h', `${analytics.resolutionMetrics.percentResolvedIn24h.toFixed(1)}%`],
      ['% Resolved in 48h', `${analytics.resolutionMetrics.percentResolvedIn48h.toFixed(1)}%`],
      ['% Responded in 1h', `${analytics.resolutionMetrics.percentRespondedIn1h.toFixed(1)}%`],
      ['% Responded in 4h', `${analytics.resolutionMetrics.percentRespondedIn4h.toFixed(1)}%`],
      [],
      ['Category Breakdown'],
      ['Category', 'Tickets', 'Avg Resolution Time'],
      ...analytics.categoryBreakdown.map(c => [c.category, c.count.toString(), formatHours(c.avgResolutionHours)]),
      [],
      ['Urgency Breakdown'],
      ['Urgency', 'Total', 'Open'],
      ...analytics.urgencyBreakdown.map(u => [u.urgency, u.count.toString(), u.openCount.toString()]),
      [],
      ['Status Breakdown'],
      ['Status', 'Count'],
      ...analytics.statusBreakdown.map(s => [s.status, s.count.toString()]),
      [],
      ['Friction Points (Top Pages)'],
      ['Page', 'Tickets', 'Avg Urgency'],
      ...analytics.frictionPoints.map(f => [f.page, f.ticketCount.toString(), f.avgUrgency.toFixed(2)]),
      [],
      ['Daily Trends'],
      ['Date', 'Opened', 'Resolved'],
      ...analytics.ticketTrends.map(t => [t.date, t.opened.toString(), t.resolved.toString()]),
    ];

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setIsExporting(false);
  };

  const exportJSON = (analytics: SupportAnalyticsData) => {
    setIsExporting(true);
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      timeRangeDays: parseInt(timeRange),
      summary: {
        totalTickets: analytics.totalTickets,
        ticketsLast7Days: analytics.ticketsLast7Days,
        openTickets: analytics.resolutionMetrics.openCount,
        resolvedTickets: analytics.resolutionMetrics.resolvedCount,
        avgResolutionHours: analytics.resolutionMetrics.avgResolutionHours,
        medianResolutionHours: analytics.resolutionMetrics.medianResolutionHours,
        avgFirstResponseHours: analytics.resolutionMetrics.avgFirstResponseHours,
        medianFirstResponseHours: analytics.resolutionMetrics.medianFirstResponseHours,
        percentResolvedIn24h: analytics.resolutionMetrics.percentResolvedIn24h,
        percentResolvedIn48h: analytics.resolutionMetrics.percentResolvedIn48h,
        percentRespondedIn1h: analytics.resolutionMetrics.percentRespondedIn1h,
        percentRespondedIn4h: analytics.resolutionMetrics.percentRespondedIn4h,
      },
      categoryBreakdown: analytics.categoryBreakdown,
      urgencyBreakdown: analytics.urgencyBreakdown,
      statusBreakdown: analytics.statusBreakdown,
      frictionPoints: analytics.frictionPoints,
      dailyTrends: analytics.ticketTrends,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setIsExporting(false);
  };

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

  return (
    <div className="space-y-6">
      {/* Header with time range and export */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold">Support Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track ticket trends, resolution times, and identify friction points
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkSLABreaches}
            disabled={isCheckingSLA}
          >
            {isCheckingSLA ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Bell className="h-4 w-4 mr-1" />}
            Check SLA
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => exportCSV(analytics)}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => exportJSON(analytics)}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-1" />
            JSON
          </Button>
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
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
              <MessageSquare className="h-4 w-4" />
              Avg First Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatHours(analytics.resolutionMetrics.avgFirstResponseHours)}
            </p>
            <p className="text-xs text-muted-foreground">
              {analytics.resolutionMetrics.percentRespondedIn1h.toFixed(0)}% in &lt;1h
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
      </div>

      {/* KPI Cards - Row 2: Response Time SLAs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Responded &lt;1h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">
              {analytics.resolutionMetrics.percentRespondedIn1h.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">
              First response SLA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Responded &lt;4h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {analytics.resolutionMetrics.percentRespondedIn4h.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">
              Median: {formatHours(analytics.resolutionMetrics.medianFirstResponseHours)}
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
              Resolution SLA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved &lt;48h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {analytics.resolutionMetrics.percentResolvedIn48h.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">
              Extended SLA
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

      {/* CSAT Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4" />
            Customer Satisfaction (CSAT)
          </CardTitle>
          <CardDescription>
            Satisfaction ratings from resolved tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* CSAT Score */}
            <div className="space-y-4">
              <div className="text-center p-6 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        star <= Math.round(analytics.csatMetrics.avgRating || 0)
                          ? 'fill-warning text-warning'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-3xl font-bold">
                  {analytics.csatMetrics.avgRating?.toFixed(1) || '—'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Average Rating ({analytics.csatMetrics.totalResponses} responses)
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold text-primary">
                    {analytics.csatMetrics.responseRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Response Rate</p>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold text-success">
                    {analytics.csatMetrics.ratingDistribution
                      .filter(r => r.rating >= 4)
                      .reduce((sum, r) => sum + r.count, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Satisfied (4-5★)</p>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div>
              <p className="text-sm font-medium mb-3">Rating Distribution</p>
              <div className="space-y-2">
                {analytics.csatMetrics.ratingDistribution.map((item) => {
                  const total = analytics.csatMetrics.totalResponses || 1;
                  const percentage = (item.count / total) * 100;
                  return (
                    <div key={item.rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm font-medium">{item.rating}</span>
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      </div>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: RATING_COLORS[item.rating - 1],
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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
