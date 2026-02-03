/**
 * =============================================================================
 * APP.TSX - MAIN APPLICATION ENTRY POINT
 * =============================================================================
 * 
 * This is the root component of the OpenClique website. It sets up:
 * - All page routes (URLs) with lazy loading for performance
 * - Global providers for tooltips, toasts (popup notifications), and data fetching
 * 
 * PERFORMANCE OPTIMIZATION:
 * - All page components are lazy-loaded to reduce initial bundle size
 * - Routes are split into logical chunks for optimal caching
 * - Suspense boundaries provide loading states during chunk loading
 * 
 * HOW TO ADD A NEW PAGE:
 * 1. Create a new file in src/pages/ (e.g., NewPage.tsx)
 * 2. Add a lazy import below with the other page imports
 * 3. Add a new <Route> line inside the <Routes> block
 * 
 * =============================================================================
 */

import { lazy, Suspense } from 'react';

// -----------------------------------------------------------------------------
// IMPORTS: UI Components (notifications and tooltips)
// -----------------------------------------------------------------------------
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// -----------------------------------------------------------------------------
// IMPORTS: Data & Routing
// -----------------------------------------------------------------------------
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// -----------------------------------------------------------------------------
// IMPORTS: Core providers and components (not lazy - always needed)
// -----------------------------------------------------------------------------
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TutorialProvider, TutorialOverlay, TutorialPrompt } from "./components/tutorial";
import { MobileActionBar } from "./components/MobileActionBar";
import { FloatingHelpButton } from "./components/support/FloatingHelpButton";

// -----------------------------------------------------------------------------
// LOADING FALLBACK: Displayed while lazy components load
// -----------------------------------------------------------------------------
import { Loader2 } from "lucide-react";

