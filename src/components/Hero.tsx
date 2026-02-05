/**
 * =============================================================================
 * HERO.TSX - HOMEPAGE HERO SECTION
 * =============================================================================
 * 
 * This is the main banner at the top of the homepage. It displays:
 * - The OpenClique logo
 * - Main headline and tagline
 * - Primary call-to-action buttons
 * - Social proof message
 * 
 * TO EDIT CONTENT:
 * All text content is pulled from src/constants/content.ts (HERO object).
 * Edit that file to change headlines, button text, etc.
 * 
 * VISUAL STRUCTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  [Background: Concert image with gradient overlay]          │
 * │                                                              │
 * │              ┌─────────────────────┐                        │
 * │              │  Match. Meet. Return. │  ← Tagline badge     │
 * │              └─────────────────────┘                        │
 * │                                                              │
 * │                    [OpenClique Logo]                         │
 * │                                                              │
 * │             You've got a squad waiting.                      │
 * │           You just haven't met them yet.                     │
 * │                                                              │
 * │   We plan the adventure. You bring yourself—plus whoever    │
 * │                       you want.                              │
 * │                                                              │
 * │         [Find Your Quest]    [Get Involved ▼]               │
 * │                                                              │
 * │              Now launching in Austin                         │
 * │              See what adventures await →                     │
 * └─────────────────────────────────────────────────────────────┘
 *
 * 
 * =============================================================================
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HERO, SOCIAL_PROOF } from "@/constants/content";
import logo from "@/assets/logo.png";
import wordmark from "@/assets/logo-wordmark.png";
import concertCrowd from "@/assets/austin/concert-crowd.jpg";
import { ChevronDown, Smartphone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Hero() {
  return (
    <section className="relative overflow-hidden texture-overlay">
      {/* ------------------------------------------------------------------ */}
      {/* BACKGROUND: Concert image with low opacity */}
      {/* ------------------------------------------------------------------ */}
      <div 
        className="absolute inset-0 opacity-15 -z-10"
        style={{
          backgroundImage: `url(${concertCrowd})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      />
      {/* Gradient overlay: dynamic coral-to-magenta diagonal */}
      <div className="absolute inset-0 gradient-hero -z-10" />
      
      {/* ------------------------------------------------------------------ */}
      {/* MAIN CONTENT CONTAINER */}
      {/* ------------------------------------------------------------------ */}
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          
          {/* -------------------------------------------------------------- */}
          {/* TAGLINE BADGE - Now solid coral */}
          {/* -------------------------------------------------------------- */}
          <div className="flex justify-center mb-6 animate-fade-in">
            <Badge className="badge-solid px-4 py-1.5 text-sm font-medium shadow-lg">
              {HERO.tagline}
            </Badge>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* WORDMARK LOGO */}
          {/* -------------------------------------------------------------- */}
          <div className="flex justify-center mb-8 animate-fade-in [animation-delay:50ms]">
            <img src={wordmark} alt="OpenClique" className="h-14 md:h-18 lg:h-20 hover:scale-105 transition-transform duration-300 drop-shadow-lg" />
          </div>

          {/* -------------------------------------------------------------- */}
          {/* HEADLINE: Two-line structure for visual impact */}
          {/* Line 1: "You've got a squad waiting." (main text) */}
          {/* Line 2: "You just haven't met them yet." (accent color, slightly smaller) */}
          {/* -------------------------------------------------------------- */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in [animation-delay:150ms]">
            {HERO.headline}
            <span className="block text-3xl md:text-4xl lg:text-5xl mt-3 text-primary font-semibold">
              {HERO.headlineAccent}
            </span>
          </h1>

          {/* -------------------------------------------------------------- */}
          {/* SUBHEADLINE: Flexibility message - solo, friends, or crew */}
          {/* -------------------------------------------------------------- */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in [animation-delay:250ms]">
            {HERO.subheadline}
          </p>

          {/* -------------------------------------------------------------- */}
          {/* CTA BUTTONS */}
          {/* Primary: "Find Your Quest" (solid button, links to /quests) */}
          {/* Secondary: "Get Involved" dropdown with creator/partner links */}
          {/* -------------------------------------------------------------- */}
          {/* PRIMARY CTAs: Join Now + Download App side by side */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in [animation-delay:350ms]">
            {/* Primary CTA - Main conversion goal with neon glow */}
            <Button size="lg" asChild className="btn-glow w-full sm:w-auto text-base px-10 py-6 text-lg font-semibold hover:scale-[1.02] transition-all duration-200">
              <Link to="/auth?signup=true">{HERO.primaryCta}</Link>
            </Button>
            
            {/* Download App - Now next to Join Now */}
            <Button 
              variant="outline" 
              size="lg" 
              asChild 
              className="w-full sm:w-auto text-base px-6 gap-2 hover:scale-[1.02] transition-all duration-200 hover:border-primary/50"
            >
              <Link to="/install">
                <Smartphone className="h-4 w-4" />
                Download App
              </Link>
            </Button>
          </div>

          {/* SECONDARY CTA: Get Involved - Smaller, below primary buttons */}
          <div className="mt-6 animate-fade-in [animation-delay:450ms]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-sm text-muted-foreground hover:text-foreground gap-1"
                >
                  Get Involved
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 bg-background border border-border z-50">
                {/* Creator link - purple accent color */}
                <DropdownMenuItem asChild>
                  <Link to="/creators" className="w-full cursor-pointer text-creator">
                    For Creators
                  </Link>
                </DropdownMenuItem>
                {/* Partner link - sunset/orange accent color */}
                <DropdownMenuItem asChild>
                  <Link to="/partners" className="w-full cursor-pointer text-sunset">
                    Partner With Us
                  </Link>
                </DropdownMenuItem>
                {/* Work With Us link - navy accent color */}
                <DropdownMenuItem asChild>
                  <Link to="/work-with-us" className="w-full cursor-pointer text-navy">
                    Work With Us
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* SOCIAL PROOF: Builds trust and encourages exploration */}
          {/* -------------------------------------------------------------- */}
          <div className="mt-4 animate-fade-in [animation-delay:550ms] flex flex-col items-center gap-2">
            {/* Status message (e.g., "Now accepting Austin pilot members") */}
            <p className="text-sm text-muted-foreground">
              {SOCIAL_PROOF.message}
            </p>
            {/* Link to quests page */}
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
