import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { WORK_WITH_US_PAGE, FORM_URLS } from "@/constants/content";
import { ArrowRight, Compass, Users, Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const iconMap = {
  0: Compass,
  1: Users,
  2: Sparkles,
};

export default function WorkWithUs() {
  const handleCTAClick = () => {
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
                  const Icon = iconMap[index as keyof typeof iconMap] || Sparkles;
                  return (
                    <div
                      key={role.title}
                      className="bg-card rounded-xl p-6 border border-border text-center"
                    >
                      <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-navy" />
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

              {/* Who We Look For */}
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

              {/* FAQ */}
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

              {/* CTA */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleCTAClick}
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
    </div>
  );
}
