import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HERO, SOCIAL_PROOF } from "@/constants/content";
import logo from "@/assets/logo.png";
import concertCrowd from "@/assets/austin/concert-crowd.jpg";
import { WaitlistModal } from "@/components/WaitlistModal";

export function Hero() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <>
      <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
      <section className="relative overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 opacity-20 -z-10"
          style={{
            backgroundImage: `url(${concertCrowd})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/95 to-accent/10 -z-10" />
        
        <div className="container mx-auto px-4 py-20 md:py-28 lg:py-36">
          <div className="max-w-3xl mx-auto text-center">
            
            {/* Tagline Badge */}
            <div className="flex justify-center mb-6 animate-fade-in">
              <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium tracking-wide border-primary/30 bg-primary/5 text-primary">
                {HERO.tagline}
              </Badge>
            </div>

            {/* Logo */}
            <div className="flex justify-center mb-8 animate-fade-in [animation-delay:50ms]">
              <img src={logo} alt="OpenClique" className="h-16 md:h-20 hover:scale-105 transition-transform duration-300" />
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in [animation-delay:150ms]">
              {HERO.headline}
              <span className="block text-3xl md:text-4xl lg:text-5xl mt-3 text-primary font-semibold">
                {HERO.headlineAccent}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in [animation-delay:250ms]">
              {HERO.subheadline}
            </p>

            {/* 2 CTAs only */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in [animation-delay:350ms]">
              <Button 
                size="lg" 
                onClick={() => setWaitlistOpen(true)}
                className="w-full sm:w-auto text-base px-10 py-6 text-lg font-semibold hover:scale-[1.02] transition-transform duration-200 shadow-lg shadow-primary/20"
              >
                Join the Waitlist
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                asChild 
                className="w-full sm:w-auto text-base px-8 py-6 hover:scale-[1.02] transition-transform duration-200"
              >
                <Link to="/quests">
                  Explore Quests
                </Link>
              </Button>
            </div>
            
            {/* Sign in link */}
            <p className="mt-5 text-sm text-muted-foreground animate-fade-in [animation-delay:400ms]">
              Already have an account?{" "}
              <Link to="/auth" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
              {" · "}
              <Link to="/auth?signup=true" className="text-primary hover:underline font-medium">
                Beta Access
              </Link>
            </p>

            {/* Social proof */}
            <div className="mt-8 animate-fade-in [animation-delay:500ms]">
              <p className="text-sm text-muted-foreground">
                {SOCIAL_PROOF.message}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
