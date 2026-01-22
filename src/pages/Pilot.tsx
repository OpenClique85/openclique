/**
 * =============================================================================
 * FILE: Pilot.tsx
 * PURPOSE: The Pilot page - now redirects to Quests or serves as overview
 * =============================================================================
 * 
 * WHAT THIS FILE CONTROLS:
 * - Pilot program overview page
 * - Redirects user to browse quests
 * 
 * WHERE TO EDIT COPY/TEXT:
 * - Title and subtitle: src/constants/content.ts → PILOT_PAGE
 * 
 * LAST UPDATED: January 2025
 * =============================================================================
 */

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { PILOT_PAGE } from "@/constants/content";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

// ============ IMAGES ============
import buggsFace from "@/assets/buggs-face.png";
import zilkerPark from "@/assets/austin/zilker-park.jpg";

/**
 * Pilot Page Component
 * 
 * Overview page that directs users to the Quests catalog.
 */
export default function Pilot() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 md:py-24 relative overflow-hidden">
          
          {/* ============ BACKGROUND IMAGE ============ */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url(${zilkerPark})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl mx-auto">
              
              {/* ============ HEADER WITH BUGGS ============ */}
              <div className="text-center mb-12">
                {/* BUGGS mascot image */}
                <div className="flex justify-center mb-6">
                  <img 
                    src={buggsFace} 
                    alt="" 
                    className="w-16 h-16 object-contain"
                  />
                </div>
                
                {/* Active badge */}
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Austin Pilot Now Live
                </div>
                
                {/* Page title and subtitle */}
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {PILOT_PAGE.title}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {PILOT_PAGE.subtitle}
                </p>
              </div>

              {/* ============ WHAT TO EXPECT LIST ============ */}
              <div className="bg-card rounded-xl p-8 border border-border mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                  What to expect
                </h2>
                <ul className="space-y-4">
                  {PILOT_PAGE.whatToExpect.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ============ CTA BUTTON ============ */}
              <div className="text-center">
                <Button
                  size="lg"
                  asChild
                  className="text-base px-8 gap-2"
                >
                  <Link to="/quests">
                    {PILOT_PAGE.ctaText}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  {PILOT_PAGE.note}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
