/**
 * =============================================================================
 * TutorialPrompt - Floating prompt to start tutorial for new users
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useTutorial } from './TutorialProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Sparkles } from 'lucide-react';
import buggsIcon from '@/assets/buggs-icon.png';

export function TutorialPrompt() {
  const { shouldShowTutorial, isActive, startTutorial, skipTutorial } = useTutorial();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if tutorial is active or was dismissed
  if (!shouldShowTutorial || isActive || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleStart = () => {
    startTutorial();
  };

  const handleSkip = () => {
    skipTutorial();
    setIsDismissed(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <Card className="max-w-sm shadow-xl border-primary/20">
        <CardContent className="p-0">
          <div className="flex items-start gap-3 p-4">
            <img src={buggsIcon} alt="Buggs" className="h-12 w-12 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold">Hey there! 👋</p>
              <p className="text-sm text-muted-foreground mt-1">
                First time here? Let me show you around and help you find your people!
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" onClick={handleStart} className="gap-1">
                  <Sparkles className="h-4 w-4" />
                  Take the Tour
                </Button>
                <Button size="sm" variant="ghost" onClick={handleSkip}>
                  No thanks
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
