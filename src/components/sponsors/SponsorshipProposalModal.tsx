import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Tables } from '@/integrations/supabase/types';
import { ProposalTemplateManager, type ProposalTemplate } from './ProposalTemplateManager';
import { notifyCreatorOfProposal } from '@/lib/notifications';

type Reward = Tables<'rewards'>;
type VenueOffering = Tables<'venue_offerings'>;

interface SponsorshipProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sponsorId: string;
  quest?: any;
  creator?: any;
}

export function SponsorshipProposalModal({
  isOpen,
  onClose,
  sponsorId,
  quest,
  creator,
}: SponsorshipProposalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    budget_or_reward: '',
    venue_offering_id: '',
    reward_ids: [] as string[],
  });

  // Fetch sponsor profile for name and templates
  const { data: sponsorProfile } = useQuery({
    queryKey: ['sponsor-profile-for-proposal', sponsorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('id, name, user_id')
        .eq('id', sponsorId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!sponsorId,
  });

  // Fetch sponsor's rewards
  const { data: rewards } = useQuery({
    queryKey: ['sponsor-rewards-for-proposal', sponsorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('sponsor_id', sponsorId)
        .eq('status', 'active');
      
      if (error) throw error;
      return data as Reward[];
    },
    enabled: isOpen && !!sponsorId,
  });

  // Fetch sponsor's venues
  const { data: venues } = useQuery({
    queryKey: ['sponsor-venues-for-proposal', sponsorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_offerings')
        .select('*')
        .eq('sponsor_id', sponsorId)
        .eq('status', 'available');
      
      if (error) throw error;
      return data as VenueOffering[];
    },
    enabled: isOpen && !!sponsorId,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        message: '',
        budget_or_reward: '',
        venue_offering_id: '',
        reward_ids: [],
      });
    }
  }, [isOpen]);

  const handleLoadTemplate = (template: ProposalTemplate) => {
    setFormData(prev => ({
      ...prev,
      message: template.message,
      budget_or_reward: template.budget_or_reward,
    }));
  };

  const toggleReward = (rewardId: string) => {
    setFormData(prev => ({
      ...prev,
      reward_ids: prev.reward_ids.includes(rewardId)
        ? prev.reward_ids.filter(id => id !== rewardId)
        : [...prev.reward_ids, rewardId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      toast.error('Please include a message');
      return;
    }

    setIsSubmitting(true);
    try {
      const proposalType = quest ? 'sponsor_quest' : 'request_quest';
      const proposalData: any = {
        sponsor_id: sponsorId,
        proposal_type: proposalType,
        message: formData.message.trim(),
        budget_or_reward: formData.budget_or_reward.trim() || null,
        venue_offering_id: formData.venue_offering_id || null,
        reward_ids: formData.reward_ids.length > 0 ? formData.reward_ids : null,
        status: 'sent',
      };

      // Determine creator to notify
      let creatorUserId: string | null = null;

      if (quest) {
        proposalData.quest_id = quest.id;
        if (quest.creator_id) {
          proposalData.creator_id = quest.creator_id;
          creatorUserId = quest.creator_id;
        }
      } else if (creator) {
        proposalData.creator_id = creator.user_id;
        creatorUserId = creator.user_id;
      }

      const { error } = await supabase
        .from('sponsorship_proposals')
        .insert(proposalData);

      if (error) throw error;

      // Send in-app notification to creator
      if (creatorUserId && sponsorProfile?.name) {
        await notifyCreatorOfProposal({
          creatorUserId,
          sponsorName: sponsorProfile.name,
          questTitle: quest?.title,
          proposalType,
        });
      }

      toast.success('Proposal sent successfully!');
      onClose();
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast.error('Failed to send proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = quest 
    ? `Sponsor "${quest.title}"`
    : creator 
      ? `Request Quest from ${creator.display_name}`
      : 'Send Proposal';

  const description = quest
    ? 'Send a sponsorship proposal for this quest'
    : 'Request a custom quest from this creator';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Manager */}
          <div className="border-b pb-3">
            <ProposalTemplateManager
              sponsorId={sponsorId}
              currentMessage={formData.message}
              currentBudget={formData.budget_or_reward}
              onLoadTemplate={handleLoadTemplate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Your Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder={quest 
                ? "Tell them why you'd like to sponsor this quest..."
                : "Describe the type of quest you're looking for..."
              }
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget / Offering</Label>
            <Input
              id="budget"
              value={formData.budget_or_reward}
              onChange={(e) => setFormData(prev => ({ ...prev, budget_or_reward: e.target.value }))}
              placeholder="e.g., $500 sponsorship, free venue, product samples"
            />
          </div>

          {/* Venue Selection */}
          {venues && venues.length > 0 && (
            <div className="space-y-2">
              <Label>Offer a Venue</Label>
              <Select
                value={formData.venue_offering_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, venue_offering_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a venue to offer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No venue</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.venue_name}
                      {venue.capacity && ` (${venue.capacity} capacity)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Rewards Selection */}
          {rewards && rewards.length > 0 && (
            <div className="space-y-2">
              <Label>Attach Rewards</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {rewards.map((reward) => (
                  <div key={reward.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`reward-${reward.id}`}
                      checked={formData.reward_ids.includes(reward.id)}
                      onCheckedChange={() => toggleReward(reward.id)}
                    />
                    <label 
                      htmlFor={`reward-${reward.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {reward.name}
                      {reward.description && (
                        <span className="text-muted-foreground ml-1">
                          – {reward.description.slice(0, 50)}
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Send Proposal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
