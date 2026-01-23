import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const QUEST_ASPECTS = [
  { value: 'clear_objective', label: 'Clear objective' },
  { value: 'location', label: 'Location' },
  { value: 'timing', label: 'Timing / length' },
  { value: 'icebreakers', label: 'Icebreakers' },
  { value: 'group_size', label: 'Group size' },
  { value: 'reward', label: 'Reward' },
];

const LENGTH_OPTIONS = [
  { value: 'too_short', label: 'Too short' },
  { value: 'just_right', label: 'Just right' },
  { value: 'too_long', label: 'Too long' },
];

const GROUP_FIT_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'okay', label: 'Okay' },
  { value: 'not_really', label: 'Not really' },
];

const RECONNECT_OPTIONS = [
  { value: 'whole_group', label: 'Yes, the whole group' },
  { value: 'some_people', label: 'Yes, 1-2 people' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: 'Not sure' },
];

interface FeedbackStep2Props {
  onSubmit: (data: {
    workedWell: string[];
    workedPoorly: string[];
    lengthRating: string;
    confusionNotes: string;
    comfortScore: number;
    groupFit: string;
    reconnectIntent: string;
  }) => void;
  onSkip: () => void;
  isSubmitting: boolean;
  xpReward: number;
}

export function FeedbackStep2({ onSubmit, onSkip, isSubmitting, xpReward }: FeedbackStep2Props) {
  const [workedWell, setWorkedWell] = useState<string[]>([]);
  const [workedPoorly, setWorkedPoorly] = useState<string[]>([]);
  const [lengthRating, setLengthRating] = useState('');
  const [confusionNotes, setConfusionNotes] = useState('');
  const [comfortScore, setComfortScore] = useState(3);
  const [groupFit, setGroupFit] = useState('');
  const [reconnectIntent, setReconnectIntent] = useState('');

  const toggleAspect = (
    value: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else if (current.length < 2) {
      setter([...current, value]);
    } else {
      setter([current[1], value]);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      workedWell,
      workedPoorly,
      lengthRating,
      confusionNotes,
      comfortScore,
      groupFit,
      reconnectIntent,
    });
  };

  return (
    <div className="space-y-8">
      {/* Optional banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
        <p className="text-sm text-primary font-medium">
          Optional — helps us improve future quests (+{xpReward} XP)
        </p>
      </div>

      {/* What worked best */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          What worked best? <span className="text-muted-foreground">(pick up to 2)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {QUEST_ASPECTS.map((aspect) => (
            <button
              key={aspect.value}
              type="button"
              onClick={() => toggleAspect(aspect.value, workedWell, setWorkedWell)}
              className={cn(
                "px-3 py-2 rounded-full text-sm transition-all border",
                workedWell.includes(aspect.value)
                  ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
                  : "bg-background text-muted-foreground border-border hover:border-green-300"
              )}
            >
              {aspect.label}
            </button>
          ))}
        </div>
      </div>

      {/* What felt weakest */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          What felt weakest? <span className="text-muted-foreground">(pick up to 2)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {QUEST_ASPECTS.map((aspect) => (
            <button
              key={aspect.value}
              type="button"
              onClick={() => toggleAspect(aspect.value, workedPoorly, setWorkedPoorly)}
              className={cn(
                "px-3 py-2 rounded-full text-sm transition-all border",
                workedPoorly.includes(aspect.value)
                  ? "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700"
                  : "bg-background text-muted-foreground border-border hover:border-orange-300"
              )}
            >
              {aspect.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quest length */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Quest length felt:</label>
        <div className="flex gap-3 justify-center">
          {LENGTH_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLengthRating(option.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-all border",
                lengthRating === option.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Confusion notes */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Anything confusing or unclear?
        </label>
        <Textarea
          value={confusionNotes}
          onChange={(e) => setConfusionNotes(e.target.value)}
          placeholder="Optional: Let us know..."
          className="resize-none"
          rows={2}
        />
      </div>

      {/* Comfort score */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-foreground">
          How comfortable did you feel with your group?
        </label>
        <div className="px-4">
          <Slider
            value={[comfortScore]}
            onValueChange={(v) => setComfortScore(v[0])}
            min={1}
            max={5}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Not comfortable</span>
            <span>Very comfortable</span>
          </div>
        </div>
      </div>

      {/* Group fit */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Did the group feel well matched?
        </label>
        <div className="flex gap-3 justify-center flex-wrap">
          {GROUP_FIT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setGroupFit(option.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-all border",
                groupFit === option.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reconnect intent */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Would you want to see anyone from this group again?
        </label>
        <div className="flex gap-2 justify-center flex-wrap">
          {RECONNECT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setReconnectIntent(option.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-all border",
                reconnectIntent === option.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 flex gap-3">
        <Button
          variant="outline"
          onClick={onSkip}
          className="flex-1"
          size="lg"
        >
          Skip
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1"
          size="lg"
        >
          {isSubmitting ? 'Saving...' : `Continue (+${xpReward} XP)`}
        </Button>
      </div>
    </div>
  );
}
