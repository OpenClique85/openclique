/**
 * =============================================================================
 * FILE: Partners.tsx
 * PURPOSE: The Partners page - for businesses wanting to partner with OpenClique
 * =============================================================================
 * 
 * WHAT THIS FILE CONTROLS:
 * - Partner signup landing page
 * - Partner categories grid
 * - "Why It Works" concept cards
 * - "How It Works" process steps
 * - Partner category detail modal
 * - In-app partner application form
 * 
 * WHERE TO EDIT COPY/TEXT:
 * - All text content: src/constants/content.ts → PARTNERS_PAGE
 * 
 * LAST UPDATED: January 2025
 * =============================================================================
 */

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { PartnerCategoryModal } from "@/components/PartnerCategoryModal";
import { PartnerApplicationForm } from "@/components/forms";
import { PARTNERS_PAGE } from "@/constants/content";
import { 
  ArrowRight, 
  Beer, 
  Gift, 
  Building, 
  Briefcase, 
  Users, 
  Rocket,
  Clock,
  Home,
  LucideIcon
} from "lucide-react";

// ============ BACKGROUND IMAGE ============
import concertCrowd from "@/assets/austin/concert-crowd.jpg";

const categoryIconMap: Record<string, LucideIcon> = {
  Beer,
  Gift,
  Building,
  Briefcase,
  Users,
  Rocket,
};

const conceptIconMap: Record<string, LucideIcon> = {
  Clock,
  Home,
  Gift,
};

export default function Partners() {
  const [selectedCategory, setSelectedCategory] = useState<typeof PARTNERS_PAGE.categories[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [preselectedCategory, setPreselectedCategory] = useState<string | undefined>();

  const handleCTAClick = () => {
    setPreselectedCategory(undefined);
    setFormOpen(true);
  };

  const handleCategoryClick = (category: typeof PARTNERS_PAGE.categories[0]) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleApplyFromModal = (categoryId: string) => {
    setModalOpen(false);
    setPreselectedCategory(categoryId);
    setFormOpen(true);
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
              backgroundImage: `url(${concertCrowd})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              
              {/* ============ HEADER ============ */}
              <div className="text-center mb-8">
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {PARTNERS_PAGE.title}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {PARTNERS_PAGE.subtitle}
                </p>
              </div>

              {/* ============ PROBLEM HOOK ============ */}
              <div className="text-center mb-12">
                <p className="text-base md:text-lg text-foreground/80 italic max-w-xl mx-auto">
                  "{PARTNERS_PAGE.problemHook}"
                </p>
              </div>

              {/* ============ PARTNER CATEGORIES GRID ============ */}
              <div className="mb-16">
                <h2 className="font-display text-xl font-semibold text-foreground text-center mb-6">
                  Who We Work With
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {PARTNERS_PAGE.categories.map((category) => {
                    const Icon = categoryIconMap[category.icon] || Users;
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category)}
                        className="group bg-card rounded-xl p-5 border border-border text-left relative overflow-hidden hover:border-sunset/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      >
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-sunset/10 flex items-center justify-center group-hover:bg-sunset/20 transition-colors">
                              <Icon className="w-5 h-5 text-sunset" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <h3 className="font-display text-base font-semibold text-foreground mb-1">
                            {category.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {category.tagline}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ============ WHY IT WORKS ============ */}
              <div className="mb-16">
                <h2 className="font-display text-xl font-semibold text-foreground text-center mb-6">
                  Why It Works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PARTNERS_PAGE.concepts.map((concept) => {
                    const Icon = conceptIconMap[concept.icon] || Clock;
                    return (
                      <div
                        key={concept.title}
                        className="bg-muted/30 rounded-xl p-5 border border-border/50"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-display font-semibold text-foreground mb-2">
                          {concept.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {concept.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============ HOW PARTNERING WORKS ============ */}
              <div className="mb-16">
                <h2 className="font-display text-xl font-semibold text-foreground text-center mb-8">
                  How It Works
                </h2>
                <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-4">
                  <div className="hidden md:block absolute top-6 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-sunset/30" />
                  
                  {PARTNERS_PAGE.partnerProcess.map((step) => (
                    <div
                      key={step.step}
                      className="flex md:flex-col items-start md:items-center md:text-center flex-1 gap-4 md:gap-3"
                    >
                      <div className="relative z-10 w-12 h-12 rounded-full bg-sunset text-sunset-foreground flex items-center justify-center font-display font-bold text-lg shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1 md:flex-none">
                        <h3 className="font-display font-semibold text-foreground mb-1">
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ============ CTA BUTTON ============ */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleCTAClick}
                  className="bg-sunset text-sunset-foreground hover:bg-sunset/90 text-base px-8 gap-2"
                >
                  {PARTNERS_PAGE.ctaText}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  {PARTNERS_PAGE.note}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* ============ CATEGORY DETAIL MODAL ============ */}
      <PartnerCategoryModal
        category={selectedCategory}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onApply={handleApplyFromModal}
      />

      {/* ============ APPLICATION FORM MODAL ============ */}
      <PartnerApplicationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        preselectedCategory={preselectedCategory}
      />
    </div>
  );
}
