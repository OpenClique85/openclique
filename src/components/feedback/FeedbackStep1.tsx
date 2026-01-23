import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FEELINGS = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'fun', label: 'Fun' },
  { value: 'energizing', label: 'Energizing' },
  { value: 'awkward', label: 'Awkward' },
  { value: 'confusing', label: 'Confusing' },
  { value: 'meaningful', label: 'Meaningful' },
];

const REPEAT_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no', label: 'No' },
];

interface FeedbackStep1Props {
  onSubmit: (data: {
    rating: number;
    repeatIntent: string;
    feelings: string[];
  }) => void;
  isSubmitting: boolean;
  xpReward: number;
}

export function FeedbackStep1({ onSubmit, isSubmitting, xpReward }: FeedbackStep1Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [repeatIntent, setRepeatIntent] = useState('');
  const [feelings, setFeelings] = useState<string[]>([]);

  const toggleFeeling = (value: string) => {
    if (feelings.includes(value)) {
      setFeelings(feelings.filter(f => f !== value));
    } else if (feelings.length < 2) {
      setFeelings([...feelings, value]);
    } else {
      // Replace first selection
      setFeelings([feelings[1], value]);
    }
  };

  const canSubmit = rating > 0 && repeatIntent !== '';

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ rating, repeatIntent, feelings });
  };

  return (
    <div className="space-y-8">
      {/* Rating */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          How would you rate this quest overall? <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
            >
              <Star
                className={cn(
                  "h-10 w-10 transition-colors",
                  (hoverRating || rating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {rating === 1 && "Not great"}
            {rating === 2 && "Could be better"}
            {rating === 3 && "It was okay"}
            {rating === 4 && "Pretty good!"}
            {rating === 5 && "Loved it!"}
          </p>
        )}
      </div>

      {/* Repeat intent */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Would you do another quest like this? <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-3 justify-center flex-wrap">
          {REPEAT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRepeatIntent(option.value)}
              className={cn(
                "px-6 py-3 rounded-full text-sm font-medium transition-all",
                "border-2",
                repeatIntent === option.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feelings */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          How did this quest feel? <span className="text-muted-foreground">(pick up to 2)</span>
        </label>
        <div className="flex gap-2 justify-center flex-wrap">
          {FEELINGS.map((feeling) => (
            <button
              key={feeling.value}
              type="button"
              onClick={() => toggleFeeling(feeling.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-all",
                "border",
                feelings.includes(feeling.value)
                  ? "bg-primary/10 text-primary border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {feeling.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Saving...' : `Continue (+${xpReward} XP)`}
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Required fields marked with *
        </p>
      </div>
    </div>
  );
}
