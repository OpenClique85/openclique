import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, GraduationCap, Users, TrendingUp, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export function TutorialQuestAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-tutorial-analytics'],
    queryFn: async () => {
      // Get all profiles with any tutorial interaction
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, tutorial_quest_completed_at, tutorial_quest_step, tutorial_quest_dismissed_count, created_at');

      if (error) throw error;

      const total = profiles?.length ?? 0;
      const completed = profiles?.filter(p => p.tutorial_quest_completed_at).length ?? 0;
      const started = profiles?.filter(p => (p.tutorial_quest_step ?? 0) > 0).length ?? 0;
      const dismissed3 = profiles?.filter(p => (p.tutorial_quest_dismissed_count ?? 0) >= 3).length ?? 0;

      // Average step for non-completers who started
      const nonCompleters = profiles?.filter(p => !p.tutorial_quest_completed_at && (p.tutorial_quest_step ?? 0) > 0) ?? [];
      const avgStep = nonCompleters.length > 0
        ? nonCompleters.reduce((sum, p) => sum + (p.tutorial_quest_step ?? 0), 0) / nonCompleters.length
        : 0;

      // Recent completions
      const recent = profiles
        ?.filter(p => p.tutorial_quest_completed_at)
        .sort((a, b) => new Date(b.tutorial_quest_completed_at!).getTime() - new Date(a.tutorial_quest_completed_at!).getTime())
        .slice(0, 20) ?? [];

      return { total, completed, started, dismissed3, avgStep, recent };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = data!;
  const completionRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold">Tutorial Quest Analytics</h2>
        <p className="text-sm text-muted-foreground">Track how new users engage with the training quest</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">{completionRate}% of all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.started}</p>
            <p className="text-xs text-muted-foreground">began the tutorial</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> Avg Drop-off Step
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.avgStep.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">for non-completers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" /> Dismissed 3x
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.dismissed3}</p>
            <p className="text-xs text-muted-foreground">permanently skipped</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Completions</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No completions yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recent.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.display_name || 'Anonymous'}</TableCell>
                    <TableCell>{format(new Date(user.tutorial_quest_completed_at!), 'MMM d, yyyy h:mm a')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
