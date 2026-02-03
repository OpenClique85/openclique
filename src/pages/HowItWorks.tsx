/**
 * =============================================================================
 * FILE: HowItWorks.tsx
 * PURPOSE: The How It Works page - explains the OpenClique process and journey
 * =============================================================================
 * 
 * WHAT THIS FILE CONTROLS:
 * - "The Journey" numbered steps section
 * - Interactive quest path carousel (culture/wellness/connector trees)
 * - User progression timeline
 * - "Meet BUGGS" feature section
 * - CTA section at the bottom
 * 
 * WHERE TO EDIT COPY/TEXT:
 * - Hero title/subtitle: src/constants/content.ts → HOW_IT_WORKS.heroTitle/heroSubtitle
 * - Journey steps: src/constants/content.ts → HOW_IT_WORKS.steps
 * - BUGGS section: src/constants/content.ts → HOW_IT_WORKS.buggs
 * 
 * RELATED FILES:
 * - src/constants/content.ts (HOW_IT_WORKS for all text)
 * - src/components/progression/PathCarousel.tsx (interactive path selector)
 * - src/components/UserJourneySection.tsx (progression timeline)
 * - src/components/CTASection.tsx (final CTA)
 * 
 * LAST UPDATED: January 2025
 * =============================================================================
 */

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CTASection } from "@/components/CTASection";
import { HOW_IT_WORKS } from "@/constants/content";
import { Check } from "lucide-react";
import PathCarousel from "@/components/progression/PathCarousel";
import { UserJourneySection } from "@/components/UserJourneySection";
import { SearchableHelpSection, GlossarySection } from "@/components/help";

// ============ IMAGES ============
import buggsFace from "@/assets/buggs-face.png";       // BUGGS mascot for Meet BUGGS section
import runningGroup from "@/assets/austin/running-group.jpg"; // Hero background

/**
 * How It Works Page Component
 * 
 * Explains the OpenClique process from signup to ongoing engagement.
 */
export default function HowItWorks() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1">
        
        {/* ============ SECTION 1: HERO ============ */}
        {/* Text from: src/constants/content.ts → HOW_IT_WORKS.heroTitle/heroSubtitle */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          {/* Background image */}
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `url(${runningGroup})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                {HOW_IT_WORKS.heroTitle}
              </h1>
              <p className="text-lg text-muted-foreground">
                {HOW_IT_WORKS.heroSubtitle}
              </p>
            </div>
          </div>
        </section>

        {/* ============ SECTION 2: THE JOURNEY (Steps) ============ */}
        {/* Steps from: src/constants/content.ts → HOW_IT_WORKS.steps */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-foreground mb-12 text-center">
                The Journey {/* ← EDIT SECTION HEADLINE HERE */}
              </h2>
              
              <div className="relative">
                {/* Vertical connector line (desktop only) */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
                
                <div className="space-y-8">
                  {HOW_IT_WORKS.steps.map((step) => (
                    <div
                      key={step.number}
                      className="relative flex gap-6 items-start"
                    >
                      {/* Step number circle */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground font-display font-bold text-xl flex items-center justify-center z-10">
                        {step.number}
                      </div>
                      
                      {/* Step content card */}
                      <div className="flex-1 bg-card rounded-xl p-6 border border-border">
                        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION 3: YOUR QUEST JOURNEY ============ */}
        {/* Interactive path selector showing branching progression trees */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                  Your Quest Journey {/* ← EDIT SECTION HEADLINE HERE */}
                </h2>
                <p className="text-lg text-muted-foreground">
                  Complete experiences with your squad. Choices you make together shape what opens next. {/* ← EDIT SECTION SUBHEADLINE HERE */}
                </p>
              </div>

              {/* Interactive Path Carousel */}
              {/* Component: src/components/progression/PathCarousel.tsx */}
              <PathCarousel />

              {/* Explanation footer */}
              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Each decision your squad makes opens different doors. 
                  Come back together to discover your unique path.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION 4: YOUR PROGRESSION ============ */}
        {/* Timeline showing user journey from first quest to alumni */}
        {/* Component: src/components/UserJourneySection.tsx */}
        <UserJourneySection />

        {/* ============ SECTION 5: MEET BUGGS ============ */}
        {/* Text from: src/constants/content.ts → HOW_IT_WORKS.buggs */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 md:p-12 border border-primary/10">
                {/* Centered layout */}
                <div className="flex flex-col items-center text-center">
                  
                  {/* BUGGS Mascot Image */}
                  <div className="mb-8 flex justify-center">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white shadow-lg border border-border/50 flex items-center justify-center p-2">
                      <img 
                        src={buggsFace} 
                        alt="BUGGS - Behavioral Utility for Group Guidance & Structure"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
                      {HOW_IT_WORKS.buggs.title}
                    </h2>
                    <p className="text-sm text-primary font-medium mb-3">
                      {HOW_IT_WORKS.buggs.subtitle}
                    </p>
                    <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                      {HOW_IT_WORKS.buggs.description}
                    </p>
                    
                    {/* BUGGS Features List */}
                    <ul className="space-y-3 inline-block text-left">
                      {HOW_IT_WORKS.buggs.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION 6: FAQ (Consolidated Help Center) ============ */}
        {/* Searchable FAQ with category filters */}
        <div id="faq">
          <SearchableHelpSection />
        </div>

        {/* ============ SECTION 7: GLOSSARY ============ */}
        {/* Searchable A-Z platform terminology */}
        <GlossarySection />

        {/* ============ SECTION 8: CTA ============ */}
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
