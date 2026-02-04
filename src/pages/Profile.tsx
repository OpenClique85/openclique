/**
 * =============================================================================
 * UNIFIED PROFILE PAGE - Cliques | Quests | Contacts | Orgs | Me tabs
 * =============================================================================
 * 
 * This is the central hub for user activity, combining:
 * - My Cliques (squads with hero cards)
 * - My Quests (journey, rewards, history)
 * - Contacts & LFG (personal roster and group finding)
 * - Organizations (org memberships)
 * - Me (algorithm, progress, settings)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Loader2, Settings, Users, Compass, User, Building2, AtSign, Copy, Contact } from 'lucide-react';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { ProfileModal } from '@/components/ProfileModal';
import { UsernameRequiredModal } from '@/components/profile/UsernameRequiredModal';
import { CliquesTab } from '@/components/profile/CliquesTab';
import { QuestsTab } from '@/components/profile/QuestsTab';
import { MeTab } from '@/components/profile/MeTab';
import { OrganizationsTab } from '@/components/profile/OrganizationsTab';
import { ContactsTab } from '@/components/contacts/ContactsTab';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, profile, isLoading: authLoading, isProfileLoaded } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const { toast } = useToast();
  
  // Get initial tab from URL or default to 'cliques'
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'cliques');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Show profile setup modal for new users
  useEffect(() => {
    if (user && !profile && !authLoading && isProfileLoaded) {
      setShowProfileModal(true);
    }
  }, [user, profile, authLoading, isProfileLoaded]);

  // Show username modal for returning users without username
  useEffect(() => {
    if (user && profile && !profile.username && !authLoading && isProfileLoaded && !showProfileModal) {
      setShowUsernameModal(true);
    }
  }, [user, profile, authLoading, isProfileLoaded, showProfileModal]);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-display font-bold text-primary">
                    {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h1 className="text-2xl font-display font-bold text-foreground">
                      {profile?.display_name || 'Adventurer'}
                    </h1>
                    {profile?.username && (
                      <p className="text-primary font-medium text-sm flex items-center gap-1">
                        <AtSign className="h-3.5 w-3.5" />
                        {profile.username}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs mt-1">
                      Member since {profile?.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : 'recently'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content: Cliques | Quests | Contacts | Orgs | Me */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            {/* Mobile: horizontally scrollable, icon-first, bigger tap targets */}
            <TabsList className="w-full flex gap-1 overflow-x-auto h-auto p-1 rounded-lg bg-muted/50">
              <TabsTrigger value="cliques" className="flex items-center justify-center gap-2 px-3 py-2.5 min-w-[88px]">
                <Users className="h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm">Cliques</span>
              </TabsTrigger>
              <TabsTrigger value="quests" className="flex items-center justify-center gap-2 px-3 py-2.5 min-w-[88px]">
                <Compass className="h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm">Quests</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center justify-center gap-2 px-3 py-2.5 min-w-[104px]">
                <Contact className="h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm">Contacts</span>
              </TabsTrigger>
              <TabsTrigger value="orgs" className="flex items-center justify-center gap-2 px-3 py-2.5 min-w-[76px]">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm">Orgs</span>
              </TabsTrigger>
              <TabsTrigger value="me" className="flex items-center justify-center gap-2 px-3 py-2.5 min-w-[68px]">
                <User className="h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm">Me</span>
              </TabsTrigger>
            </TabsList>

            {/* Cliques Tab */}
            <TabsContent value="cliques" className="mt-6">
              <CliquesTab userId={user.id} />
            </TabsContent>

            {/* Quests Tab */}
            <TabsContent value="quests" className="mt-6">
              <QuestsTab userId={user.id} />
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="mt-6">
              <ContactsTab userId={user.id} />
            </TabsContent>

            {/* Organizations Tab */}
            <TabsContent value="orgs" className="mt-6">
              <OrganizationsTab userId={user.id} />
            </TabsContent>

            {/* Me Tab */}
            <TabsContent value="me" className="mt-6">
              <MeTab userId={user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Edit Profile Modal */}
      <ProfileEditModal 
        open={showEditModal} 
        onClose={() => setShowEditModal(false)} 
      />

      {/* Profile Setup Modal (for new users) */}
      <ProfileModal
        open={showProfileModal}
        onComplete={() => setShowProfileModal(false)}
      />

      {/* Username Required Modal (for returning users without username) */}
      <UsernameRequiredModal
        open={showUsernameModal}
        onComplete={() => {
          setShowUsernameModal(false);
        }}
      />
    </div>
  );
}
