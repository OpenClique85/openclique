/**
 * =============================================================================
 * SQUAD COMPARISON VIEW - Compare referral-based vs compatibility-matched squads
 * =============================================================================
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Link2,
  Brain,
  TrendingUp,
  Star,
  RefreshCcw,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface FormationReason {
  primary_factor: 'referral_cluster' | 'compatibility' | 'fill_remaining';
  referral_bonds: number;
  compatibility_breakdown?: {
    vibe_similarity: number;
    age_proximity: number;
    area_proximity: number;
    interest_overlap: number;
    context_overlap: number;
  };
}

interface SquadMetrics {
  total: number;
  avgRating: number;
  completionRate: number;
  wouldDoAgainRate: number;
  avgCompatibilityScore: number;
  avgReferralBonds: number;
  retentionRate: number;
}

interface ComparisonData {
  referral: SquadMetrics;
  compatibility: SquadMetrics;
  fillRemaining: SquadMetrics;
}

const CHART_COLORS = {
  referral: 'hsl(var(--chart-1))',
  compatibility: 'hsl(var(--chart-2))',
  fillRemaining: 'hsl(var(--chart-3))',
};

export function SquadComparisonView() {
  const { data, isLoading } = useQuery({
    queryKey: ['squad-comparison-metrics'],
    queryFn: async () => {
      // Get all squads with formation data
      const { data: squads, error: squadsError } = await supabase
        .from('quest_squads')
        .select('id, formation_reason, compatibility_score, referral_bonds, quest_id, status, created_at')
        .not('formation_reason', 'is', null);

      if (squadsError) throw squadsError;
      if (!squads?.length) return null;

      // Get all feedback
      const questIds = [...new Set(squads.map(s => s.quest_id).filter(Boolean))];
      const { data: feedback } = await supabase
        .from('feedback')
        .select('quest_id, rating_1_5, would_do_again, testimonial_text, is_testimonial_approved')
        .in('quest_id', questIds);

      // Get signups for completion tracking
      const { data: signups } = await supabase
        .from('quest_signups')
        .select('quest_id, status, user_id')
        .in('quest_id', questIds);

      // Get squad members for retention analysis
      const squadIds = squads.map(s => s.id);
      const { data: members } = await supabase
        .from('squad_members')
        .select('squad_id, user_id')
        .in('squad_id', squadIds);

      // Build feedback lookup by quest_id
      const feedbackByQuest = (feedback || []).reduce((acc, f) => {
        if (!acc[f.quest_id]) acc[f.quest_id] = [];
        acc[f.quest_id].push(f);
        return acc;
      }, {} as Record<string, typeof feedback>);

      // Build signups lookup
      const signupsByQuest = (signups || []).reduce((acc, s) => {
        if (!acc[s.quest_id]) acc[s.quest_id] = [];
        acc[s.quest_id].push(s);
        return acc;
      }, {} as Record<string, typeof signups>);

      // Build members lookup
      const membersBySquad = (members || []).reduce((acc, m) => {
        if (!acc[m.squad_id]) acc[m.squad_id] = [];
        acc[m.squad_id].push(m);
        return acc;
      }, {} as Record<string, typeof members>);

      // Categorize squads and calculate metrics
      const categories: Record<string, typeof squads> = {
        referral_cluster: [],
        compatibility: [],
        fill_remaining: [],
      };

      squads.forEach(squad => {
        const reason = squad.formation_reason as unknown as FormationReason | null;
        if (reason?.primary_factor) {
          categories[reason.primary_factor]?.push(squad);
        }
      });
      const calculateMetrics = (categorySquads: typeof squads): SquadMetrics => {
        if (!categorySquads.length) {
          return {
            total: 0,
            avgRating: 0,
            completionRate: 0,
            wouldDoAgainRate: 0,
            avgCompatibilityScore: 0,
            avgReferralBonds: 0,
            retentionRate: 0,
          };
        }

        let totalRatings = 0;
        let ratingSum = 0;
        let wouldDoAgainCount = 0;
        let wouldDoAgainTotal = 0;
        let completedCount = 0;
        let signupTotal = 0;
        let compatibilitySum = 0;
        let referralBondsSum = 0;

        categorySquads.forEach(squad => {
          // Ratings and would do again from feedback
          const questFeedback = feedbackByQuest[squad.quest_id] || [];
          questFeedback.forEach(f => {
            if (f.rating_1_5) {
              ratingSum += f.rating_1_5;
              totalRatings++;
            }
            if (f.would_do_again !== null) {
              wouldDoAgainTotal++;
              if (f.would_do_again) wouldDoAgainCount++;
            }
          });

          // Completion from signups
          const questSignups = signupsByQuest[squad.quest_id] || [];
          signupTotal += questSignups.length;
          completedCount += questSignups.filter(s => s.status === 'completed').length;

          // Compatibility score
          if (squad.compatibility_score) {
            compatibilitySum += Number(squad.compatibility_score);
          }

          // Referral bonds
          if (squad.referral_bonds) {
            referralBondsSum += squad.referral_bonds;
          }
        });

        // Calculate member retention (users who joined multiple squads)
        const userSquadCounts: Record<string, number> = {};
        categorySquads.forEach(squad => {
          const squadMembers = membersBySquad[squad.id] || [];
          squadMembers.forEach(m => {
            userSquadCounts[m.user_id] = (userSquadCounts[m.user_id] || 0) + 1;
          });
        });
        const totalUsers = Object.keys(userSquadCounts).length;
        const returningUsers = Object.values(userSquadCounts).filter(c => c > 1).length;

        return {
          total: categorySquads.length,
          avgRating: totalRatings > 0 ? ratingSum / totalRatings : 0,
          completionRate: signupTotal > 0 ? (completedCount / signupTotal) * 100 : 0,
          wouldDoAgainRate: wouldDoAgainTotal > 0 ? (wouldDoAgainCount / wouldDoAgainTotal) * 100 : 0,
          avgCompatibilityScore: categorySquads.length > 0 ? compatibilitySum / categorySquads.length : 0,
          avgReferralBonds: categorySquads.length > 0 ? referralBondsSum / categorySquads.length : 0,
          retentionRate: totalUsers > 0 ? (returningUsers / totalUsers) * 100 : 0,
        };
      };

      return {
        referral: calculateMetrics(categories.referral_cluster),
        compatibility: calculateMetrics(categories.compatibility),
        fillRemaining: calculateMetrics(categories.fill_remaining),
      } as ComparisonData;
    },
  });

  const comparisonChartData = useMemo(() => {
    if (!data) return [];
    return [
      {
        metric: 'Avg Rating',
        'Referral-Based': data.referral.avgRating,
        'Compatibility': data.compatibility.avgRating,
        'Fill Remaining': data.fillRemaining.avgRating,
      },
      {
        metric: 'Completion %',
        'Referral-Based': data.referral.completionRate,
        'Compatibility': data.compatibility.completionRate,
        'Fill Remaining': data.fillRemaining.completionRate,
      },
      {
        metric: 'Would Repeat %',
        'Referral-Based': data.referral.wouldDoAgainRate,
        'Compatibility': data.compatibility.wouldDoAgainRate,
        'Fill Remaining': data.fillRemaining.wouldDoAgainRate,
      },
      {
        metric: 'Retention %',
        'Referral-Based': data.referral.retentionRate,
        'Compatibility': data.compatibility.retentionRate,
        'Fill Remaining': data.fillRemaining.retentionRate,
      },
    ];
  }, [data]);

  const distributionData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Referral-Based', value: data.referral.total, fill: CHART_COLORS.referral },
      { name: 'Compatibility', value: data.compatibility.total, fill: CHART_COLORS.compatibility },
      { name: 'Fill Remaining', value: data.fillRemaining.total, fill: CHART_COLORS.fillRemaining },
    ];
  }, [data]);

  const radarData = useMemo(() => {
    if (!data) return [];
    return [
      { metric: 'Avg Rating', referral: data.referral.avgRating * 20, compatibility: data.compatibility.avgRating * 20 },
      { metric: 'Completion', referral: data.referral.completionRate, compatibility: data.compatibility.completionRate },
      { metric: 'Repeat Intent', referral: data.referral.wouldDoAgainRate, compatibility: data.compatibility.wouldDoAgainRate },
      { metric: 'Retention', referral: data.referral.retentionRate, compatibility: data.compatibility.retentionRate },
      { metric: 'Compatibility', referral: data.referral.avgCompatibilityScore * 100, compatibility: data.compatibility.avgCompatibilityScore * 100 },
    ];
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCcw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No squad formation data available yet. Squads need to be created using the recommendation algorithm first.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4" style={{ borderLeftColor: CHART_COLORS.referral }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4" />
              Referral-Based Squads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.referral.total}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Star className="h-3 w-3" />
              Avg Rating: {data.referral.avgRating.toFixed(1)}/5
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              {data.referral.completionRate.toFixed(0)}% completion
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: CHART_COLORS.compatibility }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4" />
              Compatibility-Matched
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.compatibility.total}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Star className="h-3 w-3" />
              Avg Rating: {data.compatibility.avgRating.toFixed(1)}/5
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              {data.compatibility.completionRate.toFixed(0)}% completion
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: CHART_COLORS.fillRemaining }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Fill Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.fillRemaining.total}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Star className="h-3 w-3" />
              Avg Rating: {data.fillRemaining.avgRating.toFixed(1)}/5
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              {data.fillRemaining.completionRate.toFixed(0)}% completion
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
          <CardDescription>
            Comparing key metrics across different squad formation strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="metric" type="category" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="Referral-Based" fill={CHART_COLORS.referral} radius={[0, 4, 4, 0]} />
                <Bar dataKey="Compatibility" fill={CHART_COLORS.compatibility} radius={[0, 4, 4, 0]} />
                <Bar dataKey="Fill Remaining" fill={CHART_COLORS.fillRemaining} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Head-to-Head: Referral vs Compatibility</CardTitle>
            <CardDescription>
              Normalized comparison of the two primary formation strategies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="metric" className="text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Referral-Based"
                    dataKey="referral"
                    stroke={CHART_COLORS.referral}
                    fill={CHART_COLORS.referral}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Compatibility"
                    dataKey="compatibility"
                    stroke={CHART_COLORS.compatibility}
                    fill={CHART_COLORS.compatibility}
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Formation Strategy Distribution</CardTitle>
            <CardDescription>
              Breakdown of how squads are being formed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                Referral Bonds Impact
              </h4>
              <p className="text-sm text-muted-foreground">
                Squads with referral bonds average <strong>{data.referral.avgReferralBonds.toFixed(1)} connections</strong> per squad.
                {data.referral.wouldDoAgainRate > data.compatibility.wouldDoAgainRate
                  ? ` These squads show ${(data.referral.wouldDoAgainRate - data.compatibility.wouldDoAgainRate).toFixed(0)}% higher repeat intent.`
                  : ' Compatibility-matched squads show higher repeat intent.'}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Would Do Again</span>
                  <span className="font-medium">{data.referral.wouldDoAgainRate.toFixed(0)}%</span>
                </div>
                <Progress value={data.referral.wouldDoAgainRate} className="h-2" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                Compatibility Matching Effectiveness
              </h4>
              <p className="text-sm text-muted-foreground">
                Algorithm-matched squads have an average compatibility score of <strong>{(data.compatibility.avgCompatibilityScore * 100).toFixed(0)}%</strong>.
                {data.compatibility.retentionRate > data.referral.retentionRate
                  ? ` They show ${(data.compatibility.retentionRate - data.referral.retentionRate).toFixed(0)}% higher member retention.`
                  : ' Referral-based squads show higher member retention.'}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Member Retention</span>
                  <span className="font-medium">{data.compatibility.retentionRate.toFixed(0)}%</span>
                </div>
                <Progress value={data.compatibility.retentionRate} className="h-2" />
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {data.referral.total + data.compatibility.total + data.fillRemaining.total} Total Squads Analyzed
            </Badge>
            {data.referral.avgRating > data.compatibility.avgRating ? (
              <Badge className="bg-chart-1/20 text-chart-1 border-chart-1">
                Referral squads rated higher
              </Badge>
            ) : (
              <Badge className="bg-chart-2/20 text-chart-2 border-chart-2">
                Compatibility squads rated higher
              </Badge>
            )}
            {data.referral.completionRate > data.compatibility.completionRate ? (
              <Badge className="bg-chart-1/20 text-chart-1 border-chart-1">
                Referral squads complete more
              </Badge>
            ) : (
              <Badge className="bg-chart-2/20 text-chart-2 border-chart-2">
                Compatibility squads complete more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
