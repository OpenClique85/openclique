import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { PILOT_PAGE, FORM_URLS } from "@/constants/content";
import { trackFormRedirect } from "@/lib/tracking";
import { ArrowRight, Check } from "lucide-react";

export default function Pilot() {
  const handleCTAClick = () => {
    trackFormRedirect("pilot", "/pilot");
    window.open(FORM_URLS.pilot, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Now accepting applications
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {PILOT_PAGE.title}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {PILOT_PAGE.subtitle}
                </p>
              </div>

              {/* What to expect */}
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

              {/* CTA */}
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
