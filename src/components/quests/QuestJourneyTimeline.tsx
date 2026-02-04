import { CheckCircle, UserPlus, Users, MessageCircle, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface QuestJourneyTimelineProps {
  signupStatus: 'pending' | 'confirmed' | 'standby' | 'dropped' | 'no_show' | 'completed';
  squadId?: string | null;
  squadStatus?: string | null;
  questCardToken?: string | null;
  questStartDate?: Date | null;
}

interface JourneyStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const JOURNEY_STEPS: JourneyStep[] = [
  { id: 0, title: 'Signed Up', description: 'You\'re in!', icon: UserPlus },
  { id: 1, title: 'Squad Formation', description: 'Finding your crew', icon: Users },
  { id: 2, title: 'Warm-Up', description: 'Get to know your squad', icon: MessageCircle },
  { id: 3, title: 'Quest Day', description: 'Show up & have fun', icon: MapPin },
];

function getCurrentStage(props: QuestJourneyTimelineProps): number {
  const { signupStatus, squadId, squadStatus } = props;
  
  // Dropped/no-show = no journey shown (handled by parent)
  if (signupStatus === 'dropped' || signupStatus === 'no_show') return -1;

  // IMPORTANT: If a user is already in a squad/clique, that state is the source of truth
  // even if the underlying signup is still marked pending (can happen in admin flows).
  if (squadId) {
    // Stage 3: Squad approved, quest unlocked
    if (['approved', 'active', 'completed'].includes(squadStatus || '')) return 3;

    // Stage 2: In squad, warming up or ready for review
    if (squadStatus === 'warming_up' || squadStatus === 'ready_for_review' || squadStatus === 'confirmed') return 2;

    // Default: if we have a squad but unknown status, assume warm-up stage
    return 2;
  }
  
  // Stage 0: Signup pending review or standby
  if (signupStatus === 'pending' || signupStatus === 'standby') return 0;
  
  // Stage 1: Confirmed but no squad yet
  if (signupStatus === 'confirmed' && !squadId) return 1;
  
  return 1;
}

function getNextAction(props: QuestJourneyTimelineProps, currentStage: number): {
  message: string;
  cta?: { label: string; href: string };
} | null {
  const { signupStatus, squadId, squadStatus, questCardToken } = props;

  // If a squad exists, don't show the generic "pending review" messaging.
  if (!squadId) {
    if (signupStatus === 'standby') {
      return { message: "You're on the waitlist. We'll notify you if a spot opens!" };
    }
    if (signupStatus === 'pending') {
      return { message: 'Your signup is being reviewed. Hang tight!' };
    }
  }
  
  switch (currentStage) {
    case 1:
      return { message: "We're forming squads now. You'll be matched soon!" };
    case 2:
      if (squadStatus === 'ready_for_review') {
        return { 
          message: "Warm-up complete! Waiting for approval.",
          cta: squadId ? { label: "View Warm-Up Room", href: `/warmup/${squadId}` } : undefined
        };
      }
      return { 
        message: "Complete warm-up to unlock quest details",
        cta: squadId ? { label: "Go to Warm-Up Room", href: `/warmup/${squadId}` } : undefined
      };
    case 3:
      return { 
        message: "Quest instructions unlocked! 🎉",
        cta: questCardToken ? { label: "View Quest Card", href: `/quest-card/${questCardToken}` } : undefined
      };
    default:
      return null;
  }
}

export function QuestJourneyTimeline(props: QuestJourneyTimelineProps) {
  const currentStage = getCurrentStage(props);
  const nextAction = getNextAction(props, currentStage);
  
  // Don't render for cancelled signups
  if (currentStage === -1) return null;
  
  return (
    <div className="space-y-4">
      {/* Timeline - Horizontal on desktop, vertical on mobile */}
      <div className="relative">
        {/* Desktop horizontal timeline */}
        <div className="hidden sm:flex items-center justify-between">
          {JOURNEY_STEPS.map((step, index) => {
            const isCompleted = index < currentStage;
            const isCurrent = index === currentStage;
            const isFuture = index > currentStage;
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center text-center flex-shrink-0">
                  {/* Step circle */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "bg-primary/10 border-primary text-primary ring-4 ring-primary/20",
                      isFuture && "bg-muted border-muted-foreground/30 text-muted-foreground/50"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  
                  {/* Step text */}
                  <div className="mt-2 max-w-[100px]">
                    <p className={cn(
                      "text-xs font-medium",
                      isCurrent && "text-primary",
                      isFuture && "text-muted-foreground/50"
                    )}>
                      {step.title}
                    </p>
                    {isCurrent && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Connector line */}
                {index < JOURNEY_STEPS.length - 1 && (
                  <div className="flex-1 mx-2 h-0.5 relative">
                    <div className="absolute inset-0 bg-muted-foreground/20" />
                    <div 
                      className={cn(
                        "absolute inset-y-0 left-0 bg-primary transition-all",
                        isCompleted && "right-0",
                        isCurrent && "right-1/2",
                        isFuture && "right-full"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Mobile vertical timeline */}
        <div className="sm:hidden space-y-3">
          {JOURNEY_STEPS.map((step, index) => {
            const isCompleted = index < currentStage;
            const isCurrent = index === currentStage;
            const isFuture = index > currentStage;
            const StepIcon = step.icon;
            
            // Only show completed, current, and next step on mobile
            if (isFuture && index > currentStage + 1) return null;
            
            return (
              <div key={step.id} className="flex items-center gap-3">
                {/* Step circle */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "bg-primary/10 border-primary text-primary",
                    isFuture && "bg-muted border-muted-foreground/30 text-muted-foreground/50"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                
                {/* Step text */}
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-medium",
                    isCurrent && "text-primary",
                    isFuture && "text-muted-foreground/50"
                  )}>
                    {step.title}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                </div>
                
                {/* Current indicator */}
                {isCurrent && (
                  <ChevronRight className="h-4 w-4 text-primary animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Next action CTA */}
      {nextAction && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            {nextAction.message}
          </p>
          {nextAction.cta && (
            <Button size="sm" variant="default" asChild className="flex-shrink-0">
              <Link to={nextAction.cta.href}>
                {nextAction.cta.label}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestJourneyTimeline;
