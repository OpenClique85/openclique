/**
 * =============================================================================
 * EnterprisePortal - Full administrative control over enterprise orgs
 * =============================================================================
 * 
 * Features:
 * - Full control over UT org and enterprise accounts
 * - Manage organizations, clubs, members, cliques
 * - Analytics dashboard
 * - Social chair role assignment
 * - Account suspension/deletion
 * - Drill-down views for orgs and clubs
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  Shield, 
  BarChart3,
  GraduationCap,
  Loader2
} from 'lucide-react';

// Import enterprise components
import { EnterpriseOrgsTab } from '@/components/enterprise/EnterpriseOrgsTab';
import { EnterpriseClubsTab } from '@/components/enterprise/EnterpriseClubsTab';
import { EnterpriseMembersTab } from '@/components/enterprise/EnterpriseMembersTab';
import { EnterpriseCliquesTab } from '@/components/enterprise/EnterpriseCliquesTab';
import { EnterpriseAnalyticsTab } from '@/components/enterprise/EnterpriseAnalyticsTab';
import { OrgDetailView } from '@/components/enterprise/OrgDetailView';
import { ClubDetailView } from '@/components/enterprise/ClubDetailView';

// View state type
type ViewState = 
  | { type: 'list' }
  | { type: 'org-detail'; orgId: string }
  | { type: 'club-detail'; clubId: string };

export default function EnterprisePortal() {
  const { isAdmin, isLoading, isRolesLoaded } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('organizations');
  const [viewState, setViewState] = useState<ViewState>({ type: 'list' });

  // Wait for roles to load before checking access
  if (isLoading || !isRolesLoaded) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Only admins can access this portal
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                Access Denied
              </CardTitle>
              <CardDescription>
                You don't have permission to access the Enterprise Portal. 
                This area is restricted to platform administrators.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Handle drill-down navigation
  const handleSelectOrg = (orgId: string) => {
    setViewState({ type: 'org-detail', orgId });
  };

  const handleSelectClub = (clubId: string) => {
    setViewState({ type: 'club-detail', clubId });
  };

  const handleBack = () => {
    setViewState({ type: 'list' });
  };

  // Render detail views when drilled down
  if (viewState.type === 'org-detail') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        {/* Enterprise Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Enterprise Portal</h1>
                <p className="text-muted-foreground">
                  Organization Details
                </p>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 container mx-auto px-4 py-8">
          <OrgDetailView 
            orgId={viewState.orgId} 
            onBack={handleBack}
            onSelectClub={handleSelectClub}
          />
        </main>

        <Footer />
      </div>
    );
  }

  if (viewState.type === 'club-detail') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        {/* Enterprise Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Enterprise Portal</h1>
                <p className="text-muted-foreground">
                  Club Details
                </p>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 container mx-auto px-4 py-8">
          <ClubDetailView 
            clubId={viewState.clubId} 
            onBack={handleBack}
          />
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Enterprise Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Enterprise Portal</h1>
              <p className="text-muted-foreground">
                Full administrative control over organizations, clubs, members, and cliques
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="organizations" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Organizations</span>
            </TabsTrigger>
            <TabsTrigger value="clubs" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clubs</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="cliques" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Cliques</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizations">
            <EnterpriseOrgsTab 
              onSelectOrg={handleSelectOrg}
              onSelectClub={handleSelectClub}
            />
          </TabsContent>

          <TabsContent value="clubs">
            <EnterpriseClubsTab onSelectClub={handleSelectClub} />
          </TabsContent>

          <TabsContent value="members">
            <EnterpriseMembersTab />
          </TabsContent>

          <TabsContent value="cliques">
            <EnterpriseCliquesTab />
          </TabsContent>

          <TabsContent value="analytics">
            <EnterpriseAnalyticsTab />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
