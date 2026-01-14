import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HERO, SOCIAL_PROOF, BRAND } from "@/constants/content";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 -z-10" />
      
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Launch badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {SOCIAL_PROOF.badge}
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in [animation-delay:100ms]">
            {HERO.headline}
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in [animation-delay:200ms]">
            {HERO.subheadline}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in [animation-delay:300ms]">
            <Button size="lg" asChild className="w-full sm:w-auto text-base px-8">
              <Link to="/pilot">{HERO.primaryCta}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base px-8">
              <Link to="/partners">{HERO.secondaryCta}</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild className="w-full sm:w-auto text-base">
              <Link to="/work-with-us">{HERO.tertiaryCta}</Link>
            </Button>
          </div>

          {/* Social proof message */}
          <p className="text-sm text-muted-foreground mt-8 animate-fade-in [animation-delay:400ms]">
            {SOCIAL_PROOF.message}
          </p>
        </div>
      </div>
    </section>
  );
}
