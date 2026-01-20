import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HERO, SOCIAL_PROOF } from "@/constants/content";
import logo from "@/assets/logo.png";
import buggsIcon from "@/assets/buggs-icon.png";
import concertCrowd from "@/assets/austin/concert-crowd.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background image with gradient overlay */}
      <div 
        className="absolute inset-0 opacity-20 -z-10"
        style={{
          backgroundImage: `url(${concertCrowd})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/95 to-accent/10 -z-10" />
      
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Logo badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <img src={logo} alt="OpenClique" className="h-16 md:h-20" />
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
            <Button size="lg" asChild className="w-full sm:w-auto text-base px-8 bg-sunset text-sunset-foreground hover:bg-sunset/90">
              <Link to="/partners">{HERO.secondaryCta}</Link>
            </Button>
            <Button size="lg" asChild className="w-full sm:w-auto text-base px-8 bg-navy text-navy-foreground hover:bg-navy/90">
              <Link to="/work-with-us">{HERO.tertiaryCta}</Link>
            </Button>
          </div>

          {/* Social proof message with BUGGS */}
          <div className="flex items-center justify-center gap-2 mt-8 animate-fade-in [animation-delay:400ms]">
            <img src={buggsIcon} alt="" className="w-5 h-5 object-contain" />
            <p className="text-sm text-muted-foreground">
              {SOCIAL_PROOF.message}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
