/**
 * EnterpriseAnalyticsTab - Aggregate analytics across enterprise orgs
 * 
 * Features:
 * - Summary stats across all orgs
 * - Growth metrics
 * - Engagement metrics
 * - Org comparison charts
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Cell
} from 'recharts';
import { 
  GraduationCap, 
  Building2, 
  Users, 
  Calendar,
  TrendingUp,
  Loader2,
  Target,
  UserPlus
} from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#22c55e', '#f59e0b', '#ef4444'];

export function EnterpriseAnalyticsTab() {
  // Fetch aggregate stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['enterprise-analytics'],
    queryFn: async () => {
      // Count umbrella orgs
      const { count: umbrellaCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('is_umbrella', true);

      // Count clubs (non-umbrella)
      const { count: clubCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('is_umbrella', false);

      // Count total members across orgs
      const { count: memberCount } = await supabase
        .from('profile_organizations')
        .select('*', { count: 'exact', head: true });

      // Count active quests with org_id
      const { count: questCount } = await supabase
        .from('quests')
        .select('*', { count: 'exact', head: true })
        .not('org_id', 'is', null)
        .eq('status', 'open');

      // Count cliques
      const { count: cliqueCount } = await supabase
        .from('squads')
        .select('*', { count: 'exact', head: true })
        .is('archived_at', null);

      // Get top orgs by member count
      const { data: topOrgs } = await supabase
        .from('organizations')
        .select('id, name, is_umbrella')
        .eq('is_umbrella', true)
        .limit(10);

      const topOrgsWithCounts = await Promise.all(
        (topOrgs || []).map(async (org) => {
          const { count } = await supabase
            .from('profile_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id);

          const { count: childCount } = await supabase
            .from('organizations')
            .select('*', { count: 'exact', head: true })
            .eq('parent_org_id', org.id);

          return {
            name: org.name,
            members: count || 0,
            clubs: childCount || 0,
          };
        })
      );

      // Get org type distribution
      const { data: orgTypes } = await supabase
        .from('organizations')
        .select('type')
        .eq('is_umbrella', false);

      const typeDistribution: Record<string, number> = {};
      (orgTypes || []).forEach(o => {
        const t = o.type || 'other';
        typeDistribution[t] = (typeDistribution[t] || 0) + 1;
      });

      return {
        umbrellaCount: umbrellaCount || 0,
        clubCount: clubCount || 0,
        memberCount: memberCount || 0,
        questCount: questCount || 0,
        cliqueCount: cliqueCount || 0,
        topOrgs: topOrgsWithCounts.sort((a, b) => b.members - a.members),
        typeDistribution: Object.entries(typeDistribution).map(([name, value]) => ({
          name: name.replace('_', ' '),
          value,
        })),
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-display font-bold">Enterprise Analytics</h2>
        <p className="text-muted-foreground text-sm">
          Aggregate metrics across all enterprise organizations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.umbrellaCount}</p>
                <p className="text-sm text-muted-foreground">Enterprise Orgs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.clubCount}</p>
                <p className="text-sm text-muted-foreground">Clubs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.memberCount?.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.questCount}</p>
                <p className="text-sm text-muted-foreground">Active Quests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.cliqueCount}</p>
                <p className="text-sm text-muted-foreground">Active Cliques</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Orgs by Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Organizations by Members
            </CardTitle>
            <CardDescription>
              Umbrella organizations ranked by total membership
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topOrgs && stats.topOrgs.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topOrgs} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="members" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Club Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Club Type Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of clubs by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.typeDistribution && stats.typeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.typeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clubs per Org */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Clubs per Enterprise Organization
          </CardTitle>
          <CardDescription>
            Number of child clubs under each umbrella org
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.topOrgs && stats.topOrgs.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topOrgs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="clubs" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
