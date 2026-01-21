import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { CREATORS_PAGE, FORM_URLS } from "@/constants/content";

export function CreatorCTA() {
  const handleCTAClick = () => {
    window.open(FORM_URLS.creators, "_blank");
  };

  return (
    <section className="py-16 bg-creator/5">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to Bring Your Community IRL?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join creators and local planners who are turning online connections into real-world friendships.
          </p>
          
          <Button
            size="lg"
            onClick={handleCTAClick}
            className="bg-creator text-creator-foreground hover:bg-creator/90 text-base px-10 gap-2"
          >
            {CREATORS_PAGE.ctaText}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            {CREATORS_PAGE.note}
          </p>
        </div>
      </div>
    </section>
  );
}
