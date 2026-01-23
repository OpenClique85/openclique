import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Building2 } from 'lucide-react';
import { createNotification } from '@/lib/notifications';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  sponsor_type: string;
  user_id: string;
}

interface OrgSponsorRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  orgName: string;
  sponsor?: Sponsor | null;
  questId?: string;
  questTitle?: string;
}

const EVENT_TYPES = [
  { id: 'social', label: 'Social Event' },
  { id: 'competition', label: 'Competition' },
  { id: 'networking', label: 'Networking' },
  { id: 'philanthropy', label: 'Philanthropy' },
  { id: 'educational', label: 'Educational' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'cultural', label: 'Cultural' },
  { id: 'other', label: 'Other' },
];

const OFFERING_OPTIONS = [
  { id: 'funding', label: 'Funding/Budget' },
  { id: 'rewards', label: 'Rewards/Prizes' },
  { id: 'venue', label: 'Venue Access' },
  { id: 'branding', label: 'Branded Materials' },
  { id: 'products', label: 'Product Samples' },
  { id: 'services', label: 'Services' },
];

export function OrgSponsorRequestModal({
  isOpen,
  onClose,
  orgId,
  orgName,
  sponsor,
  questId,
  questTitle,
}: OrgSponsorRequestModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSponsorId, setSelectedSponsorId] = useState(sponsor?.id || '');
  
  // Form state
  const [title, setTitle] = useState(questTitle ? `Sponsor: ${questTitle}` : '');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('');
  const [expectedAttendance, setExpectedAttendance] = useState('');
  const [budgetAsk, setBudgetAsk] = useState('');
  const [preferredDates, setPreferredDates] = useState('');
  const [offeringRequest, setOfferingRequest] = useState<string[]>([]);

  // Fetch sponsors if not provided
  const { data: sponsors } = useQuery({
    queryKey: ['approved-sponsors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('id, name, logo_url, description, sponsor_type, user_id')
        .eq('status', 'approved')
        .order('name');
      if (error) throw error;
      return data as Sponsor[];
    },
    enabled: isOpen && !sponsor,
  });

  const selectedSponsor = sponsor || sponsors?.find(s => s.id === selectedSponsorId);

  const toggleOffering = (id: string) => {
    setOfferingRequest(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSponsor) return;

    if (!title.trim()) {
      toast({ title: 'Please enter a title', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('org_sponsor_requests')
      .insert({
        org_id: orgId,
        sponsor_id: selectedSponsor.id,
        requester_id: user.id,
        quest_id: questId || null,
        title: title.trim(),
        description: description.trim() || null,
        event_type: eventType || null,
        expected_attendance: expectedAttendance ? parseInt(expectedAttendance) : null,
        budget_ask: budgetAsk.trim() || null,
        preferred_dates: preferredDates.trim() || null,
        offering_request: { items: offeringRequest },
        status: 'pending',
      });

    if (error) {
      toast({ title: 'Failed to send request', description: error.message, variant: 'destructive' });
    } else {
      // Notify the sponsor
      await createNotification({
        userId: selectedSponsor.user_id,
        type: 'org_sponsor_request',
        title: `Sponsorship request from ${orgName}`,
        body: `${orgName} is requesting your sponsorship for "${title}"`,
      });

      toast({ title: 'Request sent!', description: 'The sponsor will be notified.' });
      onClose();
      resetForm();
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setTitle(questTitle ? `Sponsor: ${questTitle}` : '');
    setDescription('');
    setEventType('');
    setExpectedAttendance('');
    setBudgetAsk('');
    setPreferredDates('');
    setOfferingRequest([]);
    setSelectedSponsorId('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Sponsorship</DialogTitle>
          <DialogDescription>
            Send a sponsorship request on behalf of {orgName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sponsor Selection */}
          {!sponsor && (
            <div className="space-y-2">
              <Label>Select Sponsor *</Label>
              <Select value={selectedSponsorId} onValueChange={setSelectedSponsorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sponsor..." />
                </SelectTrigger>
                <SelectContent>
                  {sponsors?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={s.logo_url || undefined} />
                          <AvatarFallback><Building2 className="h-3 w-3" /></AvatarFallback>
                        </Avatar>
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Sponsor Preview */}
          {selectedSponsor && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedSponsor.logo_url || undefined} />
                <AvatarFallback><Building2 className="h-5 w-5" /></AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedSponsor.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {selectedSponsor.sponsor_type}
                </Badge>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sponsor our Spring Formal"
            />
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type..." />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your event and what you're looking for..."
              rows={3}
            />
          </div>

          {/* Expected Attendance */}
          <div className="space-y-2">
            <Label htmlFor="attendance">Expected Attendance</Label>
            <Input
              id="attendance"
              type="number"
              value={expectedAttendance}
              onChange={(e) => setExpectedAttendance(e.target.value)}
              placeholder="e.g., 100"
            />
          </div>

          {/* What You're Asking For */}
          <div className="space-y-2">
            <Label>What are you looking for?</Label>
            <div className="grid grid-cols-2 gap-2">
              {OFFERING_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted"
                >
                  <Checkbox
                    checked={offeringRequest.includes(option.id)}
                    onCheckedChange={() => toggleOffering(option.id)}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Budget Ask */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget Request (optional)</Label>
            <Input
              id="budget"
              value={budgetAsk}
              onChange={(e) => setBudgetAsk(e.target.value)}
              placeholder="e.g., $500-1000"
            />
          </div>

          {/* Preferred Dates */}
          <div className="space-y-2">
            <Label htmlFor="dates">Preferred Dates</Label>
            <Input
              id="dates"
              value={preferredDates}
              onChange={(e) => setPreferredDates(e.target.value)}
              placeholder="e.g., March 15-20, 2026"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedSponsor}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
