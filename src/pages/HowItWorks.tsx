import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CTASection } from "@/components/CTASection";
import { HOW_IT_WORKS } from "@/constants/content";
import { Check } from "lucide-react";
import HexBadge from "@/components/progression/HexBadge";
import LockedQuestCard from "@/components/progression/LockedQuestCard";
import { PROGRESSION_TREES } from "@/constants/progressionTrees";
import buggsMascot from "@/assets/buggs-mascot.png";

export default function HowItWorks() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto px-4">
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

        {/* What's a Quest */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6 text-center">
                {HOW_IT_WORKS.whatIsQuest.title}
              </h2>
              <p className="text-lg text-muted-foreground text-center leading-relaxed">
                {HOW_IT_WORKS.whatIsQuest.description}
              </p>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-foreground mb-12 text-center">
                The Journey
              </h2>
              
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
                
                <div className="space-y-8">
                  {HOW_IT_WORKS.steps.map((step, index) => (
                    <div
                      key={step.number}
                      className="relative flex gap-6 items-start"
                    >
                      {/* Step number */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground font-display font-bold text-xl flex items-center justify-center z-10">
                        {step.number}
                      </div>
                      
                      {/* Content */}
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

        {/* Meet BUGGS */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 md:p-12 border border-primary/10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* BUGGS Mascot */}
                  <div className="flex-shrink-0">
                    <img 
                      src={buggsMascot} 
                      alt="BUGGS - Behavioral Utility for Group Guidance & Structure"
                      className="w-24 h-24 md:w-32 md:h-32 object-contain"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
                      {HOW_IT_WORKS.buggs.title}
                    </h2>
                    <p className="text-sm text-primary font-medium mb-3">
                      {HOW_IT_WORKS.buggs.subtitle}
                    </p>
                    <p className="text-muted-foreground mb-6">
                      {HOW_IT_WORKS.buggs.description}
                    </p>
                    <ul className="space-y-3">
                      {HOW_IT_WORKS.buggs.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3 justify-center md:justify-start">
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

        {/* Why It Works */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl font-bold text-foreground mb-8">
                {HOW_IT_WORKS.whyItWorks.title}
              </h2>
              <ul className="space-y-4 text-left max-w-xl mx-auto">
                {HOW_IT_WORKS.whyItWorks.reasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <svg
                        className="w-3.5 h-3.5 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Your Quest Journey */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                  Your Quest Journey
                </h2>
                <p className="text-lg text-muted-foreground">
                  Complete experiences with your squad. Choices you make together shape what opens next.
                </p>
              </div>

              {/* Example progression visualization */}
              <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
                <div className="flex flex-col items-center gap-8">
                  {/* Hex Badge example */}
                  <HexBadge tree={PROGRESSION_TREES.culture} />

                  {/* Unlockable preview */}
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {PROGRESSION_TREES.culture.unlockables.map((quest, index) => (
                      quest.isTeased ? (
                        <div 
                          key={quest.id}
                          className="relative w-[100px] h-[120px] rounded-xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col items-center justify-center p-3"
                        >
                          <span className="text-2xl mb-2">{quest.icon}</span>
                          <p className="text-xs font-medium text-foreground text-center">{quest.title}</p>
                          <p className="text-[10px] text-muted-foreground text-center mt-1">{quest.teaser}</p>
                        </div>
                      ) : (
                        <LockedQuestCard key={quest.id} variant={index} />
                      )
                    ))}
                  </div>

                  {/* Caption */}
                  <div className="text-center space-y-3">
                    <p className="text-muted-foreground">
                      Come back together. See what opens.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span role="img" aria-hidden="true">🎶</span>
                      <span className="text-muted-foreground">
                        Culture affinity growing
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="mt-8 pt-8 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Each quest builds your squad's affinity in different paths. Decisions during experiences 
                    determine which exclusive quests unlock for your group.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
