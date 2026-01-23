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
import { OrgsManager } from '@/components/admin/OrgsManager';
import { CreatorPreviewTab } from '@/components/admin/CreatorPreviewTab';
import { SponsorPreviewTab } from '@/components/admin/SponsorPreviewTab';
import { DevToolsSection } from '@/components/admin/DevToolsSection';
import { TestimonialsManager } from '@/components/admin/TestimonialsManager';
import { XPLevelsManager } from '@/components/admin/XPLevelsManager';
import { AchievementsManager } from '@/components/admin/AchievementsManager';
import { BadgesManager } from '@/components/admin/BadgesManager';
import { StreaksManager } from '@/components/admin/StreaksManager';
import { AdminSectionNav } from '@/components/admin/AdminSectionNav';
import { LinksManager } from '@/components/admin/LinksManager';
import { SupportDashboard } from '@/components/admin/SupportDashboard';
import { IssueCategoriesManager } from '@/components/admin/IssueCategoriesManager';
import { AdminDirectMessages } from '@/components/admin/AdminDirectMessages';
import { SupportAnalytics } from '@/components/admin/SupportAnalytics';
import { ShadowModeViewer } from '@/components/admin/ops/ShadowModeViewer';
import { EventTimeline } from '@/components/admin/ops/EventTimeline';
import { FlowDebugger } from '@/components/admin/ops/FlowDebugger';
import { ManualOverrides } from '@/components/admin/ops/ManualOverrides';
import { FeatureFlagsManager } from '@/components/admin/ops/FeatureFlagsManager';
import { SecurityTools } from '@/components/admin/ops/SecurityTools';
import { NotificationConsole } from '@/components/admin/notifications';
import { DocsManager, DocsExportPanel } from '@/components/admin/docs';

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
      case 'orgs': return <OrgsManager />;
      case 'support-inbox': return <SupportDashboard />;
      case 'support-dm': return <AdminDirectMessages />;
      case 'support-analytics': return <SupportAnalytics />;
      case 'support-categories': return <IssueCategoriesManager />;
      case 'creators': return <CreatorsManager />;
      case 'sponsors': return <SponsorsManager />;
      case 'testimonials': return <TestimonialsManager />;
      case 'creator-preview': return <CreatorPreviewTab />;
      case 'sponsor-preview': return <SponsorPreviewTab />;
      case 'messaging': return <MessagingCenter />;
      case 'whatsapp': return <WhatsAppManager />;
      case 'links': return <LinksManager />;
      case 'notification-console': return <NotificationConsole />;
      case 'analytics': return <Analytics />;
      case 'xp-levels': return <XPLevelsManager />;
      case 'achievements': return <AchievementsManager />;
      case 'badges': return <BadgesManager />;
      case 'streaks': return <StreaksManager />;
      // Ops & Dev Tools
      case 'shadow-mode': return <ShadowModeViewer />;
      case 'event-timeline': return <EventTimeline />;
      case 'flow-debugger': return <FlowDebugger />;
      case 'manual-overrides': return <ManualOverrides />;
      case 'feature-flags': return <FeatureFlagsManager />;
      case 'security-tools': return <SecurityTools />;
      case 'devtools': return <DevToolsSection />;
      // Documentation
      case 'docs-manager': return <DocsManager />;
      case 'docs-export': return <DocsExportPanel />;
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
