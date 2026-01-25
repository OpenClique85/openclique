import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CreatorPortalNav } from '@/components/creators/CreatorPortalNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Sparkles, Plus, ClipboardList, Star, Users, TrendingUp, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePendingOrgRequests } from '@/hooks/usePendingOrgRequests';

export default function CreatorDashboard() {
  const { user, isLoading: authLoading, isAdmin, profile } = useAuth();
  const { data: pendingOrgRequests = 0 } = usePendingOrgRequests();
  
  // Fetch creator profile
  const { data: creatorProfile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['creator-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user,
  });

  // Auto-create creator profile for admins who don't have one
  useQuery({
    queryKey: ['admin-creator-profile-setup', user?.id, isAdmin, creatorProfile?.id],
    queryFn: async () => {
      if (!user || !isAdmin || creatorProfile) return null;
      
      // Create a creator profile for the admin
      const displayName = profile?.display_name || user.email?.split('@')[0] || 'Admin';
      
      const { error: profileError } = await supabase
        .from('creator_profiles')
        .insert({
          user_id: user.id,
          display_name: displayName,
          bio: 'OpenClique Admin & Quest Creator',
          city: 'Austin',
          status: 'active',
          onboarded_at: new Date().toISOString(),
        });
      
      if (profileError && !profileError.message.includes('duplicate')) {
        console.error('Error creating admin creator profile:', profileError);
        return null;
      }
      
      // Also add quest_creator role if not present
      await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'quest_creator' })
        .single();
      
      // Refetch the creator profile
      refetchProfile();
      return true;
    },
    enabled: !!user && isAdmin && !profileLoading && !creatorProfile,
  });

  // Fetch creator's quests stats
  const { data: questStats } = useQuery({
    queryKey: ['creator-quest-stats', user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, published: 0, pending: 0, draft: 0 };
      
      const { data, error } = await supabase
        .from('quests')
        .select('id, review_status, status')
        .eq('creator_id', user.id);
      
      if (error) {
        console.error('Error fetching quest stats:', error);
        return { total: 0, published: 0, pending: 0, draft: 0 };
      }
      
      return {
        total: data?.length || 0,
        published: data?.filter(q => q.status === 'open' || q.status === 'closed' || q.status === 'completed').length || 0,
        pending: data?.filter(q => q.review_status === 'pending_review').length || 0,
        draft: data?.filter(q => q.review_status === 'draft').length || 0,
      };
    },
    enabled: !!user,
  });

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Not a creator - show access denied
  if (!creatorProfile) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-4">Creator Portal</h1>
          <p className="text-muted-foreground mb-6">
            You need a creator account to access this page.
          </p>
          <Button asChild>
            <Link to="/creators/quest-creators">Learn About Becoming a Creator</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      <CreatorPortalNav />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Welcome back, {creatorProfile.display_name}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Design experiences that bring people together.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link to="/creator/quests/new">
              <Plus className="h-5 w-5" />
              Create New Quest
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Total Quests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{questStats?.total || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Published
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{questStats?.published || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pending Review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">{questStats?.pending || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Drafts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-muted-foreground">{questStats?.draft || 0}</p>
            </CardContent>
          </Card>

          {/* Org Requests Card with Badge */}
          <Card className={pendingOrgRequests > 0 ? 'border-primary/50 bg-primary/5' : ''}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Org Requests
                {pendingOrgRequests > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-xs h-5 px-1.5">
                    {pendingOrgRequests}
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link 
                to="/creator/org-requests" 
                className="text-3xl font-bold hover:text-primary transition-colors"
              >
                {pendingOrgRequests}
              </Link>
              {pendingOrgRequests > 0 && (
                <p className="text-xs text-muted-foreground mt-1">needs response</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Quests</CardTitle>
              <CardDescription>View and manage all your quests</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link to="/creator/quests">View All Quests</Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Creator Profile</CardTitle>
              <CardDescription>Update your bio, photo, and social links</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link to="/creator/profile">Edit Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
