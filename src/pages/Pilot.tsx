/**
 * =============================================================================
 * FILE: Pilot.tsx
 * PURPOSE: The Pilot signup page - for users joining the Austin pilot program
 * =============================================================================
 * 
 * WHAT THIS FILE CONTROLS:
 * - Pilot program landing page
 * - BUGGS mascot header with animated "accepting applications" badge
 * - "What to expect" list
 * - CTA button that opens Google Form
 * 
 * WHERE TO EDIT COPY/TEXT:
 * - Title and subtitle: src/constants/content.ts → PILOT_PAGE.title/subtitle
 * - What to expect list: src/constants/content.ts → PILOT_PAGE.whatToExpect
 * - CTA button text: src/constants/content.ts → PILOT_PAGE.ctaText
 * - Note below button: src/constants/content.ts → PILOT_PAGE.note
 * - Application form URL: src/constants/content.ts → FORM_URLS.pilot
 * 
 * RELATED FILES:
 * - src/constants/content.ts (PILOT_PAGE and FORM_URLS)
 * - src/assets/buggs-face.png (BUGGS mascot image)
 * - src/assets/austin/zilker-park.jpg (background image)
 * 
 * LAST UPDATED: January 2025
 * =============================================================================
 */

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { PILOT_PAGE, FORM_URLS } from "@/constants/content";
import { ArrowRight, Check } from "lucide-react";

// ============ IMAGES ============
import buggsFace from "@/assets/buggs-face.png";       // BUGGS mascot icon
import zilkerPark from "@/assets/austin/zilker-park.jpg"; // Background image

/**
 * Pilot Page Component
 * 
 * Simple signup page for the Austin pilot program.
 */
export default function Pilot() {
  /**
   * Opens the pilot application Google Form
   * URL defined in: src/constants/content.ts → FORM_URLS.pilot
   */
  const handleCTAClick = () => {
    window.open(FORM_URLS.pilot, "_blank");
  };

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
                
                {/* Animated "accepting applications" badge */}
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Now accepting applications {/* ← EDIT BADGE TEXT HERE */}
                </div>
                
                {/* Page title and subtitle */}
                {/* Text from: src/constants/content.ts → PILOT_PAGE.title/subtitle */}
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {PILOT_PAGE.title}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {PILOT_PAGE.subtitle}
                </p>
              </div>

              {/* ============ WHAT TO EXPECT LIST ============ */}
              {/* Items from: src/constants/content.ts → PILOT_PAGE.whatToExpect */}
              <div className="bg-card rounded-xl p-8 border border-border mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                  What to expect {/* ← EDIT SECTION HEADLINE HERE */}
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
              {/* Button text from: src/constants/content.ts → PILOT_PAGE.ctaText */}
              {/* Opens: src/constants/content.ts → FORM_URLS.pilot */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleCTAClick}
                  className="text-base px-8 gap-2"
                >
                  {PILOT_PAGE.ctaText}
                  <ArrowRight className="w-4 h-4" />
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
