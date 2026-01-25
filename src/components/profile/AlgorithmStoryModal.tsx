/**
 * =============================================================================
 * AlgorithmStoryModal - Spotify Wrapped-style reveal experience
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserTraitWithLibrary } from '@/hooks/useYourAlgorithm';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/hooks/useYourAlgorithm';

interface AlgorithmStoryModalProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  traits: UserTraitWithLibrary[];
}

interface Slide {
  type: 'intro' | 'trait' | 'category' | 'outro';
  trait?: UserTraitWithLibrary;
  category?: string;
  categoryTraits?: UserTraitWithLibrary[];
}

export function AlgorithmStoryModal({
  open,
  onClose,
  displayName,
  traits,
}: AlgorithmStoryModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Build slides from traits
  const slides: Slide[] = [
    { type: 'intro' },
    // Group by category and create category slides
    ...Object.entries(
      traits.reduce((acc, trait) => {
        const cat = trait.trait_library?.category || 'uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(trait);
        return acc;
      }, {} as Record<string, UserTraitWithLibrary[]>)
    ).map(([category, categoryTraits]) => ({
      type: 'category' as const,
      category,
      categoryTraits,
    })),
    { type: 'outro' },
  ];

  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
    }
  }, [open]);

  const goNext = () => {
    if (currentSlide < slides.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setCurrentSlide(currentSlide + 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const goPrev = () => {
    if (currentSlide > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentSlide(currentSlide - 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const slide = slides[currentSlide];

  const renderSlideContent = () => {
    switch (slide.type) {
      case 'intro':
        return (
          <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold text-foreground">
                Hey {displayName}!
              </h2>
              <p className="text-xl text-muted-foreground">
                Let's explore your social personality...
              </p>
            </div>
          </div>
        );

      case 'category':
        const categoryColors = CATEGORY_COLORS[slide.category || ''] || CATEGORY_COLORS.social_energy;
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {CATEGORY_LABELS[slide.category || ''] || slide.category}
              </p>
              <h2 className="text-2xl font-display font-bold text-foreground">
                How you show up
              </h2>
            </div>
            
            <div className="space-y-4">
              {slide.categoryTraits?.map((trait, index) => (
                <div
                  key={trait.id}
                  className={cn(
                    "p-4 rounded-xl bg-gradient-to-br",
                    categoryColors.gradient,
                    "animate-in fade-in slide-in-from-bottom-2",
                    "border border-border/50"
                  )}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{trait.trait_library?.emoji || '✨'}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {trait.trait_library?.display_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {trait.trait_library?.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'outro':
        return (
          <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex items-center justify-center">
              <Heart className="w-12 h-12 text-pink-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold text-foreground">
                You're ready!
              </h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                With {traits.length} traits in your algorithm, we'll help you find people you'll click with.
              </p>
            </div>
            <Button onClick={onClose} size="lg" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Find My People
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Skip button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 z-50 text-muted-foreground"
          onClick={onClose}
        >
          Skip
        </Button>

        {/* Content */}
        <div className="min-h-[400px] flex items-center justify-center p-8">
          {renderSlideContent()}
        </div>

        {/* Navigation */}
        <div className="p-4 border-t border-border/50 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={currentSlide === 0 || isAnimating}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {slides.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentSlide
                    ? "bg-primary w-4"
                    : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goNext}
            disabled={currentSlide === slides.length - 1 || isAnimating}
            className="gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
