import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useCreatorAnalytics } from '@/hooks/useCreatorAnalytics';
import { Loader2, TrendingUp, CheckCircle, Star, MessageSquareQuote, Users } from 'lucide-react';
import { format } from 'date-fns';

interface CreatorAnalyticsProps {
  userId: string | undefined;
}

const RATING_COLORS = ['hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--muted))', 'hsl(var(--primary))', 'hsl(var(--accent))'];

export function CreatorAnalytics({ userId }: CreatorAnalyticsProps) {
  const { data: analytics, isLoading } = useCreatorAnalytics(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) return null;

  const chartConfig = {
    count: {
      label: 'Signups',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Signups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalSignups}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Completion Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {analytics.completionRate.toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Avg Rating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-500">
              {analytics.avgRating !== null ? analytics.avgRating.toFixed(1) : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4" />
              Reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalReviews}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Signup Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Signup Trends
            </CardTitle>
            <CardDescription>Monthly signups over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.signupsByMonth.every(m => m.count === 0) ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No signup data yet
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-48 w-full">
                <BarChart data={analytics.signupsByMonth}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5" />
              Rating Distribution
            </CardTitle>
            <CardDescription>How participants rated your quests</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.totalReviews === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No ratings yet
              </div>
            ) : (
              <div className="flex items-center gap-4 h-48">
                <div className="w-1/2">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <PieChart>
                      <Pie
                        data={analytics.ratingDistribution.filter(r => r.count > 0)}
                        dataKey="count"
                        nameKey="rating"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                      >
                        {analytics.ratingDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={RATING_COLORS[entry.rating - 1]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {analytics.ratingDistribution.map((item) => (
                    <div key={item.rating} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: RATING_COLORS[item.rating - 1] }} 
                      />
                      <span className="flex-1">{item.rating} star{item.rating !== 1 ? 's' : ''}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Testimonials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5" />
            Approved Testimonials
          </CardTitle>
          <CardDescription>What participants are saying about your quests</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.testimonials.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <MessageSquareQuote className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No testimonials yet</p>
              <p className="text-sm">Keep creating great experiences — testimonials will appear here!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm italic mb-3">"{testimonial.text}"</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{testimonial.questTitle}</span>
                      <span>{format(new Date(testimonial.submittedAt), 'MMM d, yyyy')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
