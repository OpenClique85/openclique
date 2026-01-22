/**
 * =============================================================================
 * FILE: CreatorsHub.tsx
 * PURPOSE: The Creators Hub landing page - chooser between Content and Quest creators
 * =============================================================================
 * 
 * WHAT THIS FILE CONTROLS:
 * - Creators landing page with two path options
 * - "Content Creators" path card (for influencers/podcasters)
 * - "Quest Creators" path card (for local experts/event planners)
 * - "Apply Now" CTA that opens Google Form
 * 
 * WHERE TO EDIT COPY/TEXT:
 * - Path titles, taglines, and "perfectFor" lists: Lines 25-50 below (paths array)
 * - CTA form URL: src/constants/content.ts → FORM_URLS.creators
 * 
 * PATH CARDS LINK TO:
 * - Content Creators: /creators/content-creators (ContentCreatorsPage.tsx)
 * - Quest Creators: /creators/quest-creators (QuestCreatorsPage.tsx)
 * 
 * RELATED FILES:
 * - src/pages/ContentCreatorsPage.tsx (content creator detailed page)
 * - src/pages/QuestCreatorsPage.tsx (quest creator detailed page)
 * - src/constants/content.ts (FORM_URLS.creators)
 * 
 * LAST UPDATED: January 2025
 * =============================================================================
 */

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, MapPin, Users, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { FORM_URLS } from "@/constants/content";

// ============ IMAGES ============
import rooftopGathering from "@/assets/austin/rooftop-gathering.jpg";
import sunsetGathering from "@/assets/austin/sunset-gathering.jpg";

/**
 * CREATOR PATH DEFINITIONS
 * 
 * Configure the two creator paths shown on this page.
 * Each path links to a detailed page with more information.
 * 
 * To edit:
 * - title: The main heading on the card
 * - tagline: Short description under the title
 * - perfectFor: List of persona tags (who this is for)
 * - href: The route to the detailed page
 * - image: Background image for the card
 * - color: Theme color (creator = coral, sunset = orange)
 * - Icon: Lucide icon shown at top of card
 */
const paths = [
  {
    id: "content-creators",
    title: "Content Creators",           // ← EDIT TITLE HERE
    tagline: "Activate your audience in the real world",  // ← EDIT TAGLINE HERE
    perfectFor: ["Podcasters", "Fitness creators", "Food bloggers", "Educators"], // ← EDIT TAGS HERE
    href: "/creators/content-creators",
    image: rooftopGathering,
    color: "creator" as const,
    Icon: Mic,
  },
  {
    id: "quest-creators",
    title: "Quest Creators",              // ← EDIT TITLE HERE
    tagline: "Turn your local knowledge into a side hustle",  // ← EDIT TAGLINE HERE
    perfectFor: ["Event planners", "Local experts", "Community organizers"], // ← EDIT TAGS HERE
    href: "/creators/quest-creators",
    image: sunsetGathering,
    color: "sunset" as const,
    Icon: MapPin,
  },
];

/**
 * Creators Hub Page Component
 * 
 * Landing page that helps creators choose their path.
 */
export default function CreatorsHub() {
  /**
   * Opens the creator application Google Form
   * URL defined in: src/constants/content.ts → FORM_URLS.creators
   */
  const handleApply = () => {
    window.open(FORM_URLS.creators, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        
        {/* ============ HERO SECTION ============ */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              {/* "For Creators" badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-creator/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-creator" />
                <span className="text-sm font-medium text-creator">For Creators</span>
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Bring Your People IRL {/* ← EDIT HEADLINE HERE */}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Two paths to building real-world community {/* ← EDIT SUBHEADLINE HERE */}
              </p>
            </div>
          </div>
        </section>

        {/* ============ TWO-PATH CHOOSER ============ */}
        {/* Two cards that link to the detailed creator pages */}
        <section className="flex-1 py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {paths.map((path) => {
                  // Dynamic color classes based on path.color
                  const colorClasses = path.color === "creator" 
                    ? "border-creator/30 hover:border-creator bg-creator/5 hover:bg-creator/10"
                    : "border-sunset/30 hover:border-sunset bg-sunset/5 hover:bg-sunset/10";
                  const buttonClasses = path.color === "creator"
                    ? "bg-creator text-creator-foreground hover:bg-creator/90"
                    : "bg-sunset text-sunset-foreground hover:bg-sunset/90";
                  const tagClasses = path.color === "creator"
                    ? "bg-creator/10 text-creator"
                    : "bg-sunset/10 text-sunset";
                  const IconComponent = path.Icon;

                  return (
                    <div
                      key={path.id}
                      className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 ${colorClasses}`}
                    >
                      {/* Background Image */}
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: `url(${path.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60" />
                      
                      {/* Card Content */}
                      <div className="relative z-10 p-8 md:p-10 flex flex-col min-h-[380px]">
                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${tagClasses}`}>
                          <IconComponent className="w-7 h-7" />
                        </div>
                        
                        {/* Title and tagline */}
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                          {path.title}
                        </h2>
                        <p className="text-lg text-muted-foreground mb-6">
                          {path.tagline}
                        </p>
                        
                        {/* "Perfect for" tags */}
                        <div className="mb-8">
                          <p className="text-sm font-medium text-foreground mb-3">Perfect for:</p>
                          <div className="flex flex-wrap gap-2">
                            {path.perfectFor.map((item) => (
                              <span 
                                key={item}
                                className={`px-3 py-1 rounded-full text-sm ${tagClasses}`}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Learn More button - links to detailed page */}
                        <div className="mt-auto">
                          <Button
                            asChild
                            size="lg"
                            className={`w-full gap-2 ${buttonClasses}`}
                          >
                            <Link to={path.href}>
                              Learn More
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ============ FOOTER CTA ============ */}
        {/* For users who aren't sure which path to choose */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users className="w-5 h-5 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Not sure which fits? Apply and we'll figure it out together. {/* ← EDIT TEXT HERE */}
                </p>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={handleApply}
                className="gap-2"
              >
                Apply Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
