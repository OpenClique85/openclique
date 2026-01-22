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
import Index from "./pages/Index";                         // Homepage (/)
import HowItWorks from "./pages/HowItWorks";               // How It Works page
import About from "./pages/About";                         // About page
import Pilot from "./pages/Pilot";                         // Join the Pilot signup
import Partners from "./pages/Partners";                   // Partner signup page
import WorkWithUs from "./pages/WorkWithUs";               // Job/volunteer page
import CreatorsHub from "./pages/CreatorsHub";             // Creator landing page (/creators)
import ContentCreatorsPage from "./pages/ContentCreatorsPage"; // For influencers
import QuestCreatorsPage from "./pages/QuestCreatorsPage"; // For quest designers
import Privacy from "./pages/Privacy";                     // Privacy policy
import Terms from "./pages/Terms";                         // Terms of service
import Quests from "./pages/Quests";                       // Quest catalog
import NotFound from "./pages/NotFound";                   // 404 error page

// -----------------------------------------------------------------------------
// SETUP: Initialize data fetching client
// -----------------------------------------------------------------------------
const queryClient = new QueryClient();

// -----------------------------------------------------------------------------
// MAIN APP COMPONENT
// -----------------------------------------------------------------------------
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Toast notifications (appear in corner when triggered) */}
      <Toaster />
      <Sonner />
      
      {/* Router: Handles URL changes and displays correct page */}
      <BrowserRouter>
        <Routes>
          {/* ============================================= */}
          {/* MAIN PAGES */}
          {/* ============================================= */}
          <Route path="/" element={<Index />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/quests" element={<Quests />} />
          
          {/* ============================================= */}
          {/* SIGNUP/FUNNEL PAGES */}
          {/* ============================================= */}
          <Route path="/pilot" element={<Pilot />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/work-with-us" element={<WorkWithUs />} />
          
          {/* ============================================= */}
          {/* CREATOR PAGES (nested under /creators) */}
          {/* ============================================= */}
          <Route path="/creators" element={<CreatorsHub />} />
          <Route path="/creators/content-creators" element={<ContentCreatorsPage />} />
          <Route path="/creators/quest-creators" element={<QuestCreatorsPage />} />
          
          {/* ============================================= */}
          {/* LEGAL PAGES */}
          {/* ============================================= */}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          
          {/* ============================================= */}
          {/* 404 CATCH-ALL (must be last) */}
          {/* ============================================= */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
