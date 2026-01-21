import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { CREATORS_PAGE, FORM_URLS } from "@/constants/content";
import rooftopGathering from "@/assets/austin/rooftop-gathering.jpg";
import buggsFace from "@/assets/buggs-face.png";

export function CreatorHero() {
  const handleCTAClick = () => {
    window.open(FORM_URLS.creators, "_blank");
  };

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `url(${rooftopGathering})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-creator/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-creator" />
            <span className="text-sm font-medium text-creator">For Creators & Local Planners</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Turn Your Audience Into Real-World Community
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you're an influencer activating followers or a local planner crafting unique experiences, we help you bring people IRL.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handleCTAClick}
              className="bg-creator text-creator-foreground hover:bg-creator/90 text-base px-8 gap-2"
            >
              {CREATORS_PAGE.ctaText}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <img 
              src={buggsFace} 
              alt="BUGGS" 
              className="w-10 h-10 object-contain opacity-80"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
