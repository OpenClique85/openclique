import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Loader2 } from 'lucide-react';

import { QuestsManager } from '@/components/admin/QuestsManager';
import { SignupsManager } from '@/components/admin/SignupsManager';
import { MessagingCenter } from '@/components/admin/MessagingCenter';
import { WhatsAppManager } from '@/components/admin/WhatsAppManager';
import { Analytics } from '@/components/admin/Analytics';
import { PersistentSquadsManager } from '@/components/admin/PersistentSquadsManager';
import { CreatorsManager } from '@/components/admin/CreatorsManager';
import { SponsorsManager } from '@/components/admin/SponsorsManager';
import { CreatorPreviewTab } from '@/components/admin/CreatorPreviewTab';
import { SponsorPreviewTab } from '@/components/admin/SponsorPreviewTab';
import { DevToolsSection } from '@/components/admin/DevToolsSection';
import { TestimonialsManager } from '@/components/admin/TestimonialsManager';
import { XPLevelsManager } from '@/components/admin/XPLevelsManager';
import { AchievementsManager } from '@/components/admin/AchievementsManager';
import { BadgesManager } from '@/components/admin/BadgesManager';
import { StreaksManager } from '@/components/admin/StreaksManager';
import { AdminSectionNav } from '@/components/admin/AdminSectionNav';

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

  const renderContent = () => {
    switch (activeTab) {
      case 'quests': return <QuestsManager />;
      case 'signups': return <SignupsManager />;
      case 'squads': return <PersistentSquadsManager />;
      case 'creators': return <CreatorsManager />;
      case 'sponsors': return <SponsorsManager />;
      case 'testimonials': return <TestimonialsManager />;
      case 'creator-preview': return <CreatorPreviewTab />;
      case 'sponsor-preview': return <SponsorPreviewTab />;
      case 'messaging': return <MessagingCenter />;
      case 'whatsapp': return <WhatsAppManager />;
      case 'analytics': return <Analytics />;
      case 'devtools': return <DevToolsSection />;
      case 'xp-levels': return <XPLevelsManager />;
      case 'achievements': return <AchievementsManager />;
      case 'badges': return <BadgesManager />;
      case 'streaks': return <StreaksManager />;
      default: return <QuestsManager />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Quest Ops Console</h1>
          <p className="text-muted-foreground mt-1">Manage quests, partners, and gamification</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <AdminSectionNav activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </aside>

          {/* Mobile Navigation */}
          <div className="lg:hidden mb-4">
            <AdminSectionNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Content */}
          <div className="min-w-0">
            {renderContent()}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
