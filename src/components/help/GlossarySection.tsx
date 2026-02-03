/**
 * GlossarySection.tsx
 * 
 * Searchable A-Z glossary of OpenClique platform terminology.
 */

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { HELP_CENTER } from "@/constants/content";
import { Search, BookOpen } from "lucide-react";

export function GlossarySection() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and group glossary terms
  const { filteredTerms, groupedTerms } = useMemo(() => {
    const filtered = HELP_CENTER.glossary.filter((item) => {
      if (!searchQuery) return true;
      return (
        item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    // Group by first letter
    const grouped = filtered.reduce((acc, item) => {
      const letter = item.term[0].toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(item);
      return acc;
    }, {} as Record<string, typeof HELP_CENTER.glossary>);

    // Sort each group alphabetically
    Object.keys(grouped).forEach((letter) => {
      grouped[letter].sort((a, b) => a.term.localeCompare(b.term));
    });

    return { filteredTerms: filtered, groupedTerms: grouped };
  }, [searchQuery]);

  const sortedLetters = Object.keys(groupedTerms).sort();

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Glossary
            </h2>
            <p className="text-muted-foreground">
              Learn the language of OpenClique
            </p>
          </div>

          {/* Search Input */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Glossary Terms */}
          {filteredTerms.length > 0 ? (
            <div className="space-y-8">
              {sortedLetters.map((letter) => (
                <div key={letter}>
                  {/* Letter Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-display text-2xl font-bold text-primary">
                      {letter}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Terms under this letter */}
                  <div className="space-y-4">
                    {groupedTerms[letter].map((item) => (
                      <div
                        key={item.term}
                        className="bg-card rounded-lg p-4 border border-border hover:border-primary/30 transition-colors"
                      >
                        <h3 className="font-display font-semibold text-foreground mb-1">
                          {item.term}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No terms found</p>
              <p className="text-sm text-muted-foreground">
                Try a different search term
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
