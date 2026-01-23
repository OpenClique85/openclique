/**
 * =============================================================================
 * SQUAD HEALTH DASHBOARD - Completion rates, ratings, and retention trends
 * =============================================================================
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  Activity,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Repeat,
  BarChart3,
} from 'lucide-react';

interface SquadHealthData {
  id: string;
  squadName: string;
  questTitle: string;
  scheduledDate: string | null;
  memberCount: number;
  completedCount: number;
  avgRating: number | null;
  feedbackCount: number;
  wouldDoAgainCount: number;
  wouldDoAgainTotal: number;
  status: string;
}

export function SquadHealthDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['squad-health-metrics'],
    queryFn: async () => {
      // Get all squads
      const { data: squads, error: squadsError } = await supabase
        .from('quest_squads')
        .select('id, squad_name, status, quest_id, created_at')
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (squadsError) throw squadsError;
      if (!squads?.length) return { squads: [], trends: [], summary: null };

      // Get quest/instance info
      const questIds = [...new Set(squads.map(s => s.quest_id).filter(Boolean))];
      
      const { data: instances } = await supabase
        .from('quest_instances')
        .select('id, title, scheduled_date, status')
        .in('id', questIds);

      const { data: quests } = await supabase
        .from('quests')
        .select('id, title, start_datetime')
        .in('id', questIds);

      // Build quest lookup
      const questLookup: Record<string, { title: string; date: string | null; status?: string }> = {};
      instances?.forEach(i => {
        questLookup[i.id] = { title: i.title || 'Unknown', date: i.scheduled_date, status: i.status };
      });
      quests?.forEach(q => {
        if (!questLookup[q.id]) {
          questLookup[q.id] = { title: q.title || 'Unknown', date: q.start_datetime };
        }
      });

      // Get members per squad
      const squadIds = squads.map(s => s.id);
      const { data: members } = await supabase
        .from('squad_members')
        .select('squad_id, user_id, added_at')
        .in('squad_id', squadIds);

      // Get signups for completion tracking
      const { data: signups } = await supabase
        .from('quest_signups')
        .select('quest_id, user_id, status')
        .in('quest_id', questIds);

      // Get feedback
      const { data: feedback } = await supabase
        .from('feedback')
        .select('quest_id, user_id, rating_1_5, would_do_again, submitted_at')
        .in('quest_id', questIds);

      // Build lookups
      const membersBySquad = (members || []).reduce((acc, m) => {
        if (!acc[m.squad_id]) acc[m.squad_id] = [];
        acc[m.squad_id].push(m);
        return acc;
      }, {} as Record<string, { squad_id: string; user_id: string; added_at: string }[]>);

      const signupsByQuest = (signups || []).reduce((acc, s) => {
        if (!acc[s.quest_id]) acc[s.quest_id] = [];
        acc[s.quest_id].push(s);
        return acc;
      }, {} as Record<string, typeof signups>);

      const feedbackByQuest = (feedback || []).reduce((acc, f) => {
        if (!acc[f.quest_id]) acc[f.quest_id] = [];
        acc[f.quest_id].push(f);
        return acc;
      }, {} as Record<string, typeof feedback>);

      // Calculate per-squad health data
      const squadHealth: SquadHealthData[] = squads.map(squad => {
        const questInfo = questLookup[squad.quest_id] || { title: 'Unknown', date: null };
        const squadMembers = membersBySquad[squad.id] || [];
        const questSignups = signupsByQuest[squad.quest_id] || [];
        const questFeedback = feedbackByQuest[squad.quest_id] || [];

        // Member user IDs
        const memberUserIds = new Set(squadMembers.map(m => m.user_id));

        // Completed members (completed signups matching squad members)
        const completedCount = questSignups.filter(
          s => s.status === 'completed' && memberUserIds.has(s.user_id)
        ).length;

        // Feedback from squad members
        const memberFeedback = questFeedback.filter(f => memberUserIds.has(f.user_id));
        const ratings = memberFeedback.map(f => f.rating_1_5).filter(Boolean) as number[];
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

        const wouldDoAgain = memberFeedback.filter(f => f.would_do_again !== null);
        const wouldDoAgainCount = wouldDoAgain.filter(f => f.would_do_again).length;

        return {
          id: squad.id,
          squadName: squad.squad_name || 'Unnamed Squad',
          questTitle: questInfo.title,
          scheduledDate: questInfo.date,
          memberCount: squadMembers.length,
          completedCount,
          avgRating,
          feedbackCount: memberFeedback.length,
          wouldDoAgainCount,
          wouldDoAgainTotal: wouldDoAgain.length,
          status: squad.status,
        };
      });

      // Calculate trends over the last 30 days
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const dateRange = eachDayOfInterval({ start: thirtyDaysAgo, end: now });

      const trendData = dateRange.map(date => {
        const dayStart = startOfDay(date);
        const dayStr = format(date, 'yyyy-MM-dd');

        // Squads created up to this day
        const squadsToDate = squads.filter(s => new Date(s.created_at) <= date);
        
        // Feedback submitted on this day
        const dayFeedback = (feedback || []).filter(f => 
          format(new Date(f.submitted_at), 'yyyy-MM-dd') === dayStr
        );

        const dayRatings = dayFeedback.map(f => f.rating_1_5).filter(Boolean) as number[];
        const avgDayRating = dayRatings.length > 0 
          ? dayRatings.reduce((a, b) => a + b, 0) / dayRatings.length 
          : null;

        // Calculate cumulative completion rate
        let totalMembers = 0;
        let totalCompleted = 0;
        squadsToDate.forEach(squad => {
          const squadMembers = membersBySquad[squad.id] || [];
          const questSignups = signupsByQuest[squad.quest_id] || [];
          const memberUserIds = new Set(squadMembers.map(m => m.user_id));
          
          totalMembers += squadMembers.length;
          totalCompleted += questSignups.filter(
            s => s.status === 'completed' && memberUserIds.has(s.user_id)
          ).length;
        });

        return {
          date: format(date, 'MMM d'),
          squads: squadsToDate.length,
          avgRating: avgDayRating,
          completionRate: totalMembers > 0 ? (totalCompleted / totalMembers) * 100 : 0,
          feedbackSubmissions: dayFeedback.length,
        };
      });

      // Calculate summary metrics
      const totalMembers = squadHealth.reduce((sum, s) => sum + s.memberCount, 0);
      const totalCompleted = squadHealth.reduce((sum, s) => sum + s.completedCount, 0);
      const allRatings = squadHealth.filter(s => s.avgRating !== null).map(s => s.avgRating!);
      const overallAvgRating = allRatings.length > 0 
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length 
        : 0;
      
      const totalWouldDoAgain = squadHealth.reduce((sum, s) => sum + s.wouldDoAgainCount, 0);
      const totalWouldDoAgainResponses = squadHealth.reduce((sum, s) => sum + s.wouldDoAgainTotal, 0);

      // Calculate retention (users in multiple squads)
      const allMembers = members || [];
      const userSquadCounts: Record<string, number> = {};
      allMembers.forEach(m => {
        userSquadCounts[m.user_id] = (userSquadCounts[m.user_id] || 0) + 1;
      });
      const uniqueUsers = Object.keys(userSquadCounts).length;
      const returningUsers = Object.values(userSquadCounts).filter(c => c > 1).length;

      return {
        squads: squadHealth,
        trends: trendData,
        summary: {
          totalSquads: squadHealth.length,
          totalMembers,
          completionRate: totalMembers > 0 ? (totalCompleted / totalMembers) * 100 : 0,
          avgRating: overallAvgRating,
          wouldDoAgainRate: totalWouldDoAgainResponses > 0 
            ? (totalWouldDoAgain / totalWouldDoAgainResponses) * 100 
            : 0,
          retentionRate: uniqueUsers > 0 ? (returningUsers / uniqueUsers) * 100 : 0,
          uniqueUsers,
          returningUsers,
        },
      };
    },
  });

  const topSquads = useMemo(() => {
    if (!data?.squads) return [];
    return [...data.squads]
      .filter(s => s.avgRating !== null)
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
      .slice(0, 5);
  }, [data]);

  const atRiskSquads = useMemo(() => {
    if (!data?.squads) return [];
    return data.squads.filter(s => {
      const completionRate = s.memberCount > 0 ? (s.completedCount / s.memberCount) * 100 : 0;
      return completionRate < 50 && s.memberCount > 0;
    }).slice(0, 5);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCcw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.summary) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No squad data available yet.
        </CardContent>
      </Card>
    );
  }

  const { summary, trends } = data;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Total Squads
            </div>
            <div className="text-2xl font-bold mt-1">{summary.totalSquads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Activity className="h-4 w-4" />
              Total Members
            </div>
            <div className="text-2xl font-bold mt-1">{summary.totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Completion Rate
            </div>
            <div className="text-2xl font-bold mt-1">{summary.completionRate.toFixed(0)}%</div>
            <Progress value={summary.completionRate} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Star className="h-4 w-4" />
              Avg Rating
            </div>
            <div className="text-2xl font-bold mt-1">{summary.avgRating.toFixed(1)}/5</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Repeat className="h-4 w-4" />
              Would Repeat
            </div>
            <div className="text-2xl font-bold mt-1">{summary.wouldDoAgainRate.toFixed(0)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              Retention
            </div>
            <div className="text-2xl font-bold mt-1">{summary.retentionRate.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {summary.returningUsers}/{summary.uniqueUsers} return
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            30-Day Trends
          </CardTitle>
          <CardDescription>
            Squad growth, completion rates, and feedback over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis yAxisId="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="squads"
                  name="Total Squads"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="completionRate"
                  name="Completion %"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="feedbackSubmissions"
                  name="Feedback"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Squads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Top Performing Squads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSquads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rated squads yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Squad</TableHead>
                    <TableHead>Quest</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSquads.map((squad) => (
                    <TableRow key={squad.id}>
                      <TableCell className="font-medium">{squad.squadName}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {squad.questTitle}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {squad.avgRating?.toFixed(1)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* At-Risk Squads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4 text-red-500" />
              At-Risk Squads (Low Completion)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atRiskSquads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No at-risk squads 🎉</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Squad</TableHead>
                    <TableHead>Quest</TableHead>
                    <TableHead className="text-right">Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRiskSquads.map((squad) => {
                    const completionRate = squad.memberCount > 0 
                      ? (squad.completedCount / squad.memberCount) * 100 
                      : 0;
                    return (
                      <TableRow key={squad.id}>
                        <TableCell className="font-medium">{squad.squadName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {squad.questTitle}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive" className="text-xs">
                            {completionRate.toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Retention Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Member Retention Analysis</CardTitle>
          <CardDescription>
            How many users return for additional quests with their squads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-4xl font-bold text-primary">{summary.uniqueUsers}</div>
              <div className="text-sm text-muted-foreground mt-1">Unique Members</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-4xl font-bold text-chart-2">{summary.returningUsers}</div>
              <div className="text-sm text-muted-foreground mt-1">Returning Members</div>
              <div className="text-xs text-muted-foreground">(2+ squads)</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-4xl font-bold text-chart-1">{summary.retentionRate.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground mt-1">Retention Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
