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
 * - "Apply Now" CTA that opens in-app form
 * 
 * LAST UPDATED: January 2025
 * =============================================================================
 */

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, MapPin, Users, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { CreatorApplicationForm } from "@/components/forms";

// ============ IMAGES ============
import rooftopGathering from "@/assets/austin/rooftop-gathering.jpg";
import sunsetGathering from "@/assets/austin/sunset-gathering.jpg";

const paths = [
  {
    id: "content-creators",
    title: "Content Creators",
    tagline: "Activate your audience in the real world",
    perfectFor: ["Podcasters", "Fitness creators", "Food bloggers", "Educators"],
    href: "/creators/content-creators",
    image: rooftopGathering,
    color: "creator" as const,
    Icon: Mic,
  },
  {
    id: "quest-creators",
    title: "Quest Creators",
    tagline: "Turn your local knowledge into a side hustle",
    perfectFor: ["Event planners", "Local experts", "Community organizers"],
    href: "/creators/quest-creators",
    image: sunsetGathering,
    color: "sunset" as const,
    Icon: MapPin,
  },
];

export default function CreatorsHub() {
  const [formOpen, setFormOpen] = useState(false);

  const handleApply = () => {
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        
        {/* ============ HERO SECTION ============ */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-creator/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-creator" />
                <span className="text-sm font-medium text-creator">For Creators</span>
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Bring Your People IRL
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Two paths to building real-world community
              </p>
            </div>
          </div>
        </section>

        {/* ============ TWO-PATH CHOOSER ============ */}
        <section className="flex-1 py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {paths.map((path) => {
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
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: `url(${path.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60" />
                      
                      <div className="relative z-10 p-8 md:p-10 flex flex-col min-h-[380px]">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${tagClasses}`}>
                          <IconComponent className="w-7 h-7" />
                        </div>
                        
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                          {path.title}
                        </h2>
                        <p className="text-lg text-muted-foreground mb-6">
                          {path.tagline}
                        </p>
                        
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
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users className="w-5 h-5 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Not sure which fits? Apply and we'll figure it out together.
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

      {/* ============ APPLICATION FORM MODAL ============ */}
      <CreatorApplicationForm
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
