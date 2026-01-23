import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackProgressProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
}

const STEP_LABELS = ['Quick Pulse', 'Quest Insights', 'Pricing', 'Testimonial'];

export function FeedbackProgress({ currentStep, totalSteps, completedSteps }: FeedbackProgressProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = completedSteps.includes(stepNum);
          const isCurrent = currentStep === stepNum;
          
          return (
            <div key={i} className="flex items-center flex-1">
              {/* Step circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  stepNum
                )}
              </div>
              
              {/* Connector line */}
              {i < totalSteps - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 rounded-full transition-colors",
                    completedSteps.includes(stepNum) ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Step labels (mobile: only current, desktop: all) */}
      <div className="flex justify-between">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = completedSteps.includes(stepNum);
          const isCurrent = currentStep === stepNum;
          
          return (
            <div
              key={i}
              className={cn(
                "text-xs text-center flex-1 transition-colors",
                isCurrent
                  ? "text-primary font-medium"
                  : isCompleted
                  ? "text-foreground"
                  : "text-muted-foreground hidden sm:block"
              )}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
