/**
 * =============================================================================
 * AlgorithmHeroCard - Spotify Wrapped-style hero summary card
 * =============================================================================
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Play, Dna } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserTraitWithLibrary } from '@/hooks/useYourAlgorithm';

interface AlgorithmHeroCardProps {
  displayName: string;
  topTraits: UserTraitWithLibrary[];
  totalAccepted: number;
  totalPending: number;
  onSeeStory: () => void;
  isEmpty: boolean;
  onStartDiscovering?: () => void;
}

export function AlgorithmHeroCard({
  displayName,
  topTraits,
  totalAccepted,
  totalPending,
  onSeeStory,
  isEmpty,
  onStartDiscovering,
}: AlgorithmHeroCardProps) {
  if (isEmpty) {
    return (
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <CardContent className="relative py-12 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Dna className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold text-foreground">
              Discover Your Social DNA
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Answer a few questions about how you connect, and we'll build your algorithm to find people you'll click with.
            </p>
          </div>
          <Button onClick={onStartDiscovering} size="lg" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Start Discovering
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-0">
      {/* Animated gradient background */}
      <div 
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/15",
          "animate-gradient-shift"
        )}
        style={{
          backgroundSize: '200% 200%',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
      
      <CardContent className="relative py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Dna className="w-4 h-4" />
            Your Social DNA
          </p>
          <h2 className="text-3xl font-display font-bold text-foreground">
            {displayName}'s Algorithm
          </h2>
        </div>

        {/* Top traits display */}
        {topTraits.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {topTraits.map((trait, index) => (
              <div
                key={trait.id}
                className={cn(
                  "px-4 py-2 rounded-full",
                  "bg-background/60 backdrop-blur-sm border border-border/50",
                  "flex items-center gap-2",
                  "transform transition-all duration-300",
                  index === 0 && "scale-110 shadow-lg shadow-primary/20"
                )}
              >
                <span className="text-xl">{trait.trait_library?.emoji || '✨'}</span>
                <span className="font-medium text-foreground">
                  {trait.trait_library?.display_name || trait.trait_slug}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{totalAccepted}</span>
            <span className="text-muted-foreground">
              {totalAccepted === 1 ? 'trait' : 'traits'} discovered
            </span>
          </div>
          {totalPending > 0 && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-muted-foreground">
                {totalPending} {totalPending === 1 ? 'suggestion' : 'suggestions'} waiting
              </span>
            </div>
          )}
        </div>

        {/* See My Story button */}
        {totalAccepted > 0 && (
          <Button 
            variant="outline" 
            onClick={onSeeStory}
            className="gap-2 bg-background/50 hover:bg-background/80"
          >
            <Play className="w-4 h-4" />
            See My Story
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
