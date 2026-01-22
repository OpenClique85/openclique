import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CTASection } from "@/components/CTASection";
import { HOW_IT_WORKS } from "@/constants/content";
import { Check } from "lucide-react";
import PathCarousel from "@/components/progression/PathCarousel";
import { UserJourneySection } from "@/components/UserJourneySection";
import buggsFace from "@/assets/buggs-face.png";
import runningGroup from "@/assets/austin/running-group.jpg";

export default function HowItWorks() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero with running background */}
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

        {/* Steps - The Journey */}
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
                  {HOW_IT_WORKS.steps.map((step) => (
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

        {/* Your Quest Journey - RPG Branching Trees */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                  Your Quest Journey
                </h2>
                <p className="text-lg text-muted-foreground">
                  Complete experiences with your squad. Choices you make together shape what opens next.
                </p>
              </div>

              {/* Interactive Path Carousel with Branching Trees */}
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

        {/* Your Progression - User Journey */}
        <UserJourneySection />

        {/* Meet BUGGS - Centered layout */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 md:p-12 border border-primary/10">
                {/* Centered BUGGS illustration */}
                <div className="flex flex-col items-center text-center">
                  {/* BUGGS Mascot - centered in rounded white container */}
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

        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
