import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { TutorialProgress, TutorialLobbyStep, TutorialPromptStep, TutorialPhotoStep, TutorialTimelineStep, TutorialCompleteStep } from '@/components/tutorial-quest';
import { useTutorialQuest } from '@/hooks/useTutorialQuest';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const TOTAL_STEPS = 5;

export default function TutorialQuest() {
  const navigate = useNavigate();
  const { state, isCompleted, updateStep, complete } = useTutorialQuest();
  const [step, setStep] = useState(0);
  const [stepValid, setStepValid] = useState<Record<number, boolean>>({
    0: true, // Lobby is always valid (just informational)
    3: true, // Timeline is always valid
  });

  // Resume from saved step
  useEffect(() => {
    if (state.currentStep > 0 && state.currentStep < TOTAL_STEPS) {
      setStep(state.currentStep);
    }
  }, [state.currentStep]);

  // Redirect if already completed
  useEffect(() => {
    if (isCompleted) navigate('/quests', { replace: true });
  }, [isCompleted, navigate]);

  const handleNext = useCallback(async () => {
    const nextStep = step + 1;
    if (nextStep < TOTAL_STEPS) {
      setStep(nextStep);
      updateStep.mutate(nextStep);
    } else {
      // Complete the tutorial
      setStep(4); // Show complete step
      await complete.mutateAsync();
    }
  }, [step, updateStep, complete]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const setValid = useCallback((valid: boolean) => {
    setStepValid(prev => ({ ...prev, [step]: valid }));
  }, [step]);

  const canProceed = stepValid[step] ?? false;
  const isLastContentStep = step === 3; // Timeline is last before complete
  const isCompleteStep = step === 4;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        {!isCompleteStep && (
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
            <div className="max-w-lg mx-auto flex items-center justify-between">
              <TutorialProgress currentStep={step} totalSteps={TOTAL_STEPS} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Skip
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Skip Tutorial?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You can always come back later. You'll miss out on 50 XP though!
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Going</AlertDialogCancel>
                    <AlertDialogAction onClick={() => navigate('/quests')}>
                      Skip for Now
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {/* Step content */}
        <div className="flex-1 flex items-center justify-center px-4 py-6 md:py-10">
          <div className="w-full max-w-lg">
            {step === 0 && <TutorialLobbyStep />}
            {step === 1 && <TutorialPromptStep onValid={setValid} />}
            {step === 2 && <TutorialPhotoStep onValid={setValid} />}
            {step === 3 && <TutorialTimelineStep />}
            {step === 4 && <TutorialCompleteStep />}
          </div>
        </div>

        {/* Navigation */}
        {!isCompleteStep && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t px-4 py-4 pb-safe">
            <div className="max-w-lg mx-auto flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 0}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed || complete.isPending}
                className="flex-1"
              >
                {isLastContentStep ? 'Complete' : 'Next'}
                {!isLastContentStep && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
