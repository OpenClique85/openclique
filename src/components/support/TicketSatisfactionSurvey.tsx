import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TicketSatisfactionSurveyProps {
  ticketId: string;
  isResolved: boolean;
}

export function TicketSatisfactionSurvey({ ticketId, isResolved }: TicketSatisfactionSurveyProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');

  // Check if user already submitted a rating
  const { data: existingRating, isLoading } = useQuery({
    queryKey: ['ticket-satisfaction', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_satisfaction')
        .select('*')
        .eq('ticket_id', ticketId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!ticketId && isResolved,
  });

  const submitRating = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');
      if (rating === 0) throw new Error('Please select a rating');

      const { data, error } = await supabase
        .from('ticket_satisfaction')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          rating,
          feedback: feedback.trim() || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      queryClient.invalidateQueries({ queryKey: ['ticket-satisfaction', ticketId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!isResolved || !user) return null;
  if (isLoading) return null;

  // Already submitted
  if (existingRating) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-success">
            <CheckCircle className="h-4 w-4" />
            Feedback Submitted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'h-5 w-5',
                  star <= existingRating.rating
                    ? 'fill-warning text-warning'
                    : 'text-muted-foreground'
                )}
              />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {existingRating.rating}/5
            </span>
          </div>
          {existingRating.feedback && (
            <p className="mt-2 text-sm text-muted-foreground">
              "{existingRating.feedback}"
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const ratingLabels = ['', 'Very Unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'];

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">How was your support experience?</CardTitle>
        <CardDescription>Your feedback helps us improve</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={cn(
                    'h-8 w-8 transition-colors',
                    star <= (hoveredRating || rating)
                      ? 'fill-warning text-warning'
                      : 'text-muted-foreground hover:text-warning/50'
                  )}
                />
              </button>
            ))}
          </div>
          {(hoveredRating || rating) > 0 && (
            <p className="text-sm text-muted-foreground">
              {ratingLabels[hoveredRating || rating]}
            </p>
          )}
        </div>

        <Textarea
          placeholder="Any additional feedback? (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={2}
          className="resize-none"
        />

        <Button
          onClick={() => submitRating.mutate()}
          disabled={rating === 0 || submitRating.isPending}
          className="w-full"
        >
          {submitRating.isPending ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </CardContent>
    </Card>
  );
}
