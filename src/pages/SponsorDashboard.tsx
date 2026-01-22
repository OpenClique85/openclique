import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SponsorPortalNav } from '@/components/sponsors/SponsorPortalNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  Search, 
  MapPin, 
  Gift, 
  BarChart3, 
  Users, 
  Star,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function SponsorDashboard() {
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

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['sponsor-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      // Get sponsored quests count
      const { count: sponsoredCount } = await supabase
        .from('sponsored_quests')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', profile.id);

      // Get active proposals count
      const { count: proposalCount } = await supabase
        .from('sponsorship_proposals')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', profile.id)
        .in('status', ['sent', 'accepted', 'pending_admin']);

      // Get venue count
      const { count: venueCount } = await supabase
        .from('venue_offerings')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', profile.id);

      // Get rewards count
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

  // Not a sponsor
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <CardTitle>Become a Sponsor</CardTitle>
              <CardDescription>
                Partner with OpenClique to reach engaged local audiences through authentic experiences.
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

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <SponsorPortalNav />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Welcome, {profile.name}!</h1>
              <p className="text-muted-foreground">
                Manage your sponsorships, venues, and rewards
              </p>
            </div>
            <Button asChild>
              <Link to="/sponsor/discover">
                <Search className="mr-2 h-4 w-4" />
                Find Quests to Sponsor
              </Link>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

          {/* Quick Actions */}
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <Link to="/sponsor/discover">
                <CardContent className="pt-6 text-center">
                  <Search className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">Find Quests</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse quests to sponsor
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <Link to="/sponsor/discover?tab=creators">
                <CardContent className="pt-6 text-center">
                  <Users className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">Find Creators</h3>
                  <p className="text-sm text-muted-foreground">
                    Request custom quests
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <Link to="/sponsor/venues">
                <CardContent className="pt-6 text-center">
                  <MapPin className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">Manage Venues</h3>
                  <p className="text-sm text-muted-foreground">
                    Offer your space
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <Link to="/sponsor/rewards">
                <CardContent className="pt-6 text-center">
                  <Gift className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">Create Rewards</h3>
                  <p className="text-sm text-muted-foreground">
                    Offer perks to participants
                  </p>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Status Banner */}
          {profile.status === 'pending_review' && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-100">
                    <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-900">Profile Under Review</p>
                    <p className="text-sm text-amber-700">
                      Your sponsor profile is being reviewed. You'll be notified once approved.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {profile.status === 'paused' && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-orange-900">Account Paused</p>
                    <p className="text-sm text-orange-700">
                      Your sponsor account is currently paused. Contact support to resume.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
