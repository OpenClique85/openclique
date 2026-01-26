/**
 * OrgPage - Organization landing page with clubs directory
 * Includes membership check and Social Chair Dashboard access
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizations } from '@/hooks/useOrganizations';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ClubDirectory, SocialChairDashboard } from '@/components/clubs';
import { SchoolVerificationModal } from '@/components/org/SchoolVerificationModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, GraduationCap, ShieldCheck, Settings, Mail } from 'lucide-react';
import { useState } from 'react';

export default function OrgPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();
  const { isMemberOf, getRoleIn, joinOrg } = useOrganizations();
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', orgSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*, parent_org:organizations!organizations_parent_org_id_fkey(name, slug)')
        .eq('slug', orgSlug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgSlug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full mb-6" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Organization Not Found</h1>
          <p className="text-muted-foreground">The organization you're looking for doesn't exist.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const isMember = org?.id ? isMemberOf(org.id) : false;
  const userRole = org?.id ? getRoleIn(org.id) : null;
  const isAdmin = userRole === 'admin' || userRole === 'social_chair' || userRole === 'org_admin';
  const hasVerifiedDomains = org?.verified_domains && (org.verified_domains as string[]).length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Org Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="p-4 rounded-xl bg-primary/10">
                {org.is_umbrella ? (
                  <GraduationCap className="h-12 w-12 text-primary" />
                ) : (
                  <Building2 className="h-12 w-12 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-display font-bold">{org.name}</h1>
                  {org.is_umbrella && (
                    <Badge variant="secondary">Umbrella</Badge>
                  )}
                  {isMember && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Member
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">{org.description}</p>
                
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {!isMember && user && (
                    <>
                      {hasVerifiedDomains ? (
                        <Button onClick={() => setShowVerifyModal(true)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Verify School Email
                        </Button>
                      ) : (
                        <Button onClick={() => org.id && joinOrg.mutate(org.id)}>
                          <Users className="h-4 w-4 mr-2" />
                          Join Organization
                        </Button>
                      )}
                    </>
                  )}
                  {!user && (
                    <p className="text-sm text-muted-foreground">
                      Sign in to join this organization
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        {isAdmin ? (
          <Tabs defaultValue="directory">
            <TabsList className="mb-4">
              <TabsTrigger value="directory" className="gap-1">
                <Building2 className="h-4 w-4" />
                Directory
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-1">
                <Settings className="h-4 w-4" />
                Social Chair
              </TabsTrigger>
            </TabsList>
            <TabsContent value="directory">
              {org.is_umbrella ? (
                <ClubDirectory umbrellaOrgId={org.id} umbrellaOrgName={org.name} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Club Events</CardTitle>
                    <CardDescription>Browse upcoming events from {org.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">No upcoming events</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="dashboard">
              <SocialChairDashboard clubId={org.id} clubName={org.name} />
            </TabsContent>
          </Tabs>
        ) : org.is_umbrella ? (
          <ClubDirectory umbrellaOrgId={org.id} umbrellaOrgName={org.name} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Club Events</CardTitle>
              <CardDescription>Browse upcoming events from {org.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No upcoming events</p>
            </CardContent>
          </Card>
        )}

        {/* Verification Modal */}
        {showVerifyModal && org && (
          <SchoolVerificationModal
            open={showVerifyModal}
            onOpenChange={setShowVerifyModal}
            orgId={org.id}
            orgName={org.name}
            allowedDomains={(org.verified_domains as string[]) || []}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
