import { cn } from '@/lib/utils';

interface TutorialProgressProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ['Lobby', 'Prompt', 'Photo', 'Timeline', 'Done'];

export function TutorialProgress({ currentStep, totalSteps }: TutorialProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <button
          key={i}
          className={cn(
            'w-3 h-3 rounded-full transition-all duration-300',
            i < currentStep && 'bg-primary',
            i === currentStep && 'bg-primary w-8',
            i > currentStep && 'bg-muted-foreground/30'
          )}
          aria-label={STEP_LABELS[i]}
          disabled
        />
      ))}
    </div>
  );
}
