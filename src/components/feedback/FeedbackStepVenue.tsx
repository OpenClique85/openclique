/**
 * Feedback Step Venue
 * 
 * Venue and sponsor feedback questions.
 */

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const REVISIT_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'already_regular', label: 'Already a regular!' },
];

const SPONSOR_OPTIONS = [
  { value: 'enhanced', label: 'Yes, it enhanced it' },
  { value: 'neutral', label: 'It was fine' },
  { value: 'distracted', label: 'It felt distracting' },
  { value: 'no_opinion', label: 'No opinion' },
];

interface FeedbackStepVenueProps {
  venueName?: string;
  sponsorName?: string;
  onSubmit: (data: {
    venueInterestRating: number;
    venueRevisitIntent: string;
    sponsorEnhancement: string;
    venueImprovementNotes: string;
  }) => void;
  onSkip: () => void;
  isSubmitting: boolean;
  xpReward: number;
}

export function FeedbackStepVenue({
  venueName = 'the venue',
  sponsorName,
  onSubmit,
  onSkip,
  isSubmitting,
  xpReward,
}: FeedbackStepVenueProps) {
  const [venueInterestRating, setVenueInterestRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [venueRevisitIntent, setVenueRevisitIntent] = useState('');
  const [sponsorEnhancement, setSponsorEnhancement] = useState('');
  const [venueImprovementNotes, setVenueImprovementNotes] = useState('');

  const handleSubmit = () => {
    onSubmit({
      venueInterestRating,
      venueRevisitIntent,
      sponsorEnhancement,
      venueImprovementNotes,
    });
  };

  return (
    <div className="space-y-8">
      {/* Optional banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
        <p className="text-sm text-primary font-medium">
          Optional — helps us improve venue partnerships (+{xpReward} XP)
        </p>
      </div>

      {/* Venue Interest Rating */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          How interested are you in {venueName}?
        </label>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setVenueInterestRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  (hoverRating || venueInterestRating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
        {venueInterestRating > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {venueInterestRating === 1 && "Not interested"}
            {venueInterestRating === 2 && "Slightly interested"}
            {venueInterestRating === 3 && "Somewhat interested"}
            {venueInterestRating === 4 && "Interested!"}
            {venueInterestRating === 5 && "Very interested!"}
          </p>
        )}
      </div>

      {/* Would visit again */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Would you visit {venueName} again?
        </label>
        <div className="flex gap-3 justify-center flex-wrap">
          {REVISIT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setVenueRevisitIntent(option.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-all border",
                venueRevisitIntent === option.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sponsor question (conditional) */}
      {sponsorName && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Did {sponsorName}'s involvement enhance the experience?
          </label>
          <div className="flex gap-2 justify-center flex-wrap">
            {SPONSOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSponsorEnhancement(option.value)}
                className={cn(
                  "px-3 py-2 rounded-full text-sm transition-all border",
                  sponsorEnhancement === option.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Improvement notes */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          What would make venue/brand quests better?
        </label>
        <Textarea
          value={venueImprovementNotes}
          onChange={(e) => setVenueImprovementNotes(e.target.value)}
          placeholder="Optional: Share your ideas..."
          className="resize-none"
          rows={2}
        />
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
