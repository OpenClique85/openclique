/**
 * SearchableHelpSection.tsx
 * 
 * Consolidated FAQ section with search and category filtering.
 * Used on the How It Works page as the authoritative FAQ destination.
 */

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HELP_CENTER } from "@/constants/content";
import { Search, HelpCircle, Compass, Users, Shield, CreditCard } from "lucide-react";
import { GetHelpButton } from "@/components/support/GetHelpButton";

const categoryIcons: Record<string, React.ElementType> = {
  all: HelpCircle,
  general: HelpCircle,
  quests: Compass,
  matching: Users,
  safety: Shield,
  costs: CreditCard,
};

export function SearchableHelpSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredFaqs = useMemo(() => {
    return HELP_CENTER.faqs.filter((faq) => {
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about OpenClique
            </p>
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0">
              {HELP_CENTER.categories.map((category) => {
                const Icon = categoryIcons[category.id];
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-sm"
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">{category.label}</span>
                    <span className="sm:hidden">{category.label.split(' ')[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {/* FAQ Accordion */}
          {filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-display font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <HelpCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No questions found</p>
              <p className="text-sm text-muted-foreground">
                Try a different search term or category
              </p>
            </div>
          )}

          {/* Didn't find answer CTA */}
          <div className="mt-8 text-center p-6 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground mb-3">
              Didn't find what you're looking for?
            </p>
            <GetHelpButton variant="inline" />
          </div>
        </div>
      </div>
    </section>
  );
}
