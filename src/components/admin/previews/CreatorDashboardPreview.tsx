import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, ClipboardList, Star, Users, TrendingUp } from 'lucide-react';

interface CreatorDashboardPreviewProps {
  previewUserId: string;
}

export function CreatorDashboardPreview({ previewUserId }: CreatorDashboardPreviewProps) {
  // Fetch creator profile
  const { data: creatorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['creator-profile-preview', previewUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', previewUserId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!previewUserId,
  });

  // Fetch creator's quests stats
  const { data: questStats } = useQuery({
    queryKey: ['creator-quest-stats-preview', previewUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select('id, review_status, status')
        .eq('creator_id', previewUserId);
      
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
    enabled: !!previewUserId,
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!creatorProfile) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Creator profile not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Welcome back, {creatorProfile.display_name}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Design experiences that bring people together.
          </p>
        </div>
        <Button size="lg" className="gap-2" disabled>
          <Plus className="h-5 w-5" />
          Create New Quest
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Quests</CardTitle>
            <CardDescription>View and manage all your quests</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              View All Quests
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Creator Profile</CardTitle>
            <CardDescription>Update your bio, photo, and social links</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Edit Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
