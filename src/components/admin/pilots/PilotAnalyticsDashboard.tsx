/**
 * PilotAnalyticsDashboard - Time-gated metrics dashboard with VC-ready visualizations
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  Users, UserCheck, TrendingUp, UserPlus, Calendar, Download, 
  Loader2, Star, Heart, BarChart3, Target, CheckCircle, XCircle,
  Repeat, Users2, MessageSquare
} from 'lucide-react';
import { format, parseISO, differenceInDays, isAfter, isBefore } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface PilotProgram {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  hypothesis: string | null;
  success_criteria: Array<{ metric: string; target: string; description: string }>;
  start_date: string;
  end_date: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
}

interface PilotMetrics {
  pilot: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
    hypothesis: string | null;
    success_criteria: Array<{ metric: string; target: string; description: string }>;
  };
  engagement: {
    new_users: number;
    quest_signups: number;
    quests_completed: number;
    squads_formed: number;
    completion_rate: number;
  };
  growth: {
    friend_invites_created: number;
    friend_invites_redeemed: number;
    referral_rate: number;
    k_factor: number;
  };
  retention: {
    repeat_users: number;
    cliques_formed: number;
    repeat_rate: number;
  };
  satisfaction: {
    avg_rating: number;
    avg_belonging_delta: number;
    feedback_count: number;
  };
  generated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

export function PilotAnalyticsDashboard() {
  const [selectedPilotId, setSelectedPilotId] = useState<string>('');

  // Fetch all pilots for selector
  const { data: pilots, isLoading: pilotsLoading } = useQuery({
    queryKey: ['pilot-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pilot_programs' as any)
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as unknown as PilotProgram[];
    },
  });

  // Auto-select first pilot
  const effectivePilotId = selectedPilotId || pilots?.[0]?.id || '';

  // Fetch metrics for selected pilot
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['pilot-metrics', effectivePilotId],
    queryFn: async () => {
      if (!effectivePilotId) return null;
      const { data, error } = await supabase.rpc('get_pilot_metrics' as any, { p_pilot_id: effectivePilotId });
      if (error) throw error;
      return data as unknown as PilotMetrics;
    },
    enabled: !!effectivePilotId,
  });

  // Fetch notes for the pilot (for export)
  const { data: notes } = useQuery({
    queryKey: ['pilot-notes', effectivePilotId],
    queryFn: async () => {
      if (!effectivePilotId) return [];
      const { data, error } = await supabase
        .from('pilot_notes' as any)
        .select('*')
        .eq('pilot_id', effectivePilotId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!effectivePilotId,
  });

  const selectedPilot = pilots?.find(p => p.id === effectivePilotId);

  const getPilotProgress = () => {
    if (!selectedPilot) return 0;
    const now = new Date();
    const start = parseISO(selectedPilot.start_date);
    const end = parseISO(selectedPilot.end_date);
    
    if (isBefore(now, start)) return 0;
    if (isAfter(now, end)) return 100;
    
    const total = differenceInDays(end, start);
    const elapsed = differenceInDays(now, start);
    return Math.round((elapsed / total) * 100);
  };

  const getDaysInfo = () => {
    if (!selectedPilot) return '';
    const now = new Date();
    const start = parseISO(selectedPilot.start_date);
    const end = parseISO(selectedPilot.end_date);
    
    if (isBefore(now, start)) {
      return `Starts in ${differenceInDays(start, now)} days`;
    }
    if (isAfter(now, end)) {
      return 'Pilot completed';
    }
    const remaining = differenceInDays(end, now);
    const elapsed = differenceInDays(now, start);
    return `Day ${elapsed} of ${differenceInDays(end, start)} (${remaining} remaining)`;
  };

  const exportVCReport = (exportFormat: 'json' | 'markdown') => {
    if (!metrics || !selectedPilot) return;

    const report = {
      report: {
        title: 'OpenClique Pilot Report',
        pilot_name: metrics.pilot.name,
        period: `${format(parseISO(metrics.pilot.start_date), 'MMMM d')} - ${format(parseISO(metrics.pilot.end_date), 'MMMM d, yyyy')}`,
        generated_at: new Date().toISOString(),
      },
      hypothesis: metrics.pilot.hypothesis,
      success_criteria: metrics.pilot.success_criteria?.map((c: { metric: string; target: string; description: string }) => ({
        ...c,
        actual: evaluateCriterion(c, metrics),
        passed: checkCriterionPassed(c, metrics),
      })),
      metrics: {
        engagement: metrics.engagement,
        retention: metrics.retention,
        growth: metrics.growth,
        satisfaction: metrics.satisfaction,
      },
      notes: notes?.map((n: any) => ({
        date: n.created_at ? format(parseISO(n.created_at), 'yyyy-MM-dd') : '',
        type: n.note_type,
        content: n.content,
        tags: n.tags,
      })),
    };

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedPilot.slug}-vc-report.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const md = generateMarkdownReport(report);
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedPilot.slug}-vc-report.md`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast({ title: 'Report exported', description: `Downloaded as ${exportFormat.toUpperCase()}` });
  };

  const evaluateCriterion = (criterion: { metric: string; target: string }, metrics: PilotMetrics): string => {
    const metricLower = criterion.metric.toLowerCase();
    if (metricLower.includes('retention') || metricLower.includes('repeat')) {
      return `${metrics.retention.repeat_rate}%`;
    }
    if (metricLower.includes('referral') || metricLower.includes('invite')) {
      return `${metrics.growth.referral_rate}%`;
    }
    if (metricLower.includes('rating')) {
      return `${metrics.satisfaction.avg_rating}`;
    }
    if (metricLower.includes('completion')) {
      return `${metrics.engagement.completion_rate}%`;
    }
    return 'N/A';
  };

  const checkCriterionPassed = (criterion: { metric: string; target: string }, metrics: PilotMetrics): boolean => {
    const actual = evaluateCriterion(criterion, metrics);
    const actualNum = parseFloat(actual);
    const targetNum = parseFloat(criterion.target);
    if (isNaN(actualNum) || isNaN(targetNum)) return false;
    return actualNum >= targetNum;
  };

  const generateMarkdownReport = (report: any): string => {
    return `# ${report.report.title}

## ${report.report.pilot_name}

**Period:** ${report.report.period}  
**Generated:** ${format(new Date(report.report.generated_at), 'PPpp')}

---

## Hypothesis

${report.hypothesis || '_No hypothesis defined_'}

---

## Success Criteria

${report.success_criteria?.map((c: any) => `- **${c.metric}**: Target ${c.target} → Actual ${c.actual} ${c.passed ? '✅' : '❌'}`).join('\n') || '_No criteria defined_'}

---

## Metrics

### Engagement
- New Users: ${report.metrics.engagement.new_users}
- Quest Signups: ${report.metrics.engagement.quest_signups}
- Quests Completed: ${report.metrics.engagement.quests_completed}
- Completion Rate: ${report.metrics.engagement.completion_rate}%
- Squads Formed: ${report.metrics.engagement.squads_formed}

### Retention
- Repeat Users: ${report.metrics.retention.repeat_users}
- Repeat Rate: ${report.metrics.retention.repeat_rate}%
- Cliques Formed: ${report.metrics.retention.cliques_formed}

### Growth
- Friend Invites Created: ${report.metrics.growth.friend_invites_created}
- Friend Invites Redeemed: ${report.metrics.growth.friend_invites_redeemed}
- Referral Rate: ${report.metrics.growth.referral_rate}%
- K-Factor: ${report.metrics.growth.k_factor}

### Satisfaction
- Average Rating: ${report.metrics.satisfaction.avg_rating}/5
- Belonging Delta: ${report.metrics.satisfaction.avg_belonging_delta > 0 ? '+' : ''}${report.metrics.satisfaction.avg_belonging_delta}
- Feedback Responses: ${report.metrics.satisfaction.feedback_count}

---

## Notes & Observations

${report.notes?.map((n: any) => `### ${format(parseISO(n.date), 'MMM d, yyyy')} - ${n.type.charAt(0).toUpperCase() + n.type.slice(1)}

${n.content}

${n.tags?.length ? `_Tags: ${n.tags.join(', ')}_` : ''}
`).join('\n') || '_No notes recorded_'}

---

_Report generated by OpenClique Pilot Manager_
`;
  };

  if (pilotsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pilots?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No pilot programs to analyze</p>
          <p className="text-sm text-muted-foreground">Create a pilot program first</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Pilot Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={effectivePilotId} onValueChange={setSelectedPilotId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a pilot..." />
            </SelectTrigger>
            <SelectContent>
              {pilots.map((pilot) => (
                <SelectItem key={pilot.id} value={pilot.id}>
                  {pilot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPilot && (
            <Badge className={STATUS_COLORS[selectedPilot.status]}>
              {selectedPilot.status}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchMetrics()}>
            Refresh
          </Button>
          <Select onValueChange={(format) => exportVCReport(format as 'json' | 'markdown')}>
            <SelectTrigger className="w-[160px]">
              <Download className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Export Report" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">Export JSON</SelectItem>
              <SelectItem value="markdown">Export Markdown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range & Progress */}
      {selectedPilot && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {format(parseISO(selectedPilot.start_date), 'MMM d')} – {format(parseISO(selectedPilot.end_date), 'MMM d, yyyy')}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({differenceInDays(parseISO(selectedPilot.end_date), parseISO(selectedPilot.start_date))} days)
                </span>
              </div>
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <Progress value={getPilotProgress()} className="h-2 flex-1" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">{getDaysInfo()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {metricsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : metrics ? (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="New Users"
              value={metrics.engagement.new_users}
              icon={<Users className="h-5 w-5" />}
              description="During pilot window"
            />
            <MetricCard
              title="Quest Signups"
              value={metrics.engagement.quest_signups}
              icon={<UserCheck className="h-5 w-5" />}
              description="Total signups"
            />
            <MetricCard
              title="Completion Rate"
              value={`${metrics.engagement.completion_rate}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              description="Signups → Completed"
            />
            <MetricCard
              title="Friend Referrals"
              value={metrics.growth.friend_invites_redeemed}
              icon={<UserPlus className="h-5 w-5" />}
              description={`${metrics.growth.referral_rate}% conversion`}
            />
          </div>

          {/* Detailed Sections */}
          <Tabs defaultValue="engagement" className="space-y-4">
            <TabsList>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="retention">Retention</TabsTrigger>
              <TabsTrigger value="growth">Growth</TabsTrigger>
              <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
              <TabsTrigger value="criteria">Success Criteria</TabsTrigger>
            </TabsList>

            <TabsContent value="engagement" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Activity Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <MetricRow label="New Users" value={metrics.engagement.new_users} />
                      <MetricRow label="Quest Signups" value={metrics.engagement.quest_signups} />
                      <MetricRow label="Quests Completed" value={metrics.engagement.quests_completed} />
                      <MetricRow label="Squads Formed" value={metrics.engagement.squads_formed} />
                      <MetricRow label="Completion Rate" value={`${metrics.engagement.completion_rate}%`} highlight />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Funnel Visualization</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Users', value: metrics.engagement.new_users },
                        { name: 'Signups', value: metrics.engagement.quest_signups },
                        { name: 'Completed', value: metrics.engagement.quests_completed },
                        { name: 'Squads', value: metrics.engagement.squads_formed },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="retention" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Repeat className="h-5 w-5" />
                      Retention Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <MetricRow label="Repeat Users (2+ quests)" value={metrics.retention.repeat_users} />
                      <MetricRow label="Repeat Rate" value={`${metrics.retention.repeat_rate}%`} highlight />
                      <MetricRow label="Cliques Formed" value={metrics.retention.cliques_formed} />
                    </div>
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Repeat Rate</strong> measures users who signed up for 2+ quests during the pilot window.
                        This is a key indicator of product stickiness.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users2 className="h-5 w-5" />
                      Clique Formation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[200px]">
                      <div className="text-center">
                        <p className="text-5xl font-bold text-primary">{metrics.retention.cliques_formed}</p>
                        <p className="text-muted-foreground mt-2">Persistent groups formed</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Squads that converted to cliques
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="growth" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Friend Invite Funnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <MetricRow label="Invites Created" value={metrics.growth.friend_invites_created} />
                      <MetricRow label="Invites Redeemed" value={metrics.growth.friend_invites_redeemed} />
                      <MetricRow label="Referral Rate" value={`${metrics.growth.referral_rate}%`} highlight />
                    </div>
                    <div className="mt-6 h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Created', value: metrics.growth.friend_invites_created },
                          { name: 'Redeemed', value: metrics.growth.friend_invites_redeemed },
                        ]} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={80} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">K-Factor</CardTitle>
                    <CardDescription>Viral coefficient (new users from referrals / total users)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[200px]">
                      <div className="text-center">
                        <p className="text-5xl font-bold text-primary">{metrics.growth.k_factor}</p>
                        <p className="text-muted-foreground mt-2">
                          {metrics.growth.k_factor >= 1 ? 'Viral growth! 🚀' : 
                           metrics.growth.k_factor >= 0.5 ? 'Good traction' : 
                           'Room to improve'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-4 max-w-xs">
                          K &gt; 1.0 means each user brings in more than one new user (exponential growth)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="satisfaction" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Average Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[150px]">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-8 w-8 ${star <= Math.round(metrics.satisfaction.avg_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <p className="text-3xl font-bold">{metrics.satisfaction.avg_rating}/5</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Belonging Delta
                    </CardTitle>
                    <CardDescription>Change in sense of connection</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[150px]">
                      <div className="text-center">
                        <p className={`text-5xl font-bold ${metrics.satisfaction.avg_belonging_delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {metrics.satisfaction.avg_belonging_delta > 0 ? '+' : ''}{metrics.satisfaction.avg_belonging_delta}
                        </p>
                        <p className="text-muted-foreground mt-2">
                          Average improvement
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[150px]">
                      <div className="text-center">
                        <p className="text-5xl font-bold">{metrics.satisfaction.feedback_count}</p>
                        <p className="text-muted-foreground mt-2">Feedback responses</p>
                        {metrics.engagement.quests_completed > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {Math.round((metrics.satisfaction.feedback_count / metrics.engagement.quests_completed) * 100)}% response rate
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="criteria" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Success Criteria Tracker
                  </CardTitle>
                  <CardDescription>Track progress against defined success criteria</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.pilot.success_criteria?.length ? (
                    <div className="space-y-4">
                      {metrics.pilot.success_criteria.map((criterion, index) => {
                        const actual = evaluateCriterion(criterion, metrics);
                        const passed = checkCriterionPassed(criterion, metrics);
                        return (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{criterion.metric}</p>
                              <p className="text-sm text-muted-foreground">{criterion.description}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Target: {criterion.target}</p>
                                <p className="font-medium">Actual: {actual}</p>
                              </div>
                              {passed ? (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                              ) : (
                                <XCircle className="h-6 w-6 text-red-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No success criteria defined for this pilot
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Hypothesis Display */}
              {metrics.pilot.hypothesis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hypothesis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="italic text-muted-foreground">"{metrics.pilot.hypothesis}"</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, icon, description }: { title: string; value: string | number; icon: React.ReactNode; description: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'font-bold text-primary' : 'font-medium'}>{value}</span>
    </div>
  );
}
