import { BuggsNarration } from './BuggsNarration';
import { cn } from '@/lib/utils';
import { Users, MessageSquare, Zap, Trophy } from 'lucide-react';

const STAGES = [
  {
    icon: Users,
    label: 'Recruiting',
    description: 'Sign up and get matched into a clique of 3–6 people.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: MessageSquare,
    label: 'Warm-up',
    description: 'Answer an ice-breaker, meet your clique, and confirm readiness.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: Zap,
    label: 'Live',
    description: 'The quest is happening! Show up, complete objectives, submit proof.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Trophy,
    label: 'Completed',
    description: 'Earn XP, give feedback, and decide if you want to keep your clique.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
];

export function TutorialTimelineStep() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Quest Journey</h2>
        <p className="text-muted-foreground text-sm mt-1">Every quest follows these stages</p>
      </div>

      <BuggsNarration message="Every quest follows this journey. You'll always know where you are and what's coming next!" />

      <div className="relative space-y-0">
        {/* Vertical connector line */}
        <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-border" />

        {STAGES.map((stage, i) => (
          <div key={stage.label} className="relative flex items-start gap-4 py-3">
            <div className={cn('z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', stage.bgColor)}>
              <stage.icon className={cn('h-5 w-5', stage.color)} />
            </div>
            <div className="flex-1 pt-1">
              <p className="font-semibold text-foreground text-sm">{stage.label}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{stage.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
