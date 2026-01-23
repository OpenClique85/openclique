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
import { Loader2, Users } from 'lucide-react';
import { createNotification } from '@/lib/notifications';

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  type: string;
  school_affiliation: string | null;
}

interface SponsorOrgProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sponsorId: string;
  sponsorName: string;
  org?: Organization | null;
}

const OFFERING_OPTIONS = [
  { id: 'funding', label: 'Funding/Budget', description: 'Monetary support for the event' },
  { id: 'rewards', label: 'Rewards/Prizes', description: 'Prizes for participants' },
  { id: 'venue', label: 'Venue Access', description: 'Provide a venue for the event' },
  { id: 'branding', label: 'Branded Materials', description: 'Banners, swag, etc.' },
  { id: 'products', label: 'Product Samples', description: 'Free samples for attendees' },
  { id: 'services', label: 'Services', description: 'Catering, photography, etc.' },
];

export function SponsorOrgProposalModal({
  isOpen,
  onClose,
  sponsorId,
  sponsorName,
  org,
}: SponsorOrgProposalModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(org?.id || '');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDemographics, setTargetDemographics] = useState('');
  const [preferredDates, setPreferredDates] = useState('');
  const [offering, setOffering] = useState<string[]>([]);
  const [fundingAmount, setFundingAmount] = useState('');

  // Fetch organizations if not provided
  const { data: organizations } = useQuery({
    queryKey: ['verified-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, logo_url, description, type, school_affiliation')
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('name');
      if (error) throw error;
      return data as Organization[];
    },
    enabled: isOpen && !org,
  });

  // Find org admin to notify
  const { data: orgAdmin } = useQuery({
    queryKey: ['org-admin', selectedOrgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profile_organizations')
        .select('profile_id')
        .eq('org_id', selectedOrgId)
        .eq('role', 'admin')
        .limit(1)
        .single();
      return data?.profile_id as string | null;
    },
    enabled: !!selectedOrgId,
  });

  const selectedOrg = org || organizations?.find(o => o.id === selectedOrgId);

  const toggleOffering = (id: string) => {
    setOffering(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedOrg) return;

    if (!title.trim()) {
      toast({ title: 'Please enter a title', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('sponsor_org_requests')
      .insert({
        sponsor_id: sponsorId,
        org_id: selectedOrg.id,
        requester_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        target_demographics: targetDemographics.trim() || null,
        preferred_dates: preferredDates.trim() || null,
        offering: {
          items: offering,
          funding_amount: fundingAmount || null,
        },
        status: 'pending',
      });

    if (error) {
      toast({ title: 'Failed to send proposal', description: error.message, variant: 'destructive' });
    } else {
      // Notify org admin
      if (orgAdmin) {
        await createNotification({
          userId: orgAdmin,
          type: 'sponsor_org_request',
          title: `Partnership proposal from ${sponsorName}`,
          body: `${sponsorName} wants to partner with your organization for "${title}"`,
        });
      }

      toast({ title: 'Proposal sent!', description: 'The organization admin will be notified.' });
      onClose();
      resetForm();
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetDemographics('');
    setPreferredDates('');
    setOffering([]);
    setFundingAmount('');
    setSelectedOrgId('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Propose Partnership</DialogTitle>
          <DialogDescription>
            Reach out to an organization to propose a sponsorship partnership
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Organization Selection */}
          {!org && (
            <div className="space-y-2">
              <Label>Select Organization *</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an organization..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={o.logo_url || undefined} />
                          <AvatarFallback><Users className="h-3 w-3" /></AvatarFallback>
                        </Avatar>
                        {o.name}
                        {o.school_affiliation && (
                          <span className="text-xs text-muted-foreground">
                            ({o.school_affiliation})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Org Preview */}
          {selectedOrg && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedOrg.logo_url || undefined} />
                <AvatarFallback><Users className="h-5 w-5" /></AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedOrg.name}</p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {selectedOrg.type}
                  </Badge>
                  {selectedOrg.school_affiliation && (
                    <Badge variant="outline" className="text-xs">
                      {selectedOrg.school_affiliation}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Proposal Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., SXSW Partnership Opportunity"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">What you're proposing</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the partnership opportunity and what you're looking to achieve..."
              rows={3}
            />
          </div>

          {/* What You're Offering */}
          <div className="space-y-2">
            <Label>What are you offering?</Label>
            <div className="space-y-2">
              {OFFERING_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted"
                >
                  <Checkbox
                    checked={offering.includes(option.id)}
                    onCheckedChange={() => toggleOffering(option.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">{option.label}</span>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Funding Amount (if funding selected) */}
          {offering.includes('funding') && (
            <div className="space-y-2">
              <Label htmlFor="funding">Funding Amount</Label>
              <Input
                id="funding"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
                placeholder="e.g., $500-1000"
              />
            </div>
          )}

          {/* Target Demographics */}
          <div className="space-y-2">
            <Label htmlFor="demographics">Target Demographics</Label>
            <Input
              id="demographics"
              value={targetDemographics}
              onChange={(e) => setTargetDemographics(e.target.value)}
              placeholder="e.g., College students 18-24"
            />
          </div>

          {/* Preferred Dates */}
          <div className="space-y-2">
            <Label htmlFor="dates">Preferred Timing</Label>
            <Input
              id="dates"
              value={preferredDates}
              onChange={(e) => setPreferredDates(e.target.value)}
              placeholder="e.g., Spring semester, March-May"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedOrg}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Proposal'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
