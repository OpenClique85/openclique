import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { WORK_WITH_US_PAGE, FORM_URLS } from "@/constants/content";
import { trackFormRedirect } from "@/lib/tracking";
import { ArrowRight, Palette, Mic, Code } from "lucide-react";

const iconMap = {
  0: Palette,
  1: Mic,
  2: Code,
};

export default function WorkWithUs() {
  const handleCTAClick = () => {
    trackFormRedirect("work_with_us", "/work-with-us");
    window.open(FORM_URLS.workWithUs, "_blank");
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
                  {WORK_WITH_US_PAGE.title}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {WORK_WITH_US_PAGE.subtitle}
                </p>
              </div>

              {/* Roles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {WORK_WITH_US_PAGE.roles.map((role, index) => {
                  const Icon = iconMap[index as keyof typeof iconMap] || Code;
                  return (
                    <div
                      key={role.title}
                      className="bg-card rounded-xl p-6 border border-border text-center"
                    >
                      <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-accent" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                        {role.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {role.description}
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
    </div>
  );
}
