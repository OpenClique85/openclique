/**
 * SponsorListingFormModal - Template-based form for creating/editing listings
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { ListingTemplateManager, ListingTemplate } from './ListingTemplateManager';

const QUEST_TYPES = [
  { value: 'culture', label: 'Culture & Arts' },
  { value: 'wellness', label: 'Wellness & Fitness' },
  { value: 'connector', label: 'Social & Connector' },
  { value: 'adventure', label: 'Adventure & Outdoors' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'civic', label: 'Civic & Volunteer' },
];

const BUDGET_RANGES = [
  { value: 'under_500', label: 'Under $500' },
  { value: '500_1000', label: '$500 - $1,000' },
  { value: '1000_2500', label: '$1,000 - $2,500' },
  { value: '2500_5000', label: '$2,500 - $5,000' },
  { value: 'over_5000', label: '$5,000+' },
  { value: 'negotiable', label: 'Negotiable' },
];

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'];
const INTERESTS = ['Fitness', 'Food', 'Music', 'Art', 'Tech', 'Outdoors', 'Social', 'Learning'];

interface SponsorListingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sponsorId: string;
  editingListing?: any;
}

export function SponsorListingFormModal({
  isOpen,
  onClose,
  sponsorId,
  editingListing,
}: SponsorListingFormModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quest_type: '',
    budget_range: '',
    rewards_offered: [] as string[],
    venue_offered: '',
    includes_branding: false,
    target_audience: { age_ranges: [] as string[], interests: [] as string[] },
    preferred_dates: '',
    expected_attendance: '',
    creator_requirements: '',
    status: 'draft',
  });

  // Fetch rewards
  const { data: rewards = [] } = useQuery({
    queryKey: ['sponsor-rewards', sponsorId],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards')
        .select('id, name')
        .eq('sponsor_id', sponsorId)
        .eq('status', 'active');
      return data || [];
    },
    enabled: isOpen,
  });

  // Fetch venues
  const { data: venues = [] } = useQuery({
    queryKey: ['sponsor-venues', sponsorId],
    queryFn: async () => {
      const { data } = await supabase
        .from('venue_offerings')
        .select('id, venue_name')
        .eq('sponsor_id', sponsorId)
        .eq('status', 'available');
      return data || [];
    },
    enabled: isOpen,
  });

  // Fetch sponsor profile for defaults
  const { data: sponsorProfile } = useQuery({
    queryKey: ['sponsor-profile-defaults', sponsorId],
    queryFn: async () => {
      const { data } = await supabase
        .from('sponsor_profiles')
        .select('budget_range, target_audience, preferred_quest_types')
        .eq('id', sponsorId)
        .single();
      return data;
    },
    enabled: isOpen && !editingListing,
  });

  // Initialize form with editing data or defaults
  useEffect(() => {
    if (editingListing) {
      setFormData({
        title: editingListing.title || '',
        description: editingListing.description || '',
        quest_type: editingListing.quest_type || '',
        budget_range: editingListing.budget_range || '',
        rewards_offered: editingListing.rewards_offered || [],
        venue_offered: editingListing.venue_offered || '',
        includes_branding: editingListing.includes_branding || false,
        target_audience: editingListing.target_audience || { age_ranges: [], interests: [] },
        preferred_dates: editingListing.preferred_dates || '',
        expected_attendance: editingListing.expected_attendance || '',
        creator_requirements: editingListing.creator_requirements || '',
        status: editingListing.status || 'draft',
      });
    } else if (sponsorProfile) {
      setFormData((prev) => ({
        ...prev,
        budget_range: sponsorProfile.budget_range || '',
        target_audience: (sponsorProfile.target_audience as any) || { age_ranges: [], interests: [] },
        quest_type: sponsorProfile.preferred_quest_types?.[0] || '',
      }));
    }
  }, [editingListing, sponsorProfile]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormData({
        title: '',
        description: '',
        quest_type: '',
        budget_range: '',
        rewards_offered: [],
        venue_offered: '',
        includes_branding: false,
        target_audience: { age_ranges: [], interests: [] },
        preferred_dates: '',
        expected_attendance: '',
        creator_requirements: '',
        status: 'draft',
      });
    }
  }, [isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { publish?: boolean }) => {
      const payload = {
        sponsor_id: sponsorId,
        title: data.title,
        description: data.description || null,
        quest_type: data.quest_type || null,
        budget_range: data.budget_range || null,
        rewards_offered: data.rewards_offered,
        venue_offered: data.venue_offered || null,
        includes_branding: data.includes_branding,
        target_audience: data.target_audience,
        preferred_dates: data.preferred_dates || null,
        expected_attendance: data.expected_attendance || null,
        creator_requirements: data.creator_requirements || null,
        status: data.publish ? 'open' : 'draft',
        updated_at: new Date().toISOString(),
      };

      if (editingListing) {
        const { error } = await supabase
          .from('sponsor_listings')
          .update(payload)
          .eq('id', editingListing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sponsor_listings')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-listings'] });
      toast.success(variables.publish ? 'Listing published!' : 'Listing saved as draft');
      onClose();
    },
    onError: () => {
      toast.error('Failed to save listing');
    },
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAgeRange = (age: string) => {
    setFormData((prev) => ({
      ...prev,
      target_audience: {
        ...prev.target_audience,
        age_ranges: prev.target_audience.age_ranges.includes(age)
          ? prev.target_audience.age_ranges.filter((a) => a !== age)
          : [...prev.target_audience.age_ranges, age],
      },
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      target_audience: {
        ...prev.target_audience,
        interests: prev.target_audience.interests.includes(interest)
          ? prev.target_audience.interests.filter((i) => i !== interest)
          : [...prev.target_audience.interests, interest],
      },
    }));
  };

  const toggleReward = (rewardId: string) => {
    setFormData((prev) => ({
      ...prev,
      rewards_offered: prev.rewards_offered.includes(rewardId)
        ? prev.rewards_offered.filter((r) => r !== rewardId)
        : [...prev.rewards_offered, rewardId],
    }));
  };

  const handleLoadTemplate = (template: ListingTemplate) => {
    setFormData((prev) => ({
      ...prev,
      quest_type: template.quest_type || prev.quest_type,
      budget_range: template.budget_range || prev.budget_range,
      description: template.description || prev.description,
      target_audience: template.target_audience || prev.target_audience,
      creator_requirements: template.creator_requirements || prev.creator_requirements,
      includes_branding: template.includes_branding ?? prev.includes_branding,
    }));
  };

  const canProceed = () => {
    if (step === 1) return formData.title.trim().length > 0;
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingListing ? 'Edit Listing' : 'Create Listing'} - Step {step} of 4
          </DialogTitle>
        </DialogHeader>

        {/* Template Manager */}
        {!editingListing && (
          <div className="mb-4">
            <ListingTemplateManager
              sponsorId={sponsorId}
              currentData={{
                quest_type: formData.quest_type,
                budget_range: formData.budget_range,
                description: formData.description,
                target_audience: formData.target_audience,
                creator_requirements: formData.creator_requirements,
                includes_branding: formData.includes_branding,
              }}
              onLoadTemplate={handleLoadTemplate}
            />
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded ${s <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium">Basics</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Seeking Creator for Monthly Fitness Quest"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="e.g., We're looking for an energetic creator to host monthly fitness challenges at our downtown gym..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Quest Type</Label>
              <Select
                value={formData.quest_type}
                onValueChange={(v) => handleChange('quest_type', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {QUEST_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium">What You're Offering</h3>

            <div className="space-y-2">
              <Label>Budget Range</Label>
              <Select
                value={formData.budget_range}
                onValueChange={(v) => handleChange('budget_range', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {rewards.length > 0 && (
              <div className="space-y-2">
                <Label>Attach Rewards</Label>
                <div className="flex flex-wrap gap-2">
                  {rewards.map((reward: any) => (
                    <Badge
                      key={reward.id}
                      variant={formData.rewards_offered.includes(reward.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleReward(reward.id)}
                    >
                      {reward.name}
                      {formData.rewards_offered.includes(reward.id) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {venues.length > 0 && (
              <div className="space-y-2">
                <Label>Offer Venue</Label>
                <Select
                  value={formData.venue_offered}
                  onValueChange={(v) => handleChange('venue_offered', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {venues.map((venue: any) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.venue_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="branding"
                checked={formData.includes_branding}
                onCheckedChange={(c) => handleChange('includes_branding', c)}
              />
              <Label htmlFor="branding" className="cursor-pointer">
                Include branding materials
              </Label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium">Requirements</h3>

            <div className="space-y-2">
              <Label>Target Age Groups</Label>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGES.map((age) => (
                  <Badge
                    key={age}
                    variant={formData.target_audience.age_ranges.includes(age) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleAgeRange(age)}
                  >
                    {age}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Interests</Label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <Badge
                    key={interest}
                    variant={formData.target_audience.interests.includes(interest) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dates">Preferred Dates</Label>
              <Input
                id="dates"
                value={formData.preferred_dates}
                onChange={(e) => handleChange('preferred_dates', e.target.value)}
                placeholder="e.g., Weekends in March, Flexible"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendance">Expected Attendance</Label>
              <Input
                id="attendance"
                value={formData.expected_attendance}
                onChange={(e) => handleChange('expected_attendance', e.target.value)}
                placeholder="e.g., 20-30 participants"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Creator Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.creator_requirements}
                onChange={(e) => handleChange('creator_requirements', e.target.value)}
                placeholder="e.g., Experience hosting group fitness, 100+ quest participants..."
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-medium">Review</h3>

            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{formData.title}</p>
              </div>
              
              {formData.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{formData.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {formData.quest_type && (
                  <Badge variant="outline">{formData.quest_type}</Badge>
                )}
                {formData.budget_range && (
                  <Badge variant="secondary">
                    {BUDGET_RANGES.find(b => b.value === formData.budget_range)?.label}
                  </Badge>
                )}
                {formData.includes_branding && (
                  <Badge>Branding included</Badge>
                )}
              </div>

              {formData.rewards_offered.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Rewards: {formData.rewards_offered.length}</p>
                </div>
              )}

              {(formData.target_audience.age_ranges.length > 0 || formData.target_audience.interests.length > 0) && (
                <div>
                  <p className="text-sm text-muted-foreground">Target Audience</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.target_audience.age_ranges.map(a => (
                      <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                    ))}
                    {formData.target_audience.interests.map(i => (
                      <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => step === 1 ? onClose() : setStep(step - 1)}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex gap-2">
            {step === 4 && (
              <Button
                variant="outline"
                onClick={() => saveMutation.mutate({ ...formData, publish: false })}
                disabled={saveMutation.isPending}
              >
                Save Draft
              </Button>
            )}
            <Button
              onClick={() => {
                if (step < 4) {
                  setStep(step + 1);
                } else {
                  saveMutation.mutate({ ...formData, publish: true });
                }
              }}
              disabled={!canProceed() || saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {step === 4 ? 'Publish' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
