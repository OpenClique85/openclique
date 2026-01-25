/**
 * =============================================================================
 * AlgorithmStoryModal - Spotify Wrapped-style reveal experience
 * Enhanced with keyboard navigation, touch gestures, and better animations
 * =============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Sparkles, Heart, Users, Zap } from 'lucide-react';
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
  type: 'intro' | 'stats' | 'category' | 'outro';
  trait?: UserTraitWithLibrary;
  category?: string;
  categoryTraits?: UserTraitWithLibrary[];
}

// Category icons for visual variety
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  social_energy: <Zap className="w-12 h-12" />,
  group_role: <Users className="w-12 h-12" />,
};

export function AlgorithmStoryModal({
  open,
  onClose,
  displayName,
  traits,
}: AlgorithmStoryModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build slides from traits
  const slides: Slide[] = [
    { type: 'intro' },
    { type: 'stats' },
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

  const totalSlides = slides.length;

  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
      setDirection('right');
    }
  }, [open]);

  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setDirection('right');
      setCurrentSlide(prev => prev + 1);
      setTimeout(() => setIsAnimating(false), 400);
    }
  }, [currentSlide, slides.length, isAnimating]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0 && !isAnimating) {
      setIsAnimating(true);
      setDirection('left');
      setCurrentSlide(prev => prev - 1);
      setTimeout(() => setIsAnimating(false), 400);
    }
  }, [currentSlide, isAnimating]);

  const goToSlide = useCallback((index: number) => {
    if (index !== currentSlide && !isAnimating) {
      setIsAnimating(true);
      setDirection(index > currentSlide ? 'right' : 'left');
      setCurrentSlide(index);
      setTimeout(() => setIsAnimating(false), 400);
    }
  }, [currentSlide, isAnimating]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goNext, goPrev, onClose]);

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    // Minimum swipe distance of 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    
    touchStartX.current = null;
  };

  const slide = slides[currentSlide];

  // Animation class based on direction
  const getAnimationClass = () => {
    return direction === 'right' 
      ? 'animate-in fade-in slide-in-from-right-8 duration-400'
      : 'animate-in fade-in slide-in-from-left-8 duration-400';
  };

  const renderSlideContent = () => {
    switch (slide.type) {
      case 'intro':
        return (
          <div className={cn("text-center space-y-6", getAnimationClass())}>
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center animate-pulse">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-display font-bold text-foreground">
                Hey {displayName}!
              </h2>
              <p className="text-xl text-muted-foreground">
                Let's explore your social personality...
              </p>
            </div>
            <p className="text-sm text-muted-foreground/70">
              Swipe or use arrow keys to navigate
            </p>
          </div>
        );

      case 'stats':
        return (
          <div className={cn("text-center space-y-8", getAnimationClass())}>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Your Social DNA
              </p>
              <h2 className="text-2xl font-display font-bold text-foreground">
                By the numbers
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1 animate-in fade-in zoom-in-90 duration-500" style={{ animationDelay: '100ms' }}>
                <div className="text-5xl font-bold text-primary">{traits.length}</div>
                <p className="text-sm text-muted-foreground">traits discovered</p>
              </div>
              <div className="space-y-1 animate-in fade-in zoom-in-90 duration-500" style={{ animationDelay: '200ms' }}>
                <div className="text-5xl font-bold text-purple-500">
                  {Object.keys(traits.reduce((acc, t) => {
                    acc[t.trait_library?.category || 'other'] = true;
                    return acc;
                  }, {} as Record<string, boolean>)).length}
                </div>
                <p className="text-sm text-muted-foreground">categories</p>
              </div>
            </div>
          </div>
        );

      case 'category':
        const categoryColors = CATEGORY_COLORS[slide.category || ''] || CATEGORY_COLORS.social_energy;
        const categoryIcon = CATEGORY_ICONS[slide.category || ''];
        return (
          <div className={cn("space-y-6", getAnimationClass())}>
            <div className="text-center space-y-3">
              {categoryIcon && (
                <div className={cn("w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br", categoryColors.gradient)}>
                  <span className={categoryColors.accent}>{categoryIcon}</span>
                </div>
              )}
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {CATEGORY_LABELS[slide.category || ''] || slide.category}
              </p>
              <h2 className="text-2xl font-display font-bold text-foreground">
                How you show up
              </h2>
            </div>
            
            <div className="space-y-3 max-h-[240px] overflow-y-auto scrollbar-hide">
              {slide.categoryTraits?.map((trait, index) => (
                <div
                  key={trait.id}
                  className={cn(
                    "p-4 rounded-xl bg-gradient-to-br",
                    categoryColors.gradient,
                    "border border-border/50",
                    "animate-in fade-in slide-in-from-bottom-4"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{trait.trait_library?.emoji || '✨'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">
                        {trait.trait_library?.display_name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
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
          <div className={cn("text-center space-y-6", getAnimationClass())}>
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex items-center justify-center">
              <Heart className="w-12 h-12 text-pink-500 animate-pulse" />
            </div>
            <div className="space-y-3">
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
      <DialogContent 
        className="max-w-lg p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
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

        {/* Content with touch gestures */}
        <div 
          ref={containerRef}
          className="min-h-[420px] flex items-center justify-center p-8 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
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

          {/* Progress dots - clickable */}
          <div className="flex gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isAnimating}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 cursor-pointer",
                  "hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                  index === currentSlide
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50"
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

        {/* Slide counter */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
          {currentSlide + 1} / {totalSlides}
        </div>
      </DialogContent>
    </Dialog>
  );
}
