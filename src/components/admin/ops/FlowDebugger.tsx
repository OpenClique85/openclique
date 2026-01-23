import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, Target, Users, Trophy, RefreshCw, 
  Clock, CheckCircle, XCircle, ArrowRight
} from 'lucide-react';
import { formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns';

export function FlowDebugger() {
  const [activeTab, setActiveTab] = useState('signups');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Flow Debugger
          </CardTitle>
          <CardDescription>
            Detect stuck states and lifecycle issues across signup, squad, and gamification flows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signups" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Signups
              </TabsTrigger>
              <TabsTrigger value="squads" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Squads
              </TabsTrigger>
              <TabsTrigger value="gamification" className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                Gamification
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signups" className="mt-4">
              <SignupFlowDebugger />
            </TabsContent>
            <TabsContent value="squads" className="mt-4">
              <SquadFlowDebugger />
            </TabsContent>
            <TabsContent value="gamification" className="mt-4">
              <GamificationFlowDebugger />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SignupFlowDebugger() {
  const { data: stuckSignups, isLoading, refetch } = useQuery({
    queryKey: ['stuck-signups'],
    queryFn: async () => {
      // Find signups that might be stuck
      const { data, error } = await supabase
        .from('quest_signups')
        .select(`
          *,
          quests!inner(id, title, slug, status, start_datetime, end_datetime),
          profiles(display_name, email)
        `)
        .order('signed_up_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      const now = new Date();
      
      // Categorize stuck signups
      const stuckCategories = {
        pendingTooLong: [] as typeof data,
        confirmedNoSquad: [] as typeof data,
        questEndedNotCompleted: [] as typeof data,
        noShow: [] as typeof data,
      };
      
      data?.forEach((signup: any) => {
        const signedUpAt = new Date(signup.signed_up_at);
        const questEnd = signup.quests?.end_datetime ? new Date(signup.quests.end_datetime) : null;
        
        // Pending for > 48 hours
        if (signup.status === 'pending' && differenceInHours(now, signedUpAt) > 48) {
          stuckCategories.pendingTooLong.push(signup);
        }
        
        // Confirmed but quest ended without completion
        if (signup.status === 'confirmed' && questEnd && questEnd < now) {
          stuckCategories.questEndedNotCompleted.push(signup);
        }
        
        // Quest marked completed but signup still confirmed
        if (signup.status === 'confirmed' && signup.quests?.status === 'completed') {
          stuckCategories.questEndedNotCompleted.push(signup);
        }
      });
      
      return stuckCategories;
    },
  });
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Signup Lifecycle Issues</h3>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground">Loading...</div>
      ) : (
        <>
          <StuckCategoryCard
            title="Pending Too Long"
            description="Signups in pending status for more than 48 hours"
            items={stuckSignups?.pendingTooLong || []}
            severity="warning"
          />
          
          <StuckCategoryCard
            title="Quest Ended - Not Completed"
            description="Confirmed signups where the quest has ended but status wasn't updated"
            items={stuckSignups?.questEndedNotCompleted || []}
            severity="error"
          />
        </>
      )}
      
      {/* State Machine Diagram */}
      <Card className="bg-muted/30">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Signup State Machine</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
            <Badge variant="outline">pending</Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="bg-blue-500/10">confirmed</Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="bg-green-500/10">completed</Badge>
            <span className="text-muted-foreground mx-2">|</span>
            <Badge variant="outline" className="bg-orange-500/10">standby</Badge>
            <span className="text-muted-foreground mx-2">|</span>
            <Badge variant="outline" className="bg-red-500/10">dropped</Badge>
            <span className="text-muted-foreground mx-2">|</span>
            <Badge variant="outline" className="bg-red-500/10">no_show</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SquadFlowDebugger() {
  const { data: squadIssues, isLoading, refetch } = useQuery({
    queryKey: ['squad-issues'],
    queryFn: async () => {
      // Find squads with issues
      const { data: squads, error } = await supabase
        .from('quest_squads')
        .select(`
          *,
          quests(id, title, status),
          squad_members(id, user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      const issues = {
        emptySquads: [] as typeof squads,
        draftTooLong: [] as typeof squads,
        orphanedMembers: [] as any[],
      };
      
      const now = new Date();
      
      squads?.forEach((squad: any) => {
        const memberCount = squad.squad_members?.length || 0;
        const createdAt = new Date(squad.created_at);
        
        // Empty squads
        if (memberCount === 0) {
          issues.emptySquads.push(squad);
        }
        
        // Draft for > 7 days
        if (squad.status === 'draft' && differenceInDays(now, createdAt) > 7) {
          issues.draftTooLong.push(squad);
        }
      });
      
      return issues;
    },
  });
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Squad Formation Issues</h3>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground">Loading...</div>
      ) : (
        <>
          <StuckCategoryCard
            title="Empty Squads"
            description="Squads with no members - may need cleanup"
            items={squadIssues?.emptySquads || []}
            severity="warning"
          />
          
          <StuckCategoryCard
            title="Draft Too Long"
            description="Squads in draft status for more than 7 days"
            items={squadIssues?.draftTooLong || []}
            severity="warning"
          />
        </>
      )}
    </div>
  );
}

function GamificationFlowDebugger() {
  const { data: gamificationIssues, isLoading, refetch } = useQuery({
    queryKey: ['gamification-issues'],
    queryFn: async () => {
      // Find completed signups without XP transactions
      const { data: completedSignups, error: signupsError } = await supabase
        .from('quest_signups')
        .select(`
          *,
          quests(id, title, base_xp),
          profiles(display_name)
        `)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(100);
      
      if (signupsError) throw signupsError;
      
      // Get XP transactions for these signups
      const signupIds = completedSignups?.map(s => s.id) || [];
      const { data: xpTransactions } = await supabase
        .from('xp_transactions')
        .select('*')
        .in('source_id', signupIds);
      
      const xpSourceIds = new Set(xpTransactions?.map(t => t.source_id) || []);
      
      const missingXp = completedSignups?.filter(s => !xpSourceIds.has(s.id)) || [];
      
      return {
        missingXp,
        totalCompleted: completedSignups?.length || 0,
        totalWithXp: xpTransactions?.length || 0,
      };
    },
  });
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Gamification Flow Issues</h3>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-2xl font-bold">{gamificationIssues?.totalCompleted || 0}</p>
              <p className="text-sm text-muted-foreground">Completed Signups</p>
            </Card>
            <Card className="p-4">
              <p className="text-2xl font-bold">{gamificationIssues?.totalWithXp || 0}</p>
              <p className="text-sm text-muted-foreground">With XP Awarded</p>
            </Card>
            <Card className="p-4">
              <p className="text-2xl font-bold text-amber-500">{gamificationIssues?.missingXp?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Missing XP</p>
            </Card>
          </div>
          
          <StuckCategoryCard
            title="Completed Without XP"
            description="Signups marked completed but no XP transaction found"
            items={gamificationIssues?.missingXp || []}
            severity="error"
          />
        </>
      )}
    </div>
  );
}

function StuckCategoryCard({ 
  title, 
  description, 
  items, 
  severity 
}: { 
  title: string; 
  description: string; 
  items: any[]; 
  severity: 'warning' | 'error';
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (items.length === 0) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="font-medium">{title}</span>
          <Badge variant="outline" className="bg-green-500/10">All Clear</Badge>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={severity === 'error' ? 'border-red-500/30' : 'border-amber-500/30'}>
      <CardHeader className="py-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {severity === 'error' ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <span className="font-medium">{title}</span>
            <Badge variant={severity === 'error' ? 'destructive' : 'outline'} className="bg-amber-500/10">
              {items.length} issues
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      {isExpanded && (
        <CardContent className="py-2 space-y-2">
          {items.slice(0, 10).map((item: any, idx) => (
            <div key={item.id || idx} className="text-sm p-2 bg-muted/50 rounded flex justify-between">
              <div>
                <span className="font-mono text-xs">{item.id?.slice(0, 8)}...</span>
                {item.quests?.title && (
                  <span className="text-muted-foreground ml-2">{item.quests.title}</span>
                )}
                {item.profiles?.display_name && (
                  <span className="text-muted-foreground ml-2">({item.profiles.display_name})</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {item.signed_up_at || item.created_at 
                  ? formatDistanceToNow(new Date(item.signed_up_at || item.created_at), { addSuffix: true })
                  : ''
                }
              </span>
            </div>
          ))}
          {items.length > 10 && (
            <p className="text-xs text-muted-foreground text-center">
              And {items.length - 10} more...
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
