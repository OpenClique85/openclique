import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Loader2, ChevronDown } from 'lucide-react';

import { QuestsManager } from '@/components/admin/QuestsManager';
import { SignupsManager } from '@/components/admin/SignupsManager';
import { MessagingCenter } from '@/components/admin/MessagingCenter';
import { Analytics } from '@/components/admin/Analytics';
import { PersistentSquadsManager } from '@/components/admin/PersistentSquadsManager';
import { CreatorsManager } from '@/components/admin/CreatorsManager';
import { SponsorsManager } from '@/components/admin/SponsorsManager';
import { OrgsManager } from '@/components/admin/OrgsManager';
import { CreatorPreviewTab } from '@/components/admin/CreatorPreviewTab';
import { SponsorPreviewTab } from '@/components/admin/SponsorPreviewTab';

import { TestimonialsManager } from '@/components/admin/TestimonialsManager';
import { XPLevelsManager } from '@/components/admin/XPLevelsManager';
import { AchievementsManager } from '@/components/admin/AchievementsManager';
import { BadgesManager } from '@/components/admin/BadgesManager';
import { StreaksManager } from '@/components/admin/StreaksManager';
import { AdminSectionNav } from '@/components/admin/AdminSectionNav';
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
import { DocsManager, DocsExportPanel, DocsPlaybookManager } from '@/components/admin/docs';
import { PilotInstancesManager } from '@/components/admin/pilot';
import { PilotProgramsManager, PilotAnalyticsDashboard, PilotNotesManager, PilotTemplatesManager } from '@/components/admin/pilots';
import { ApprovalInbox, OpsAlerts, AuditLogViewer } from '@/components/admin/control-room';
import { EnterpriseOrgsManager } from '@/components/admin/EnterpriseOrgsManager';
import { SquadComparisonView } from '@/components/admin/SquadComparisonView';
import { SquadHealthDashboard } from '@/components/admin/SquadHealthDashboard';
import { SquadArchivalManager } from '@/components/admin/SquadArchivalManager';
import { UGCManager } from '@/components/admin/UGCManager';
import { InviteCodesManager } from '@/components/admin/InviteCodesManager';
import { OnboardingFeedbackManager } from '@/components/admin/OnboardingFeedbackManager';
import { ReferralAnalytics } from '@/components/admin/ReferralAnalytics';
import { PlatformStats } from '@/components/admin/PlatformStats';
import { QuestArchivesManager } from '@/components/admin/QuestArchivesManager';
import { CliquesManager } from '@/components/admin/CliquesManager';
import { TraitLibraryManager, UserProfileInspector, AIInferenceLogsViewer, EmergingTraitsReview } from '@/components/admin/identity';
import { PromptManager } from '@/components/admin/ai/PromptManager';
import { OrgApplicationsManager } from '@/components/admin/OrgApplicationsManager';
import { ModerationDashboard } from '@/components/admin/ModerationDashboard';
import { PilotDemandDashboard, TierAccountsView, TierApplicationsManager, ARRForecasting } from '@/components/admin/payments';
import { WaitlistManager } from '@/components/admin/WaitlistManager';
import { TutorialQuestAnalytics } from '@/components/admin/TutorialQuestAnalytics';

export default function Admin() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('pilot-instances');

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
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
      // Control Room
      case 'approval-inbox': return <ApprovalInbox />;
      case 'ops-alerts': return <OpsAlerts />;
      case 'audit-log': return <AuditLogViewer />;
      // Quest Ops
      case 'pilot-instances': return <PilotInstancesManager />;
      // Pilot Programs
      case 'pilot-programs': return <PilotProgramsManager />;
      case 'pilot-analytics': return <PilotAnalyticsDashboard />;
      case 'pilot-notes': return <PilotNotesManager />;
      case 'pilot-templates': return <PilotTemplatesManager />;
      // Operations
      case 'quests': return <QuestsManager />;
      case 'quest-archives': return <QuestArchivesManager />;
      case 'squads': return <PersistentSquadsManager />;
      case 'enterprise-view': return <EnterpriseOrgsManager />;
      case 'squad-comparison': return <SquadComparisonView />;
      case 'squad-health': return <SquadHealthDashboard />;
      case 'squad-archival': return <SquadArchivalManager />;
      case 'orgs': return <OrgsManager />;
      case 'org-applications': return <OrgApplicationsManager />;
      // Support
      case 'support-inbox': return <SupportDashboard />;
      case 'support-dm': return <AdminDirectMessages />;
      case 'cliques-manager': return <CliquesManager />;
      case 'moderation-dashboard': return <ModerationDashboard />;
      case 'support-analytics': return <SupportAnalytics />;
      case 'support-categories': return <IssueCategoriesManager />;
      // Partners
      case 'creators': return <CreatorsManager />;
      case 'sponsors': return <SponsorsManager />;
      case 'creator-preview': return <CreatorPreviewTab />;
      case 'sponsor-preview': return <SponsorPreviewTab />;
      // Content
      case 'ugc-manager': return <UGCManager />;
      case 'testimonials': return <TestimonialsManager />;
      // Communications
      case 'messaging': return <MessagingCenter />;
      case 'notification-console': return <NotificationConsole />;
      // Growth
      case 'waitlist': return <WaitlistManager />;
      case 'invite-codes': return <InviteCodesManager />;
      case 'friend-referrals': return <ReferralAnalytics />;
      case 'onboarding-feedback': return <OnboardingFeedbackManager />;
      // Payments & Premium
      case 'pilot-demand': return <PilotDemandDashboard />;
      case 'tier-accounts': return <TierAccountsView />;
      case 'tier-applications': return <TierApplicationsManager />;
      case 'arr-forecasting': return <ARRForecasting />;
      // Insights
      // Insights
      case 'analytics': return <Analytics />;
      // Identity System
      case 'trait-library': return <TraitLibraryManager />;
      case 'emerging-traits': return <EmergingTraitsReview />;
      case 'user-inspector': return <UserProfileInspector />;
      case 'ai-logs': return <AIInferenceLogsViewer />;
      case 'ai-prompts': return <PromptManager />;
      // Gamification
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
      case 'devtools': return <div className="p-8 text-muted-foreground text-center">Dev Tools section removed</div>;
      // Documentation
      case 'docs-manager': return <DocsManager />;
      case 'docs-playbooks': return <DocsPlaybookManager />;
      case 'docs-export': return <DocsExportPanel />;
      default: return <ApprovalInbox />;
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          {/* Key Stats Dashboard - Compact on mobile */}
          <div className="mb-4">
            <PlatformStats />
          </div>

          {/* Header - Smaller on mobile */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-foreground">Quest Ops Console</h1>
            <p className="text-sm text-muted-foreground mt-1 hidden sm:block">Manage quests, partners, and gamification</p>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:gap-6">
            {/* Sidebar Navigation - Desktop only */}
            <aside className="hidden lg:block lg:w-56 xl:w-64 flex-shrink-0">
              <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-2">
                <AdminSectionNav activeTab={activeTab} onTabChange={setActiveTab} />
              </div>
            </aside>

            {/* Mobile Navigation - Collapsible drawer style */}
            <div className="lg:hidden mb-4">
              <details className="group">
                <summary className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer list-none">
                  <span className="font-medium text-sm">Navigation Menu</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 max-h-[50vh] overflow-y-auto bg-card border rounded-lg p-2">
                  <AdminSectionNav activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
              </details>
            </div>

            {/* Content - Full width with overflow handling */}
            <div className="flex-1 min-w-0 overflow-x-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
