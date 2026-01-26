/**
 * PricingHero - Hero section for the pricing page
 */

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export function PricingHero() {
  return (
    <section className="relative py-16 md:py-24">
      <div className="container px-4 mx-auto text-center">
        {/* Pilot Badge */}
        <Badge 
          variant="outline" 
          className="mb-6 px-4 py-2 text-sm bg-primary/10 border-primary/30 text-primary"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Pilot Phase: All features currently free
        </Badge>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
          Pricing that scales from
          <br />
          <span className="text-primary">one person to an entire city</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          OpenClique is free to join. You only pay when you need structure, insight, or scale.
        </p>
        
        <div className="bg-muted/50 border border-border rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">🚀 Pilot Phase:</strong>{" "}
            All features are currently free. Paid plans will activate after pilot with advance notice.
          </p>
        </div>
      </div>
    </section>
  );
}
