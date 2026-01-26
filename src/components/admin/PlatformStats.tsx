/**
 * =============================================================================
 * PLATFORM STATS - Key metrics dashboard for admin overview
 * =============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Calendar, 
  UserCheck, 
  Sparkles, 
  Building2, 
  Trophy,
  TrendingUp,
  Target,
  UserPlus
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, trend, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-7 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-bold">{value}</p>
              )}
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
          {trend && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PlatformStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      // Fetch all stats in parallel
      const [
        profilesResult,
        signupsResult,
        questsResult,
        instancesResult,
        creatorsResult,
        sponsorsResult,
        squadsResult,
        orgsResult,
        friendsRecruitedResult,
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('quest_signups').select('*', { count: 'exact', head: true }),
        supabase.from('quests').select('*', { count: 'exact', head: true }),
        supabase.from('quest_instances').select('*', { count: 'exact', head: true }).in('status', ['recruiting', 'locked', 'live']),
        supabase.from('creator_profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('sponsor_profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('quest_squads').select('*', { count: 'exact', head: true }).not('status', 'eq', 'cancelled'),
        supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('friend_invites').select('*', { count: 'exact', head: true }).not('redeemed_at', 'is', null),
      ]);

      return {
        totalUsers: profilesResult.count || 0,
        totalSignups: signupsResult.count || 0,
        totalQuests: questsResult.count || 0,
        activeInstances: instancesResult.count || 0,
        activeCreators: creatorsResult.count || 0,
        activeSponsors: sponsorsResult.count || 0,
        activeSquads: squadsResult.count || 0,
        activeOrgs: orgsResult.count || 0,
        friendsRecruited: friendsRecruitedResult.count || 0,
      };
    },
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        Key Stats
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers || 0}
          icon={<Users className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          label="Total Signups"
          value={stats?.totalSignups || 0}
          icon={<UserCheck className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          label="Quest Templates"
          value={stats?.totalQuests || 0}
          icon={<Calendar className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          label="Active Instances"
          value={stats?.activeInstances || 0}
          icon={<Target className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          label="Active Squads"
          value={stats?.activeSquads || 0}
          icon={<Trophy className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          label="Creators"
          value={stats?.activeCreators || 0}
          icon={<Sparkles className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          label="Sponsors"
          value={stats?.activeSponsors || 0}
          icon={<Building2 className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          label="Organizations"
          value={stats?.activeOrgs || 0}
          icon={<Building2 className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          label="Friends Recruited"
          value={stats?.friendsRecruited || 0}
          icon={<UserPlus className="h-4 w-4" />}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