const PageLoader = () => (
  <div className="min-h-dvh bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// -----------------------------------------------------------------------------
// LAZY IMPORTS: Page Components (code-split for performance)
// Each page loads only when navigated to, reducing initial bundle size
// -----------------------------------------------------------------------------

// Main pages (most commonly accessed)
const Index = lazy(() => import("./pages/Index"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const About = lazy(() => import("./pages/About"));
const Quests = lazy(() => import("./pages/Quests"));
const QuestDetail = lazy(() => import("./pages/QuestDetail"));
const QuestCard = lazy(() => import("./pages/QuestCard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Auth pages
const Auth = lazy(() => import("./pages/Auth"));
const MyQuests = lazy(() => import("./pages/MyQuests"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));

// Clique pages
const CliqueDetail = lazy(() => import("./pages/CliqueDetail"));
const CliqueWarmUp = lazy(() => import("./pages/CliqueWarmUp"));
const CliqueCreate = lazy(() => import("./pages/CliqueCreate"));
const JoinClique = lazy(() => import("./pages/JoinClique"));

// User support & engagement
const Notifications = lazy(() => import("./pages/Notifications"));
const UserSearch = lazy(() => import("./pages/UserSearch"));
const Support = lazy(() => import("./pages/Support"));
const SupportTicketDetail = lazy(() => import("./pages/SupportTicketDetail"));
const FeedbackFlow = lazy(() => import("./pages/FeedbackFlow"));

// Funnel pages
const Pilot = lazy(() => import("./pages/Pilot"));
const Partners = lazy(() => import("./pages/Partners"));
const WorkWithUs = lazy(() => import("./pages/WorkWithUs"));

// Admin pages (heavy, rarely accessed by most users)
const Admin = lazy(() => import("./pages/Admin"));
const PilotControlRoom = lazy(() => import("./pages/admin/PilotControlRoom"));
const EnterprisePortal = lazy(() => import("./pages/EnterprisePortal"));

// Creator pages (separate chunk for creator portal)
const CreatorsHub = lazy(() => import("./pages/CreatorsHub"));
const ContentCreatorsPage = lazy(() => import("./pages/ContentCreatorsPage"));
const QuestCreatorsPage = lazy(() => import("./pages/QuestCreatorsPage"));
const CreatorOnboarding = lazy(() => import("./pages/CreatorOnboarding"));
const CreatorsDirectory = lazy(() => import("./pages/CreatorsDirectory"));
const CreatorPublicProfile = lazy(() => import("./pages/CreatorPublicProfile"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const CreatorQuests = lazy(() => import("./pages/CreatorQuests"));
const CreatorProfile = lazy(() => import("./pages/CreatorProfile"));
const CreatorAnalyticsPage = lazy(() => import("./pages/CreatorAnalyticsPage"));
const CreatorProposals = lazy(() => import("./pages/CreatorProposals"));
const CreatorOrgRequests = lazy(() => import("./pages/CreatorOrgRequests"));
const CreatorInbox = lazy(() => import("./pages/CreatorInbox"));
const CreatorBrowseListings = lazy(() => import("./pages/CreatorBrowseListings"));
const QuestBuilder = lazy(() => import("./pages/QuestBuilder"));
const CreatorQuestRuntime = lazy(() => import("./pages/CreatorQuestRuntime"));
const ImportEventbriteQuest = lazy(() => import("./pages/ImportEventbriteQuest"));
const OrgPortal = lazy(() => import("./pages/OrgPortal"));
const ClubDashboardPage = lazy(() => import("./pages/ClubDashboardPage"));
const OrgPage = lazy(() => import("./pages/OrgPage"));
const EventbriteCallback = lazy(() => import("./pages/EventbriteCallback"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

// Sponsor pages (separate chunk for sponsor portal)
const SponsorOnboarding = lazy(() => import("./pages/SponsorOnboarding"));
const SponsorPublicProfile = lazy(() => import("./pages/SponsorPublicProfile"));
const SponsorDashboard = lazy(() => import("./pages/SponsorDashboard"));
const SponsorRewards = lazy(() => import("./pages/SponsorRewards"));
const SponsorVenues = lazy(() => import("./pages/SponsorVenues"));
const SponsorListings = lazy(() => import("./pages/SponsorListings"));
const SponsorDiscover = lazy(() => import("./pages/SponsorDiscover"));
const SponsorBrowseCreators = lazy(() => import("./pages/SponsorBrowseCreators"));
const SponsorBrowseOrgs = lazy(() => import("./pages/SponsorBrowseOrgs"));
const SponsorOrgRequests = lazy(() => import("./pages/SponsorOrgRequests"));
const SponsorProposals = lazy(() => import("./pages/SponsorProposals"));
const SponsorAnalytics = lazy(() => import("./pages/SponsorAnalytics"));
const SponsorProfile = lazy(() => import("./pages/SponsorProfile"));

// Legal pages
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

// -----------------------------------------------------------------------------
// SETUP: Initialize data fetching client with optimized defaults
// -----------------------------------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// -----------------------------------------------------------------------------
// MAIN APP COMPONENT
// -----------------------------------------------------------------------------
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TutorialProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
          <BrowserRouter>
            {/* Tutorial components must be inside BrowserRouter since they use useNavigate */}
            <TutorialOverlay />
            <TutorialPrompt />
            {/* Mobile bottom navigation bar */}
            <MobileActionBar />
            {/* Floating help button */}
            <FloatingHelpButton />
            
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* MAIN PAGES */}
                <Route path="/" element={<Index />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/about" element={<About />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/quests" element={<Quests />} />
                <Route path="/quests/:slug" element={<QuestDetail />} />
                <Route path="/quest-card/:token" element={<QuestCard />} />
                
                {/* CALLBACKS & VERIFICATION */}
                <Route path="/auth/eventbrite/callback" element={<EventbriteCallback />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                
                {/* AUTH */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/my-quests" element={<ProtectedRoute><MyQuests /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/cliques/new" element={<ProtectedRoute><CliqueCreate /></ProtectedRoute>} />
                <Route path="/cliques/:cliqueId" element={<ProtectedRoute><CliqueDetail /></ProtectedRoute>} />
                <Route path="/cliques/:cliqueId/warmup" element={<ProtectedRoute><CliqueWarmUp /></ProtectedRoute>} />
                <Route path="/join/:code" element={<JoinClique />} />
                {/* Legacy routes for backward compatibility */}
                <Route path="/squads/:squadId" element={<ProtectedRoute><CliqueDetail /></ProtectedRoute>} />
                <Route path="/warmup/:squadId" element={<ProtectedRoute><CliqueWarmUp /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute><UserSearch /></ProtectedRoute>} />
                <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
                <Route path="/support/:ticketId" element={<ProtectedRoute><SupportTicketDetail /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                <Route path="/admin/pilot/:instanceId" element={<ProtectedRoute requireAdmin><PilotControlRoom /></ProtectedRoute>} />
                <Route path="/enterprise" element={<ProtectedRoute requireAdmin><EnterprisePortal /></ProtectedRoute>} />
                <Route path="/feedback/:questId" element={<ProtectedRoute><FeedbackFlow /></ProtectedRoute>} />
                
                {/* SIGNUP/FUNNEL PAGES */}
                <Route path="/pilot" element={<Pilot />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/work-with-us" element={<WorkWithUs />} />
                
                {/* CREATOR PAGES */}
                <Route path="/creators" element={<CreatorsHub />} />
                <Route path="/org/:slug" element={<OrgPortal />} />
                <Route path="/org/:slug/dashboard" element={<ProtectedRoute><ClubDashboardPage /></ProtectedRoute>} />
                <Route path="/organizations/:orgSlug" element={<OrgPage />} />
                <Route path="/creators/content-creators" element={<ContentCreatorsPage />} />
                <Route path="/creators/quest-creators" element={<QuestCreatorsPage />} />
                <Route path="/creators/onboard" element={<CreatorOnboarding />} />
                <Route path="/creators/directory" element={<CreatorsDirectory />} />
                <Route path="/creators/:slug" element={<CreatorPublicProfile />} />
                <Route path="/creator" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
                <Route path="/creator/quests" element={<ProtectedRoute><CreatorQuests /></ProtectedRoute>} />
                <Route path="/creator/inbox" element={<ProtectedRoute><CreatorInbox /></ProtectedRoute>} />
                <Route path="/creator/proposals" element={<ProtectedRoute><CreatorProposals /></ProtectedRoute>} />
                <Route path="/creator/org-requests" element={<ProtectedRoute><CreatorOrgRequests /></ProtectedRoute>} />
                <Route path="/creator/analytics" element={<ProtectedRoute><CreatorAnalyticsPage /></ProtectedRoute>} />
                <Route path="/creator/profile" element={<ProtectedRoute><CreatorProfile /></ProtectedRoute>} />
                <Route path="/creator/quests/new" element={<ProtectedRoute><QuestBuilder /></ProtectedRoute>} />
                <Route path="/creator/quests/import-eventbrite" element={<ProtectedRoute><ImportEventbriteQuest /></ProtectedRoute>} />
                <Route path="/creator/quests/:questId/edit" element={<ProtectedRoute><QuestBuilder /></ProtectedRoute>} />
                <Route path="/creator/quests/:questId/run" element={<ProtectedRoute><CreatorQuestRuntime /></ProtectedRoute>} />
                
                {/* SPONSOR PAGES */}
                <Route path="/sponsors/onboard" element={<SponsorOnboarding />} />
                <Route path="/sponsors/:slug" element={<SponsorPublicProfile />} />
                <Route path="/sponsor" element={<ProtectedRoute><SponsorDashboard /></ProtectedRoute>} />
                <Route path="/sponsor/rewards" element={<ProtectedRoute><SponsorRewards /></ProtectedRoute>} />
                <Route path="/sponsor/venues" element={<ProtectedRoute><SponsorVenues /></ProtectedRoute>} />
                <Route path="/sponsor/listings" element={<ProtectedRoute><SponsorListings /></ProtectedRoute>} />
                <Route path="/sponsor/discover" element={<ProtectedRoute><SponsorDiscover /></ProtectedRoute>} />
                <Route path="/sponsor/browse-creators" element={<ProtectedRoute><SponsorBrowseCreators /></ProtectedRoute>} />
                <Route path="/sponsor/browse-orgs" element={<ProtectedRoute><SponsorBrowseOrgs /></ProtectedRoute>} />
                <Route path="/sponsor/org-requests" element={<ProtectedRoute><SponsorOrgRequests /></ProtectedRoute>} />
                <Route path="/sponsor/proposals" element={<ProtectedRoute><SponsorProposals /></ProtectedRoute>} />
                <Route path="/sponsor/analytics" element={<ProtectedRoute><SponsorAnalytics /></ProtectedRoute>} />
                <Route path="/sponsor/profile" element={<ProtectedRoute><SponsorProfile /></ProtectedRoute>} />
                
                {/* CREATOR BROWSE */}
                <Route path="/creator/browse-listings" element={<ProtectedRoute><CreatorBrowseListings /></ProtectedRoute>} />
                
                {/* LEGAL PAGES */}
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </TutorialProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
