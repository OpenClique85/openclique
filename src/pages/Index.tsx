/**
 * =============================================================================
 * FILE: Index.tsx
 * PURPOSE: The homepage of OpenClique - the main landing page users see first
 * =============================================================================
 * 
 * WHAT THIS FILE CONTROLS:
 * - Overall page structure and layout of the homepage
 * - Which sections appear and in what order
 * - The floating BUGGS mascot message
 * 
 * WHERE TO EDIT COPY/TEXT:
 * - Most text content is in the individual components listed below
 * - Hero section text: src/components/Hero.tsx (pulls from src/constants/content.ts → HERO)
 * - Benefits: src/components/BenefitsSection.tsx (pulls from src/constants/content.ts → BENEFITS)
 * - FAQ: src/components/FAQ.tsx (pulls from src/constants/content.ts → FAQ)
 * - BUGGS message: Line 26 below (message prop)
 * 
 * SECTION ORDER (top to bottom):
 * 1. Navbar (navigation bar)
 * 2. Hero (main banner with headline and CTA)
 * 3. HowItWorksMini (3-step quick overview)
 * 4. BenefitsSection (3 benefit cards)
 * 5. WhoItsForSection (persona selection grid)
 * 6. TestimonialsSection (user stories carousel)
 * 7. FAQ (frequently asked questions)
 * 8. CTASection (final call-to-action)
 * 9. Footer (site footer)
 * 10. BuggsFloating (floating mascot widget)
 * 
 * RELATED FILES:
 * - src/components/Hero.tsx (hero banner)
 * - src/components/HowItWorksMini.tsx (3-step overview)
 * - src/components/BenefitsSection.tsx (benefit cards)
 * - src/components/WhoItsForSection.tsx (persona grid)
 * - src/components/TestimonialsSection.tsx (testimonials)
 * - src/components/FAQ.tsx (FAQ accordion)
 * - src/components/CTASection.tsx (final CTA)
 * - src/constants/content.ts (centralized content)
 * 
 * LAST UPDATED: January 2025
 * =============================================================================
 */

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { HowItWorksMini } from "@/components/HowItWorksMini";
import { BenefitsSection } from "@/components/BenefitsSection";
import { WhoItsForSection } from "@/components/WhoItsForSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { UGCShowcase } from "@/components/UGCShowcase";
import { FAQTeaser } from "@/components/help";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import BuggsFloating from "@/components/BuggsFloating";

/**
 * Index Page Component
 * 
 * This is the main homepage component. It assembles all the marketing sections
 * in order. To change the order of sections, rearrange the components below.
 * To remove a section, simply delete or comment out the component.
 */
const Index = () => {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* ============ NAVIGATION ============ */}
      <Navbar />
      
      <main className="flex-1">
        {/* ============ SECTION 1: Hero Banner ============ */}
        {/* Main headline, subheadline, and primary CTA buttons */}
        <Hero />
        
        {/* ============ SECTION 2: Quick Overview ============ */}
        {/* 3-step mini explanation of how OpenClique works */}
        <HowItWorksMini />
        
        {/* ============ SECTION 3: Benefits Grid ============ */}
        {/* 3 cards showing key benefits with icons and images */}
        <BenefitsSection />
        
        {/* ============ SECTION 4: Who It's For ============ */}
        {/* Clickable persona cards that open detail modals */}
        <WhoItsForSection />
        
        {/* ============ SECTION 5: Testimonials ============ */}
        {/* Horizontal carousel of user testimonials */}
        <TestimonialsSection />
        
        {/* ============ SECTION 6: Community UGC ============ */}
        {/* Approved user photos/videos from quests */}
        <UGCShowcase limit={6} />
        
        {/* ============ SECTION 7: FAQ Teaser ============ */}
        {/* Condensed FAQ with link to full Help Center */}
        <FAQTeaser />
        
        {/* ============ SECTION 7: Final CTA ============ */}
        {/* Dark section with "Join the Pilot" and "Get Involved" buttons */}
        <CTASection />
      </main>
      
      {/* ============ FOOTER ============ */}
      <Footer />
      
      {/* ============ FLOATING MASCOT ============ */}
      {/* BUGGS appears in bottom-right corner with a message bubble */}
      {/* To change the message, edit the "message" prop below */}
      <BuggsFloating message="Ready to find your clique?" />
    </div>
  );
};

export default Index;
