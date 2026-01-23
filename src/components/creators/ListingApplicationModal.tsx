/**
 * ListingApplicationModal - Apply to a sponsor listing
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, DollarSign, Sparkles, Calendar } from 'lucide-react';
import { createNotification } from '@/lib/notifications';

const BUDGET_LABELS: Record<string, string> = {
  under_500: 'Under $500',
  '500_1000': '$500 - $1,000',
  '1000_2500': '$1,000 - $2,500',
  '2500_5000': '$2,500 - $5,000',
  over_5000: '$5,000+',
  negotiable: 'Negotiable',
};

interface ListingApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: string;
    sponsor_id: string;
    title: string;
    description: string | null;
    quest_type: string | null;
    budget_range: string | null;
    preferred_dates: string | null;
    creator_requirements: string | null;
  };
  sponsorName: string;
}

export function ListingApplicationModal({
  isOpen,
  onClose,
  listing,
  sponsorName,
}: ListingApplicationModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [pitchMessage, setPitchMessage] = useState('');
  const [proposedConcept, setProposedConcept] = useState('');
  const [availability, setAvailability] = useState('');

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!pitchMessage.trim()) throw new Error('Pitch message is required');

      // Insert application
      const { error } = await supabase
        .from('listing_applications')
        .insert({
          listing_id: listing.id,
          creator_id: user.id,
          pitch_message: pitchMessage.trim(),
          proposed_concept: proposedConcept.trim() || null,
          availability: availability.trim() || null,
        });

      if (error) throw error;

      // Get sponsor user_id to notify
      const { data: sponsorProfile } = await supabase
        .from('sponsor_profiles')
        .select('user_id')
        .eq('id', listing.sponsor_id)
        .single();

      if (sponsorProfile) {
        await createNotification({
          userId: sponsorProfile.user_id,
          type: 'general',
          title: 'New Application!',
          body: `A creator has applied to your listing: ${listing.title}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listing-applications'] });
      queryClient.invalidateQueries({ queryKey: ['open-listings'] });
      queryClient.invalidateQueries({ queryKey: ['creator-applications-count'] });
      toast.success('Application submitted!');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit application');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply to Listing</DialogTitle>
          <DialogDescription>
            Send your pitch to {sponsorName}
          </DialogDescription>
        </DialogHeader>

        {/* Listing summary */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-medium">{listing.title}</h4>
          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {listing.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {listing.quest_type && (
              <Badge variant="outline">
                <Sparkles className="h-3 w-3 mr-1" />
                {listing.quest_type}
              </Badge>
            )}
            {listing.budget_range && (
              <Badge variant="secondary">
                <DollarSign className="h-3 w-3 mr-1" />
                {BUDGET_LABELS[listing.budget_range] || listing.budget_range}
              </Badge>
            )}
            {listing.preferred_dates && (
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                {listing.preferred_dates}
              </Badge>
            )}
          </div>
        </div>

        {listing.creator_requirements && (
          <div className="text-sm">
            <p className="font-medium mb-1">Requirements</p>
            <p className="text-muted-foreground">{listing.creator_requirements}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pitch">
              Your Pitch <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="pitch"
              value={pitchMessage}
              onChange={(e) => setPitchMessage(e.target.value)}
              placeholder="Introduce yourself and explain why you'd be a great fit for this opportunity..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="concept">Proposed Concept (optional)</Label>
            <Textarea
              id="concept"
              value={proposedConcept}
              onChange={(e) => setProposedConcept(e.target.value)}
              placeholder="Share a brief quest idea that could work for this sponsor..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Your Availability (optional)</Label>
            <Input
              id="availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="e.g., Weekends, March-April, Flexible"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!pitchMessage.trim() || submitMutation.isPending}
            >
              {submitMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Submit Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
