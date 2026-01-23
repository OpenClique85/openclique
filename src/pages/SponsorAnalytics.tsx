import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSponsorAnalytics } from '@/hooks/useSponsorAnalytics';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SponsorPortalNav } from '@/components/sponsors/SponsorPortalNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Loader2, 
  TrendingUp, 
  Users, 
  Gift, 
  Star,
  Calendar,
  Quote,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

const RATING_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export default function SponsorAnalytics() {
  const { user, isLoading: authLoading } = useAuth();

  // Fetch sponsor profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['sponsor-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useSponsorAnalytics(profile?.id);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <CardTitle>Become a Sponsor</CardTitle>
              <CardDescription>
                Partner with OpenClique to reach engaged local audiences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/partners">Learn More About Sponsorship</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Build rating distribution for pie chart
  const ratingDistribution = analytics?.questBreakdown
    .filter(q => q.avgRating)
    .reduce((acc, q) => {
      const rating = Math.round(q.avgRating!);
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>) || {};

  const ratingData = [1, 2, 3, 4, 5].map(rating => ({
    name: `${rating} Star`,
    value: ratingDistribution[rating] || 0,
  }));

  // Build participants by quest chart data
  const participantsData = analytics?.questBreakdown
    .slice(0, 10)
    .map(q => ({
      name: q.questTitle.length > 20 ? q.questTitle.slice(0, 20) + '...' : q.questTitle,
      participants: q.participants,
    })) || [];

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <SponsorPortalNav />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">
                Track your sponsorship impact and ROI
              </p>
            </div>
          </div>

          {analyticsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : analytics?.totalSponsoredQuests === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No sponsored quests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start sponsoring quests to see your analytics here.
                </p>
                <Button asChild>
                  <Link to="/sponsor/discover">Find Quests to Sponsor</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analytics?.totalSponsoredQuests || 0}</p>
                        <p className="text-sm text-muted-foreground">Sponsored Quests</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analytics?.totalParticipants || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Participants</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Star className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {analytics?.averageRating ? analytics.averageRating.toFixed(1) : '—'}
                        </p>
                        <p className="text-sm text-muted-foreground">Avg. Rating</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Gift className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analytics?.totalRedemptions || 0}</p>
                        <p className="text-sm text-muted-foreground">Reward Redemptions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ROI Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-gradient-to-br from-sunset/5 to-transparent border-sunset/20">
                  <CardContent className="pt-6">
                    <p className="text-3xl font-bold text-sunset">
                      {analytics?.redemptionRate?.toFixed(1) || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Redemption Rate</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rewards claimed per participant
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                  <CardContent className="pt-6">
                    <p className="text-3xl font-bold text-primary">
                      {analytics?.completionRate?.toFixed(0) || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Participants who completed quests
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-3xl font-bold">
                      {analytics?.totalRewards || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Rewards</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rewards offered to participants
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-3xl font-bold">
                      {analytics?.testimonials?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Testimonials</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Approved participant feedback
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Engagement Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Engagement Over Time</CardTitle>
                    <CardDescription>Monthly participants and redemptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.engagementTrend && analytics.engagementTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.engagementTrend}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              const [year, month] = value.split('-');
                              return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
                            }}
                          />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(value) => {
                              const [year, month] = value.split('-');
                              return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="participants" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            name="Participants"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="redemptions" 
                            stroke="hsl(24 95% 53%)" 
                            strokeWidth={2}
                            name="Redemptions"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No trend data yet
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Participants by Quest */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Participants by Quest</CardTitle>
                    <CardDescription>Number of participants in each sponsored quest</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {participantsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={participantsData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="participants" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No data yet
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Rating Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rating Distribution</CardTitle>
                    <CardDescription>Ratings across all sponsored quests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ratingData.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={ratingData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                          >
                            {ratingData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={RATING_COLORS[index]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No ratings yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quest Breakdown Table */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-lg">Quest Breakdown</CardTitle>
                  <CardDescription>Detailed metrics for each sponsored quest</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quest</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-center">Participants</TableHead>
                          <TableHead className="text-center">Completion</TableHead>
                          <TableHead className="text-center">Avg Rating</TableHead>
                          <TableHead className="text-center">Redemptions</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics?.questBreakdown.map(quest => (
                          <TableRow key={quest.questId}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {quest.questTitle}
                            </TableCell>
                            <TableCell>
                              {quest.questDate 
                                ? format(new Date(quest.questDate), 'MMM d, yyyy')
                                : '—'
                              }
                            </TableCell>
                            <TableCell className="text-center">{quest.participants}</TableCell>
                            <TableCell className="text-center">
                              {quest.completionRate.toFixed(0)}%
                            </TableCell>
                            <TableCell className="text-center">
                              {quest.avgRating ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                  {quest.avgRating.toFixed(1)}
                                </div>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-center">{quest.redemptions}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/quests/${quest.questId}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonials */}
              {analytics?.testimonials && analytics.testimonials.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Participant Testimonials</CardTitle>
                    <CardDescription>Approved testimonials from sponsored quests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {analytics.testimonials.map((testimonial, i) => (
                        <div key={i} className="bg-muted rounded-lg p-4">
                          <Quote className="h-6 w-6 text-muted-foreground mb-2" />
                          <p className="text-sm mb-3 italic">"{testimonial.text}"</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{testimonial.questTitle}</span>
                            <div className="flex items-center gap-2">
                              {testimonial.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {testimonial.rating}
                                </div>
                              )}
                              {testimonial.questDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(testimonial.questDate), 'MMM yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
