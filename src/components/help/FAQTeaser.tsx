/**
 * FAQTeaser.tsx
 * 
 * Condensed FAQ preview for the homepage showing top 3 questions
 * with a link to the full Help Center on /how-it-works.
 */

import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HELP_CENTER } from "@/constants/content";
import { ArrowRight } from "lucide-react";

export function FAQTeaser() {
  // Get the teaser questions from HELP_CENTER
  const teaserFaqs = HELP_CENTER.faqs.filter((faq) =>
    HELP_CENTER.teaserQuestions.includes(faq.question)
  );

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Quick Questions
            </h2>
            <p className="text-muted-foreground">
              Get answers to the most common questions
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="w-full mb-8">
            {teaserFaqs.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-display font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Link to full FAQ */}
          <div className="text-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/how-it-works#faq" className="gap-2">
                See All FAQs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
