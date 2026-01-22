/**
 * =============================================================================
 * APP.TSX - MAIN APPLICATION ENTRY POINT
 * =============================================================================
 * 
 * This is the root component of the OpenClique website. It sets up:
 * - All page routes (URLs) and which component displays for each
 * - Global providers for tooltips, toasts (popup notifications), and data fetching
 * 
 * HOW TO ADD A NEW PAGE:
 * 1. Create a new file in src/pages/ (e.g., NewPage.tsx)
 * 2. Import it below with the other page imports
 * 3. Add a new <Route> line inside the <Routes> block
 * 
 * ROUTE STRUCTURE:
 * - "/" = Homepage
 * - "/page-name" = Individual pages
 * - "/creators/*" = Creator sub-pages (nested under /creators)
 * - "*" = Catch-all for 404 (page not found)
 * 
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// IMPORTS: UI Components (notifications and tooltips)
// -----------------------------------------------------------------------------
import { Toaster } from "@/components/ui/toaster";        // Toast popup notifications
import { Toaster as Sonner } from "@/components/ui/sonner"; // Alternative toast style
import { TooltipProvider } from "@/components/ui/tooltip"; // Enables tooltips site-wide

// -----------------------------------------------------------------------------
// IMPORTS: Data & Routing
// -----------------------------------------------------------------------------
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Data fetching/caching
import { BrowserRouter, Routes, Route } from "react-router-dom";           // URL routing

// -----------------------------------------------------------------------------
// IMPORTS: Page Components
// Each page is its own file in src/pages/
// -----------------------------------------------------------------------------
import Index from "./pages/Index";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Pilot from "./pages/Pilot";
import Partners from "./pages/Partners";
import WorkWithUs from "./pages/WorkWithUs";
import CreatorsHub from "./pages/CreatorsHub";
import ContentCreatorsPage from "./pages/ContentCreatorsPage";
import QuestCreatorsPage from "./pages/QuestCreatorsPage";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Quests from "./pages/Quests";
import QuestDetail from "./pages/QuestDetail";
import SquadDetail from "./pages/SquadDetail";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import MyQuests from "./pages/MyQuests";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Feedback from "./pages/Feedback";
import Notifications from "./pages/Notifications";
import CreatorOnboarding from "./pages/CreatorOnboarding";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorQuests from "./pages/CreatorQuests";
import CreatorProfile from "./pages/CreatorProfile";
import CreatorAnalyticsPage from "./pages/CreatorAnalyticsPage";
import CreatorPublicProfile from "./pages/CreatorPublicProfile";
import QuestBuilder from "./pages/QuestBuilder";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

// -----------------------------------------------------------------------------
// SETUP: Initialize data fetching client
// -----------------------------------------------------------------------------
const queryClient = new QueryClient();

// -----------------------------------------------------------------------------
// MAIN APP COMPONENT
// -----------------------------------------------------------------------------
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        <BrowserRouter>
          <Routes>
            {/* MAIN PAGES */}
            <Route path="/" element={<Index />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/quests" element={<Quests />} />
            <Route path="/quests/:slug" element={<QuestDetail />} />
            
            {/* AUTH */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/my-quests" element={<ProtectedRoute><MyQuests /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/squads/:squadId" element={<ProtectedRoute><SquadDetail /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            <Route path="/feedback/:questId" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
            
            {/* SIGNUP/FUNNEL PAGES */}
            <Route path="/pilot" element={<Pilot />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/work-with-us" element={<WorkWithUs />} />
            
            {/* CREATOR PAGES */}
            <Route path="/creators" element={<CreatorsHub />} />
            <Route path="/creators/content-creators" element={<ContentCreatorsPage />} />
            <Route path="/creators/quest-creators" element={<QuestCreatorsPage />} />
            <Route path="/creators/onboard" element={<CreatorOnboarding />} />
            <Route path="/creators/:slug" element={<CreatorPublicProfile />} />
            <Route path="/creator" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
            <Route path="/creator/quests" element={<ProtectedRoute><CreatorQuests /></ProtectedRoute>} />
            <Route path="/creator/analytics" element={<ProtectedRoute><CreatorAnalyticsPage /></ProtectedRoute>} />
            <Route path="/creator/profile" element={<ProtectedRoute><CreatorProfile /></ProtectedRoute>} />
            <Route path="/creator/quests/new" element={<ProtectedRoute><QuestBuilder /></ProtectedRoute>} />
            <Route path="/creator/quests/:questId/edit" element={<ProtectedRoute><QuestBuilder /></ProtectedRoute>} />
            
            {/* LEGAL PAGES */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
