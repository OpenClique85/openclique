/**
 * =============================================================================
 * Settings Page - Privacy, Notifications, Data, and Account Management
 * =============================================================================
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Shield, Bell, Database, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { DataManagement } from '@/components/settings/DataManagement';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { useState } from 'react';

export default function Settings() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Get initial tab from URL or default to 'privacy'
  const tabParam = searchParams.get('tab');
  const validTabs = ['profile', 'privacy', 'notifications', 'data', 'account'];
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'privacy';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
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
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Link to="/profile?tab=me">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold">Settings</h1>
              <p className="text-muted-foreground text-sm">
                Manage your privacy, notifications, and account
              </p>
            </div>
          </div>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile" className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1.5">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-1.5">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Data</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-1.5">
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Update your display name, bio, and profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-display font-bold text-primary">
                      {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{profile?.display_name || 'Adventurer'}</h3>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <Button onClick={() => setShowEditModal(true)}>
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="mt-6">
              <PrivacySettings />
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="mt-6">
              <NotificationPreferences />
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data" className="mt-6">
              <DataManagement />
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="mt-6">
              <AccountSettings />
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
    </div>
  );
}
