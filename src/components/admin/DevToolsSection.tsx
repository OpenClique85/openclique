import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, Users, Trash2, FlaskConical, Sparkles, AlertTriangle, 
  RotateCcw, CheckCircle2, XCircle, ArrowRight 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ScenarioResult {
  scenario: string;
  quest?: { id: string; slug: string; title: string };
  users?: { email: string; userId: string; status?: string }[];
  stuckStates?: { email: string; userId: string; issue: string; details: string }[];
  results?: { email: string; userId: string; squad: string; xpAwarded: number; treeXp: number }[];
  squads?: { id: string; name: string; members: number }[];
  emptySquad?: { id: string; name: string };
  feedbackCount?: number;
}

interface CleanupResult {
  stats: {
    usersDeleted: number;
    profilesDeleted: number;
    questsDeleted: number;
    signupsDeleted: number;
    squadsDeleted: number;
    feedbackDeleted: number;
    xpTransactionsDeleted: number;
  };
}

type ScenarioType = 'happy_path' | 'stuck_states' | 'full_cycle' | 'test_users';

export function DevToolsSection() {
  const [loadingScenario, setLoadingScenario] = useState<ScenarioType | 'cleanup' | null>(null);
  const [lastResult, setLastResult] = useState<ScenarioResult | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);

  const runScenario = async (scenario: ScenarioType) => {
    setLoadingScenario(scenario);
    setLastResult(null);
    
    const endpoints: Record<ScenarioType, string> = {
      happy_path: 'seed-happy-path',
      stuck_states: 'seed-stuck-states',
      full_cycle: 'seed-full-cycle',
      test_users: 'create-test-users',
    };

    try {
      const { data, error } = await supabase.functions.invoke(endpoints[scenario]);

      if (error) {
        console.error(`Error running ${scenario}:`, error);
        toast.error(`Failed to run scenario`, { description: error.message });
        return;
      }

      if (data?.success) {
        setLastResult(data);
        toast.success(`Scenario "${scenario}" completed`, {
          description: `Created ${data.users?.length || data.results?.length || data.stuckStates?.length || 0} test entities`,
        });
      } else {
        toast.error('Scenario failed', { description: data?.error || 'Unknown error' });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to run scenario');
    } finally {
      setLoadingScenario(null);
    }
  };

  const runCleanup = async () => {
    setLoadingScenario('cleanup');
    setCleanupResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-test-data');

      if (error) {
        console.error('Cleanup error:', error);
        toast.error('Failed to cleanup test data', { description: error.message });
        return;
      }

      if (data?.success) {
        setCleanupResult(data);
        setLastResult(null);
        toast.success('Test data cleaned up', {
          description: data.message,
        });
      } else {
        toast.error('Cleanup failed', { description: data?.error || 'Unknown error' });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to cleanup test data');
    } finally {
      setLoadingScenario(null);
    }
  };

  const statusColorMap: Record<string, string> = {
    confirmed: 'bg-green-500/10 text-green-600 border-green-500/20',
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    standby: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    completed: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  };

  const issueColorMap: Record<string, string> = {
    pending_too_long: 'bg-red-500/10 text-red-600 border-red-500/20',
    confirmed_but_quest_ended: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    completed_no_xp: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    standby_quest_ended: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    confirmed_no_squad: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    squad_still_forming: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Scenario Generators */}
      <Card className="border-dashed border-amber-500/50 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Seed Data Scenarios</CardTitle>
          </div>
          <CardDescription>
            Generate test data for specific admin workflow scenarios. All test users use password: <code className="bg-muted px-1 py-0.5 rounded text-xs">TestUser123!</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Happy Path */}
            <Card className="border bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-sm font-medium">Happy Path Quest</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Creates a future quest with 6 users at various positive statuses (4 confirmed, 2 pending).
                  Perfect for testing normal signup flows.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Future quest</Badge>
                  <Badge variant="outline" className="text-xs">6 users</Badge>
                  <Badge variant="outline" className="text-xs">Culture tree</Badge>
                </div>
                <Button
                  size="sm"
                  onClick={() => runScenario('happy_path')}
                  disabled={loadingScenario !== null}
                  className="w-full"
                >
                  {loadingScenario === 'happy_path' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Happy Path
                </Button>
              </CardContent>
            </Card>

            {/* Stuck States */}
            <Card className="border bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <CardTitle className="text-sm font-medium">Stuck States</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Creates intentionally broken states for Flow Debugger testing: pending too long, 
                  missing XP, orphan squads, etc.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Past quest</Badge>
                  <Badge variant="outline" className="text-xs">6 stuck states</Badge>
                  <Badge variant="outline" className="text-xs">Empty squad</Badge>
                </div>
                <Button
                  size="sm"
                  onClick={() => runScenario('stuck_states')}
                  disabled={loadingScenario !== null}
                  variant="outline"
                  className="w-full border-orange-500/50 hover:bg-orange-500/10"
                >
                  {loadingScenario === 'stuck_states' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  Generate Stuck States
                </Button>
              </CardContent>
            </Card>

            {/* Full Cycle */}
            <Card className="border bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-sm font-medium">Full Squad Cycle</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Complete lifecycle: quest → signups → 2 squads → completion → XP awards → 
                  feedback. Tests gamification flow.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Completed quest</Badge>
                  <Badge variant="outline" className="text-xs">2 squads</Badge>
                  <Badge variant="outline" className="text-xs">XP + feedback</Badge>
                </div>
                <Button
                  size="sm"
                  onClick={() => runScenario('full_cycle')}
                  disabled={loadingScenario !== null}
                  variant="outline"
                  className="w-full border-purple-500/50 hover:bg-purple-500/10"
                >
                  {loadingScenario === 'full_cycle' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Generate Full Cycle
                </Button>
              </CardContent>
            </Card>

            {/* Original Test Users */}
            <Card className="border bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-sm font-medium">Basic Test Users</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Original 6 test users (tester1-6) signed up for the demo kayak quest with 
                  mixed statuses.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Demo quest</Badge>
                  <Badge variant="outline" className="text-xs">6 users</Badge>
                  <Badge variant="outline" className="text-xs">Mixed status</Badge>
                </div>
                <Button
                  size="sm"
                  onClick={() => runScenario('test_users')}
                  disabled={loadingScenario !== null}
                  variant="outline"
                  className="w-full"
                >
                  {loadingScenario === 'test_users' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4 mr-2" />
                  )}
                  Generate Basic Users
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {lastResult && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle className="text-base">
                Scenario Result: {lastResult.scenario?.replace('_', ' ')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quest Info */}
            {lastResult.quest && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p className="text-sm font-medium">{lastResult.quest.title}</p>
                <p className="text-xs text-muted-foreground font-mono">{lastResult.quest.slug}</p>
              </div>
            )}

            {/* Squads */}
            {lastResult.squads && lastResult.squads.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Squads Created:</h4>
                <div className="flex flex-wrap gap-2">
                  {lastResult.squads.map((squad) => (
                    <Badge key={squad.id} variant="secondary">
                      {squad.name} ({squad.members} members)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Empty Squad Warning */}
            {lastResult.emptySquad && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-sm text-orange-600">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Empty Squad: {lastResult.emptySquad.name}
                </p>
              </div>
            )}

            {/* Users List - Happy Path */}
            {lastResult.users && lastResult.users.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Users Created:</h4>
                <div className="grid gap-2">
                  {lastResult.users.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-2 rounded bg-background border text-sm"
                    >
                      <span className="font-mono text-xs">{user.email}</span>
                      {user.status && (
                        <Badge variant="outline" className={statusColorMap[user.status] || ''}>
                          {user.status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stuck States List */}
            {lastResult.stuckStates && lastResult.stuckStates.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Stuck States Created:</h4>
                <div className="grid gap-2">
                  {lastResult.stuckStates.map((state) => (
                    <div
                      key={state.userId}
                      className="p-3 rounded bg-background border space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs">{state.email}</span>
                        <Badge variant="outline" className={issueColorMap[state.issue] || 'bg-muted'}>
                          {state.issue.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{state.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Cycle Results */}
            {lastResult.results && lastResult.results.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Completed Users:</h4>
                <div className="grid gap-2">
                  {lastResult.results.map((result) => (
                    <div
                      key={result.userId}
                      className="flex items-center justify-between p-2 rounded bg-background border text-sm"
                    >
                      <span className="font-mono text-xs">{result.email}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{result.squad}</Badge>
                        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                          +{result.xpAwarded} XP
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {lastResult.feedbackCount && lastResult.feedbackCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {lastResult.feedbackCount} feedback submissions created
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cleanup Result */}
      {cleanupResult && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <CardTitle className="text-base">Cleanup Complete</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(cleanupResult.stats).map(([key, value]) => (
                <div key={key} className="p-2 rounded bg-muted/50 text-center">
                  <p className="text-lg font-semibold">{value}</p>
                  <p className="text-xs text-muted-foreground">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cleanup Section */}
      <Card className="border-dashed border-red-500/50 bg-red-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg">Cleanup Test Data</CardTitle>
          </div>
          <CardDescription>
            Remove all test users and associated data (emails ending in @openclique.test). 
            This includes quests, signups, squads, XP, and feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={loadingScenario !== null}
              >
                {loadingScenario === 'cleanup' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Purge All Test Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all test users (@openclique.test) and their 
                  associated data including quests, signups, squads, XP transactions, and feedback.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={runCleanup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Purge All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
