/**
 * =============================================================================
 * REFERRAL ANALYTICS - Admin dashboard for friend recruitment metrics
 * =============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  UserPlus, 
  Users, 
  TrendingUp, 
  Trophy,
  Calendar,
  Target,
  ArrowRight
} from 'lucide-react';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
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
} from 'recharts';

interface ReferralStats {
  totalInvites: number;
  totalRedeemed: number;
  conversionRate: number;
  thisWeek: number;
  thisMonth: number;
  topRecruiters: Array<{
    user_id: string;
    display_name: string;
    count: number;
  }>;
  distributionData: Array<{
    range: string;
    count: number;
  }>;
  dailyData: Array<{
    date: string;
    created: number;
    redeemed: number;
  }>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function ReferralAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['referral-analytics'],
    queryFn: async (): Promise<ReferralStats> => {
      const weekStart = startOfWeek(new Date());
      const monthStart = startOfMonth(new Date());
      const thirtyDaysAgo = subDays(new Date(), 30);

      // Fetch all friend invites
      const { data: invites, error } = await supabase
        .from('friend_invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allInvites = invites || [];
      const redeemedInvites = allInvites.filter(i => i.redeemed_at);
      
      // Calculate stats
      const totalInvites = allInvites.length;
      const totalRedeemed = redeemedInvites.length;
      const conversionRate = totalInvites > 0 
        ? Math.round((totalRedeemed / totalInvites) * 100) 
        : 0;

      // This week/month
      const thisWeek = redeemedInvites.filter(
        i => new Date(i.redeemed_at!) >= weekStart
      ).length;
      const thisMonth = redeemedInvites.filter(
        i => new Date(i.redeemed_at!) >= monthStart
      ).length;

      // Top recruiters - count by referrer
      const referrerCounts = new Map<string, number>();
      redeemedInvites.forEach(inv => {
        const count = referrerCounts.get(inv.referrer_user_id) || 0;
        referrerCounts.set(inv.referrer_user_id, count + 1);
      });

      const topReferrerIds = Array.from(referrerCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Fetch profile names for top recruiters
      const topRecruiters: ReferralStats['topRecruiters'] = [];
      if (topReferrerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', topReferrerIds.map(([id]) => id));

        topReferrerIds.forEach(([userId, count]) => {
          const profile = profiles?.find(p => p.id === userId);
          topRecruiters.push({
            user_id: userId,
            display_name: profile?.display_name || 'Unknown User',
            count,
          });
        });
      }

      // Distribution data
      const userCounts = new Map<string, number>();
      redeemedInvites.forEach(inv => {
        const count = userCounts.get(inv.referrer_user_id) || 0;
        userCounts.set(inv.referrer_user_id, count + 1);
      });

      const distributionBuckets = { '1-2': 0, '3-5': 0, '6-9': 0, '10+': 0 };
      userCounts.forEach(count => {
        if (count >= 10) distributionBuckets['10+']++;
        else if (count >= 6) distributionBuckets['6-9']++;
        else if (count >= 3) distributionBuckets['3-5']++;
        else distributionBuckets['1-2']++;
      });

      const distributionData = Object.entries(distributionBuckets).map(([range, count]) => ({
        range,
        count,
      }));

      // Daily data for last 30 days
      const dailyMap = new Map<string, { created: number; redeemed: number }>();
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyMap.set(date, { created: 0, redeemed: 0 });
      }

      allInvites.forEach(inv => {
        const createdDate = format(new Date(inv.created_at), 'yyyy-MM-dd');
        if (dailyMap.has(createdDate)) {
          dailyMap.get(createdDate)!.created++;
        }
        if (inv.redeemed_at) {
          const redeemedDate = format(new Date(inv.redeemed_at), 'yyyy-MM-dd');
          if (dailyMap.has(redeemedDate)) {
            dailyMap.get(redeemedDate)!.redeemed++;
          }
        }
      });

      const dailyData = Array.from(dailyMap.entries())
        .map(([date, counts]) => ({
          date: format(new Date(date), 'MMM d'),
          ...counts,
        }))
        .reverse();

      return {
        totalInvites,
        totalRedeemed,
        conversionRate,
        thisWeek,
        thisMonth,
        topRecruiters,
        distributionData,
        dailyData,
      };
    },
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Friend Referrals</h2>
        <p className="text-muted-foreground">Track friend recruitment performance and conversions</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalInvites || 0}</p>
                <p className="text-xs text-muted-foreground">Invites Created</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Users className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalRedeemed || 0}</p>
                <p className="text-xs text-muted-foreground">Friends Recruited</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.conversionRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.thisWeek || 0}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Referral Activity (30 Days)</CardTitle>
            <CardDescription>Invites created vs redeemed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.dailyData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="created" fill="hsl(var(--muted-foreground))" name="Created" />
                  <Bar dataKey="redeemed" fill="hsl(var(--primary))" name="Redeemed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Recruiters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top Recruiters
            </CardTitle>
            <CardDescription>Users with most successful referrals</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topRecruiters.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recruitments yet
              </p>
            ) : (
              <div className="space-y-3">
                {stats?.topRecruiters.map((recruiter, index) => (
                  <div 
                    key={recruiter.user_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? 'default' : 'outline'}>
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">{recruiter.display_name}</span>
                    </div>
                    <Badge variant="secondary">
                      {recruiter.count} friend{recruiter.count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recruiter Distribution</CardTitle>
            <CardDescription>Users grouped by recruitment count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.distributionData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="range"
                    label={({ range, count }) => count > 0 ? `${range}: ${count}` : ''}
                  >
                    {stats?.distributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {stats?.distributionData.map((item, index) => (
                <div key={item.range} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{item.range} friends</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Conversion Funnel
            </CardTitle>
            <CardDescription>From invite creation to signup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold">{stats?.totalInvites || 0}</p>
                  <p className="text-sm text-muted-foreground">Invites Created</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 p-4 rounded-lg bg-primary/10 text-center">
                  <p className="text-3xl font-bold text-primary">{stats?.totalRedeemed || 0}</p>
                  <p className="text-sm text-muted-foreground">Signups</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Conversion</span>
                  <span className="text-lg font-bold">{stats?.conversionRate || 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-primary rounded-full h-3 transition-all duration-500"
                    style={{ width: `${stats?.conversionRate || 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xl font-bold">{stats?.thisWeek || 0}</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xl font-bold">{stats?.thisMonth || 0}</p>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
