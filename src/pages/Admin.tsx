import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

import { QuestsManager } from '@/components/admin/QuestsManager';
import { SignupsManager } from '@/components/admin/SignupsManager';
import { MessagingCenter } from '@/components/admin/MessagingCenter';
import { WhatsAppManager } from '@/components/admin/WhatsAppManager';
import { Analytics } from '@/components/admin/Analytics';
import { PersistentSquadsManager } from '@/components/admin/PersistentSquadsManager';
import { CreatorsManager } from '@/components/admin/CreatorsManager';
import { CreatorPreviewTab } from '@/components/admin/CreatorPreviewTab';
import { DevToolsSection } from '@/components/admin/DevToolsSection';

export default function Admin() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('quests');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Quest Ops Console</h1>
          <p className="text-muted-foreground mt-1">Manage quests, signups, and communications</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 lg:w-auto lg:inline-grid">
            <TabsTrigger value="quests">Quests</TabsTrigger>
            <TabsTrigger value="signups">Signups</TabsTrigger>
            <TabsTrigger value="squads">Squads</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="messaging">Messaging</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="devtools">Dev Tools</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quests">
            <QuestsManager />
          </TabsContent>
          
          <TabsContent value="signups">
            <SignupsManager />
          </TabsContent>
          
          <TabsContent value="squads">
            <PersistentSquadsManager />
          </TabsContent>
          
          <TabsContent value="creators">
            <CreatorsManager />
          </TabsContent>
          
          <TabsContent value="preview">
            <CreatorPreviewTab />
          </TabsContent>
          
          <TabsContent value="messaging">
            <MessagingCenter />
          </TabsContent>
          
          <TabsContent value="whatsapp">
            <WhatsAppManager />
          </TabsContent>
          
          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>
          
          <TabsContent value="devtools">
            <DevToolsSection />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}
