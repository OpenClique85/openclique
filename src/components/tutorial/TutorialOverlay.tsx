/**
 * =============================================================================
 * TutorialOverlay - Spotlight and tooltip overlay for tutorial steps
 * =============================================================================
 * 
 * Enhanced to show action requirements and completion status for interactive steps.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTutorial, TutorialAction } from './TutorialProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X, Sparkles, Check, Lock } from 'lucide-react';
import buggsIcon from '@/assets/buggs-icon.png';

const ACTION_LABELS: Record<TutorialAction, string> = {
  navigate: 'Navigate',
  click: 'Click',
  observe: 'Look',
  profile_update: 'Update your profile',
  quest_signup: 'Sign up for a quest',
  squad_chat: 'Send a message in squad chat',
};

export function TutorialOverlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isActive,
    currentStep,
    steps,
    completedActions,
    nextStep,
    prevStep,
    skipTutorial,
    canProceed,
  } = useTutorial();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  const isActionComplete = step?.action ? completedActions.has(step.action) : true;

  // Navigate to step route if needed
  useEffect(() => {
    if (isActive && step?.route && !location.pathname.includes(step.route.split('?')[0])) {
      navigate(step.route);
    }
  }, [isActive, step, location.pathname, navigate]);

  // Find and highlight target element
  useEffect(() => {
    if (!isActive || !step?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const target = document.querySelector(step.targetSelector!);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    // Initial find
    findTarget();

    // Re-find on scroll/resize
    window.addEventListener('scroll', findTarget);
    window.addEventListener('resize', findTarget);

    // Retry a few times in case element loads after navigation
    const retries = [100, 300, 500, 1000];
    retries.forEach(delay => {
      setTimeout(findTarget, delay);
    });

    return () => {
      window.removeEventListener('scroll', findTarget);
      window.removeEventListener('resize', findTarget);
    };
  }, [isActive, step, currentStep]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Backdrop with spotlight cutout */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto">
        {targetRect && (
          <div
            className="absolute border-2 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        )}
      </div>

      {/* Tutorial Card */}
      <Card
        className="absolute pointer-events-auto max-w-sm shadow-2xl"
        style={{
          top: targetRect
            ? targetRect.bottom + 20 > window.innerHeight - 200
              ? Math.max(20, targetRect.top - 200)
              : targetRect.bottom + 20
            : '50%',
          left: targetRect
            ? Math.min(Math.max(20, targetRect.left), window.innerWidth - 340)
            : '50%',
          transform: targetRect ? 'none' : 'translate(-50%, -50%)',
        }}
      >
        <CardContent className="p-0">
          {/* Header with Buggs */}
          <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary/10 to-transparent">
            <img src={buggsIcon} alt="Buggs" className="h-10 w-10" />
            <div className="flex-1">
              <p className="font-display font-semibold text-lg">{step.title}</p>
              <p className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={skipTutorial}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              {step.description}
            </p>
            
            {/* Action requirement badge */}
            {step.requiresCompletion && step.action && (
              <div className="mb-4">
                <Badge 
                  variant={isActionComplete ? 'default' : 'secondary'}
                  className={`gap-1 ${isActionComplete ? 'bg-green-600' : ''}`}
                >
                  {isActionComplete ? (
                    <>
                      <Check className="h-3 w-3" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      {ACTION_LABELS[step.action]}
                    </>
                  )}
                </Badge>
                {step.xpReward && !isActionComplete && (
                  <span className="ml-2 text-xs text-sunset font-medium">
                    +{step.xpReward} XP
                  </span>
                )}
              </div>
            )}

            {/* Progress */}
            <Progress value={progress} className="h-1 mb-4" />

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={skipTutorial}
                className="text-muted-foreground"
              >
                Skip Tour
              </Button>

              <Button 
                size="sm" 
                onClick={nextStep}
                disabled={!canProceed}
                className={!canProceed ? 'opacity-50' : ''}
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Let's Go!
                  </>
                ) : !canProceed ? (
                  <>
                    Complete Action
                    <Lock className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
