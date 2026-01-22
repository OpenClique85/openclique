/**
 * =============================================================================
 * FILE: WorkWithUs.tsx
 * PURPOSE: The Work With Us page - for job seekers and volunteers
 * =============================================================================
 * 
 * WHAT THIS FILE CONTROLS:
 * - Job/volunteer opportunities landing page
 * - Available roles grid with icons
 * - "Who We Look For" trait tags
 * - FAQ accordion
 * - In-app application form modal
 * 
 * WHERE TO EDIT COPY/TEXT:
 * - All text: src/constants/content.ts → WORK_WITH_US_PAGE
 * 
 * LAST UPDATED: January 2025
 * =============================================================================
 */

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { WORK_WITH_US_PAGE } from "@/constants/content";
import { ArrowRight, Compass, Users, Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { VolunteerApplicationForm } from "@/components/forms";

// ============ IMAGES ============
import runningGroup from "@/assets/austin/running-group.jpg";
import coffeeShopFriends from "@/assets/austin/coffee-shop-friends.jpg";
import rooftopGathering from "@/assets/austin/rooftop-gathering.jpg";

const iconMap = {
  0: Compass,
  1: Users,
  2: Sparkles,
};

const roleImages = [runningGroup, coffeeShopFriends, rooftopGathering];

export default function WorkWithUs() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 md:py-24 relative overflow-hidden">
          
          {/* ============ BACKGROUND IMAGE ============ */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url(${runningGroup})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto">
              
              {/* ============ HEADER ============ */}
              <div className="text-center mb-12">
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {WORK_WITH_US_PAGE.title}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {WORK_WITH_US_PAGE.subtitle}
                </p>
              </div>

              {/* ============ ROLES GRID ============ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {WORK_WITH_US_PAGE.roles.map((role, index) => {
                  const Icon = iconMap[index as keyof typeof iconMap] || Sparkles;
                  const bgImage = roleImages[index];
                  return (
                    <div
                      key={role.title}
                      className="group bg-card rounded-xl p-6 border border-border text-center relative overflow-hidden hover:border-navy/50 hover:shadow-lg transition-all duration-300"
                    >
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                        style={{
                          backgroundImage: `url(${bgImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-navy/20 transition-colors">
                          <Icon className="w-6 h-6 text-navy" />
                        </div>
                        <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                          {role.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ============ WHO WE LOOK FOR ============ */}
              <div className="text-center mb-12">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Who We Look For
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {WORK_WITH_US_PAGE.whoWeLookFor.map((trait) => (
                    <span
                      key={trait}
                      className="px-4 py-2 bg-navy/10 text-navy rounded-full text-sm font-medium"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* ============ FAQ ============ */}
              <div className="mb-12">
                <h2 className="font-display text-xl font-semibold text-foreground mb-6 text-center">
                  Questions?
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {WORK_WITH_US_PAGE.faq.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* ============ CTA BUTTON ============ */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={() => setFormOpen(true)}
                  className="bg-navy text-navy-foreground hover:bg-navy/90 text-base px-8 gap-2"
                >
                  {WORK_WITH_US_PAGE.ctaText}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  {WORK_WITH_US_PAGE.note}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* ============ APPLICATION FORM MODAL ============ */}
      <VolunteerApplicationForm
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
