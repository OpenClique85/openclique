import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  TrendingUp,
  FileText,
  MapPin,
  Gift
} from 'lucide-react';

interface SponsorDashboardPreviewProps {
  previewUserId: string;
}

export function SponsorDashboardPreview({ previewUserId }: SponsorDashboardPreviewProps) {
  // Fetch sponsor profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['preview-sponsor-profile', previewUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', previewUserId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!previewUserId,
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['preview-sponsor-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { count: sponsoredCount } = await supabase
        .from('sponsored_quests')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', profile.id);

      const { count: proposalCount } = await supabase
        .from('sponsorship_proposals')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', profile.id)
        .in('status', ['sent', 'accepted', 'pending_admin']);

      const { count: venueCount } = await supabase
        .from('venue_offerings')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', profile.id);

      const { count: rewardCount } = await supabase
        .from('rewards')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', profile.id)
        .eq('status', 'active');

      return {
        sponsoredQuests: sponsoredCount || 0,
        activeProposals: proposalCount || 0,
        venues: venueCount || 0,
        activeRewards: rewardCount || 0,
      };
    },
    enabled: !!profile?.id,
  });

  if (profileLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sponsor profile found for this user
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Welcome, {profile.name}!</h2>
        <p className="text-muted-foreground text-sm">
          Sponsor Portal Dashboard Preview
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.sponsoredQuests || 0}</p>
                <p className="text-sm text-muted-foreground">Sponsored Quests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeProposals || 0}</p>
                <p className="text-sm text-muted-foreground">Active Proposals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MapPin className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.venues || 0}</p>
                <p className="text-sm text-muted-foreground">Venues Listed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Gift className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeRewards || 0}</p>
                <p className="text-sm text-muted-foreground">Active Rewards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
