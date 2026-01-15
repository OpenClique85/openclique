import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PARTNERS_PAGE, FORM_URLS } from "@/constants/content";
import { ArrowRight, Building2, Sparkles, Users, Check } from "lucide-react";

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
                      <div className="w-12 h-12 rounded-lg bg-sunset/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-sunset" />
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

              {/* Explainer */}
              <div className="text-center mb-12">
                <p className="text-lg text-muted-foreground italic">
                  "{PARTNERS_PAGE.explainer}"
                </p>
              </div>

              {/* How Partnering Works */}
              <div className="mb-16">
                <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">
                  How Partnering Works
                </h2>
                <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-4">
                  {/* Connecting line for desktop */}
                  <div className="hidden md:block absolute top-6 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-border" />
                  
                  {PARTNERS_PAGE.partnerProcess.map((step, index) => (
                    <div
                      key={step.step}
                      className="flex md:flex-col items-start md:items-center md:text-center flex-1 gap-4 md:gap-3"
                    >
                      {/* Step number */}
                      <div className="relative z-10 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-lg shrink-0">
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

              {/* Value Props with Tabs */}
              <div className="mb-12">
                <Tabs defaultValue="venues" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="venues">{PARTNERS_PAGE.venueValue.title}</TabsTrigger>
                    <TabsTrigger value="brands">{PARTNERS_PAGE.brandValue.title}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="venues" className="space-y-6">
                    <ul className="space-y-3">
                      {PARTNERS_PAGE.venueValue.points.map((point, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                    <Accordion type="single" collapsible className="w-full">
                      {PARTNERS_PAGE.venueFAQ.map((faq, index) => (
                        <AccordionItem key={index} value={`venue-faq-${index}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabsContent>
                  
                  <TabsContent value="brands" className="space-y-6">
                    <ul className="space-y-3">
                      {PARTNERS_PAGE.brandValue.points.map((point, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                    <Accordion type="single" collapsible className="w-full">
                      {PARTNERS_PAGE.brandFAQ.map((faq, index) => (
                        <AccordionItem key={index} value={`brand-faq-${index}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabsContent>
                </Tabs>
              </div>

              {/* CTA */}
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
    </div>
  );
}
