import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { PARTNERS_PAGE, FORM_URLS } from "@/constants/content";
import { ArrowRight, Building2, Sparkles, Users } from "lucide-react";

const iconMap = {
  0: Building2,
  1: Sparkles,
  2: Users,
};

export default function Partners() {
  const handleCTAClick = () => {
    window.open(FORM_URLS.partners, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {PARTNERS_PAGE.title}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {PARTNERS_PAGE.subtitle}
                </p>
              </div>

              {/* Partner Types */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {PARTNERS_PAGE.partnerTypes.map((type, index) => {
                  const Icon = iconMap[index as keyof typeof iconMap] || Building2;
                  return (
                    <div
                      key={type.title}
                      className="bg-card rounded-xl p-6 border border-border text-center"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                        {type.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleCTAClick}
                  className="text-base px-8 gap-2"
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
    </div>
  );
}
