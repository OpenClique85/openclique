/**
 * =============================================================================
 * FEEDBACK PULSE - Micro-feedback component for quick reactions
 * =============================================================================
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubmitFeedbackPulse } from '@/hooks/useSupportTickets';
import { cn } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, HelpCircle, Check } from 'lucide-react';

interface FeedbackPulseProps {
  contextQuestId?: string | null;
  contextSquadId?: string | null;
  prompt?: string;
  className?: string;
}

type Reaction = 'positive' | 'negative' | 'confused';

export function FeedbackPulse({
  contextQuestId,
  contextSquadId,
  prompt = 'How did this go?',
  className,
}: FeedbackPulseProps) {
  const location = useLocation();
  const submitPulse = useSubmitFeedbackPulse();
  const [submitted, setSubmitted] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<Reaction | null>(null);

  const handleReaction = async (reaction: Reaction) => {
    if (submitted) return;

    setSelectedReaction(reaction);

    try {
      await submitPulse.mutateAsync({
        pagePath: location.pathname,
        reaction,
        contextQuestId,
        contextSquadId,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback pulse:', error);
      setSelectedReaction(null);
    }
  };

  if (submitted) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Check className="h-4 w-4 text-primary" />
        <span>Thanks for the feedback!</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="text-sm text-muted-foreground">{prompt}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleReaction('positive')}
          disabled={submitPulse.isPending}
          className={cn(
            'p-2 rounded-full transition-all',
            'hover:bg-primary/10 hover:text-primary',
            selectedReaction === 'positive' && 'bg-primary/10 text-primary'
          )}
          aria-label="Good"
        >
          <ThumbsUp className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleReaction('negative')}
          disabled={submitPulse.isPending}
          className={cn(
            'p-2 rounded-full transition-all',
            'hover:bg-destructive/10 hover:text-destructive',
            selectedReaction === 'negative' && 'bg-destructive/10 text-destructive'
          )}
          aria-label="Not good"
        >
          <ThumbsDown className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleReaction('confused')}
          disabled={submitPulse.isPending}
          className={cn(
            'p-2 rounded-full transition-all',
            'hover:bg-amber-500/10 hover:text-amber-600',
            selectedReaction === 'confused' && 'bg-amber-500/10 text-amber-600'
          )}
          aria-label="Confused"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
