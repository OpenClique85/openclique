import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS } from './types';

interface WizardProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
}

export function WizardProgress({ currentStep, completedSteps, onStepClick }: WizardProgressProps) {
  return (
    <div className="w-full">
      {/* Desktop Progress */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-creator transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100}%` }}
        />
        
        {WIZARD_STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || step.id <= currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  isCompleted && "bg-creator text-creator-foreground",
                  isCurrent && !isCompleted && "bg-creator/20 border-2 border-creator text-creator",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground",
                  isClickable && "cursor-pointer hover:scale-110",
                  !isClickable && "cursor-not-allowed opacity-60"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step.id}
              </button>
              <span className={cn(
                "mt-2 text-xs font-medium text-center max-w-[80px]",
                isCurrent ? "text-creator" : "text-muted-foreground"
              )}>
                {step.shortTitle}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Progress */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-creator">
            Step {currentStep} of {WIZARD_STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {WIZARD_STEPS[currentStep - 1].shortTitle}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-creator transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / WIZARD_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
