import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HERO, SOCIAL_PROOF } from "@/constants/content";
import logo from "@/assets/logo.png";
import concertCrowd from "@/assets/austin/concert-crowd.jpg";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
            <span className="block text-3xl md:text-4xl lg:text-5xl mt-3 text-primary font-semibold">
              {HERO.headlineAccent}
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in [animation-delay:200ms]">
            {HERO.subheadline}
          </p>

          {/* CTAs - Prominent Join + Get Involved Dropdown */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in [animation-delay:300ms]">
            <Button size="lg" asChild className="w-full sm:w-auto text-base px-10 py-6 text-lg font-semibold">
              <Link to="/pilot">{HERO.primaryCta}</Link>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto text-base px-6 gap-2"
                >
                  Get Involved
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 bg-background border border-border z-50">
                <DropdownMenuItem asChild>
                  <Link to="/creators" className="w-full cursor-pointer text-creator">
                    For Creators
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/partners" className="w-full cursor-pointer text-sunset">
                    Partner With Us
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/work-with-us" className="w-full cursor-pointer text-navy">
                    Work With Us
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Social proof message */}
          <div className="mt-8 animate-fade-in [animation-delay:400ms] flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {SOCIAL_PROOF.message}
            </p>
            <Link 
              to="/quests" 
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              See what adventures await →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
