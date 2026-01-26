/**
 * ClubDashboardPage - Social Chair Dashboard for club management
 * 
 * This page:
 * - Fetches organization by slug from URL params
 * - Verifies user has social_chair, admin, or org_admin role
 * - Renders SocialChairDashboard if authorized
 * - Shows access denied if not authorized
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SocialChairDashboard } from '@/components/clubs/SocialChairDashboard';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, ShieldX, Building2 } from 'lucide-react';

export default function ClubDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAdmin } = useAuth();

  // Fetch organization by slug
  const { data: org, isLoading: orgLoading, error: orgError } = useQuery({
    queryKey: ['org-by-slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, type, suspended_at')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Check user's role in this organization
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['user-org-role', org?.id, user?.id],
    queryFn: async () => {
      if (!org?.id || !user?.id) return null;
      const { data, error } = await supabase
        .from('profile_organizations')
        .select('role')
        .eq('org_id', org.id)
        .eq('profile_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.role || null;
    },
    enabled: !!org?.id && !!user?.id,
  });

  const isLoading = orgLoading || roleLoading;
  const hasAccess = isAdmin || userRole === 'social_chair' || userRole === 'org_admin' || userRole === 'admin';

  // Show loading state
  if (isLoading) {
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

  // Show error if org not found
  if (!org || orgError) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The organization "{slug}" doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link to="/my-quests">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to My Hub
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Show access denied if not authorized
  if (!hasAccess) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <ShieldX className="h-12 w-12 mx-auto text-destructive/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                You don't have permission to access the dashboard for {org.name}.
                Only Social Chairs and admins can access this page.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline">
                  <Link to={`/org/${slug}`}>
                    <Building2 className="h-4 w-4 mr-2" />
                    View Organization
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/my-quests">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to My Hub
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Render the Social Chair Dashboard
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link to={`/org/${slug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {org.name}
            </Link>
          </Button>
        </div>

        {/* Dashboard */}
        <SocialChairDashboard clubId={org.id} clubName={org.name} />
      </main>
      <Footer />
    </div>
  );
}
