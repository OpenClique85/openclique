import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface FeedbackStep4Props {
  onSubmit: (data: {
    testimonialText: string;
    recommendationText: string;
    consentType: 'anonymous' | 'first_name_city' | null;
    interviewOptIn: boolean;
  }) => void;
  onSkip: () => void;
  isSubmitting: boolean;
  xpReward: number;
}

export function FeedbackStep4({ onSubmit, onSkip, isSubmitting, xpReward }: FeedbackStep4Props) {
  const [testimonial, setTestimonial] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [consentAnonymous, setConsentAnonymous] = useState(false);
  const [consentNamed, setConsentNamed] = useState(false);
  const [interviewOptIn, setInterviewOptIn] = useState(false);

  const hasTestimonialText = testimonial.trim().length > 0 || recommendation.trim().length > 0;
  const hasConsent = consentAnonymous || consentNamed;
  const needsConsent = hasTestimonialText && !hasConsent;

  const handleSubmit = () => {
    let consentType: 'anonymous' | 'first_name_city' | null = null;
    if (consentNamed) {
      consentType = 'first_name_city';
    } else if (consentAnonymous) {
      consentType = 'anonymous';
    }

    onSubmit({
      testimonialText: testimonial.trim(),
      recommendationText: recommendation.trim(),
      consentType,
      interviewOptIn,
    });
  };

  const canSubmit = !needsConsent;

  return (
    <div className="space-y-8">
      {/* Optional banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
        <p className="text-sm text-primary font-medium">
          Optional — help others decide if OpenClique is right for them (+{xpReward} XP)
        </p>
      </div>

      {/* Testimonial prompt */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Complete this sentence:
        </label>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground italic mb-3">
            "Before OpenClique, ___. After this quest, ___."
          </p>
          <Textarea
            value={testimonial}
            onChange={(e) => setTestimonial(e.target.value)}
            placeholder="e.g., Before OpenClique, I spent weekends alone. After this quest, I have a group chat planning our next adventure."
            className="resize-none"
            rows={4}
          />
        </div>
      </div>

      {/* Recommendation */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          What would you tell a friend who's on the fence about trying a quest?
        </label>
        <Textarea
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          placeholder="Optional: Share what you'd say..."
          className="resize-none"
          rows={3}
        />
      </div>

      {/* Consent */}
      {hasTestimonialText && (
        <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
          <p className="text-sm font-medium text-foreground">
            How can we use your words? <span className="text-destructive">*</span>
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent-anon"
                checked={consentAnonymous}
                onCheckedChange={(checked) => {
                  setConsentAnonymous(checked as boolean);
                  if (checked) setConsentNamed(false);
                }}
              />
              <label htmlFor="consent-anon" className="text-sm cursor-pointer">
                You may use this <span className="font-medium">anonymously</span> on the website
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent-named"
                checked={consentNamed}
                onCheckedChange={(checked) => {
                  setConsentNamed(checked as boolean);
                  if (checked) setConsentAnonymous(false);
                }}
              />
              <label htmlFor="consent-named" className="text-sm cursor-pointer">
                You may use this with my <span className="font-medium">first name + city</span>
              </label>
            </div>
          </div>
          {needsConsent && (
            <p className="text-xs text-destructive">
              Please select how we can use your testimonial
            </p>
          )}
        </div>
      )}

      {/* Interview opt-in */}
      <div className="p-4 border border-border rounded-lg bg-muted/30">
        <div className="flex items-start gap-3">
          <Checkbox
            id="interview"
            checked={interviewOptIn}
            onCheckedChange={(checked) => setInterviewOptIn(checked as boolean)}
          />
          <div>
            <label htmlFor="interview" className="text-sm font-medium cursor-pointer">
              I'm open to a 15-minute founder chat for extra XP
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              We may reach out to learn more about your experience
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 flex flex-col gap-3">
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="flex-1 text-muted-foreground"
            size="lg"
          >
            No Thanks, I'm Done
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="flex-1"
            size="lg"
          >
            {isSubmitting ? 'Saving...' : hasTestimonialText ? `Submit (+${xpReward} XP)` : 'Skip Step'}
          </Button>
        </div>
      </div>
    </div>
  );
}
