import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Star, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';

interface OnboardingFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  redemptionId?: string;
}

export function OnboardingFeedbackModal({ open, onClose, redemptionId }: OnboardingFeedbackModalProps) {
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState({
    signup_experience_rating: 0,
    clarity_rating: 0,
    excitement_rating: 0,
    what_excited_you: '',
    what_confused_you: '',
    suggestions: '',
    would_recommend: null as boolean | null,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('onboarding_feedback').insert({
        user_id: user.id,
        redemption_id: redemptionId || null,
        signup_experience_rating: feedback.signup_experience_rating || null,
        clarity_rating: feedback.clarity_rating || null,
        excitement_rating: feedback.excitement_rating || null,
        what_excited_you: feedback.what_excited_you || null,
        what_confused_you: feedback.what_confused_you || null,
        suggestions: feedback.suggestions || null,
        would_recommend: feedback.would_recommend,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Thanks for your feedback! 🎉');
      onClose();
    },
    onError: (error: Error) => {
      // If duplicate, just close silently
      if (error.message.includes('duplicate')) {
        onClose();
        return;
      }
      toast.error('Failed to submit feedback');
    },
  });

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                i <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Welcome to OpenClique!</DialogTitle>
          </div>
          <DialogDescription>
            {step === 1
              ? "Quick question — how was your signup experience? (Takes 30 seconds)"
              : "Almost done! Any thoughts to share?"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4">
            <StarRating
              label="How was the signup experience?"
              value={feedback.signup_experience_rating}
              onChange={(v) => setFeedback({ ...feedback, signup_experience_rating: v })}
            />
            <StarRating
              label="Was everything clear and easy to understand?"
              value={feedback.clarity_rating}
              onChange={(v) => setFeedback({ ...feedback, clarity_rating: v })}
            />
            <StarRating
              label="How excited are you to try OpenClique?"
              value={feedback.excitement_rating}
              onChange={(v) => setFeedback({ ...feedback, excitement_rating: v })}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Would you recommend OpenClique to a friend?</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={feedback.would_recommend === true ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFeedback({ ...feedback, would_recommend: true })}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Yes!
                </Button>
                <Button
                  type="button"
                  variant={feedback.would_recommend === false ? 'destructive' : 'outline'}
                  className="flex-1"
                  onClick={() => setFeedback({ ...feedback, would_recommend: false })}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Not yet
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>What excited you most? (optional)</Label>
              <Textarea
                placeholder="The squad matching, the quest ideas..."
                value={feedback.what_excited_you}
                onChange={(e) => setFeedback({ ...feedback, what_excited_you: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Anything confusing? (optional)</Label>
              <Textarea
                placeholder="Help us improve..."
                value={feedback.what_confused_you}
                onChange={(e) => setFeedback({ ...feedback, what_confused_you: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Any suggestions? (optional)</Label>
              <Textarea
                placeholder="Features you'd love, ideas..."
                value={feedback.suggestions}
                onChange={(e) => setFeedback({ ...feedback, suggestions: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={onClose}>
                Skip for now
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!feedback.signup_experience_rating}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}