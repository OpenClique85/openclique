import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Tables } from '@/integrations/supabase/types';

type Reward = Tables<'rewards'>;

interface RewardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sponsorId: string;
  editingReward?: Reward | null;
}

const FULFILLMENT_TYPES = [
  { value: 'code', label: 'Promo Code', description: 'Single or multiple promo codes' },
  { value: 'link', label: 'Link', description: 'URL to claim reward' },
  { value: 'qr', label: 'QR Code', description: 'Scannable QR code' },
  { value: 'on_site', label: 'On-Site', description: 'Redeemed in person' },
];

export function RewardFormModal({
  isOpen,
  onClose,
  onSuccess,
  sponsorId,
  editingReward,
}: RewardFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fulfillment_type: 'code',
    fulfillment_data: '',
    max_redemptions: '',
    expires_at: '',
  });

  useEffect(() => {
    if (editingReward) {
      setFormData({
        name: editingReward.name,
        description: editingReward.description || '',
        fulfillment_type: editingReward.fulfillment_type,
        fulfillment_data: editingReward.fulfillment_data || '',
        max_redemptions: editingReward.max_redemptions?.toString() || '',
        expires_at: editingReward.expires_at 
          ? format(new Date(editingReward.expires_at), 'yyyy-MM-dd')
          : '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        fulfillment_type: 'code',
        fulfillment_data: '',
        max_redemptions: '',
        expires_at: '',
      });
    }
  }, [editingReward, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const rewardData = {
        sponsor_id: sponsorId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        fulfillment_type: formData.fulfillment_type,
        fulfillment_data: formData.fulfillment_data.trim() || null,
        max_redemptions: formData.max_redemptions ? parseInt(formData.max_redemptions) : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      };

      if (editingReward) {
        const { error } = await supabase
          .from('rewards')
          .update(rewardData)
          .eq('id', editingReward.id);
        
        if (error) throw error;
        toast.success('Reward updated successfully');
      } else {
        const { error } = await supabase
          .from('rewards')
          .insert(rewardData);
        
        if (error) throw error;
        toast.success('Reward created successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving reward:', error);
      toast.error('Failed to save reward');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFulfillmentLabel = () => {
    switch (formData.fulfillment_type) {
      case 'code': return 'Promo Code(s)';
      case 'link': return 'Redemption URL';
      case 'qr': return 'QR Code Image URL';
      case 'on_site': return 'Redemption Instructions';
      default: return 'Fulfillment Data';
    }
  };

  const getFulfillmentPlaceholder = () => {
    switch (formData.fulfillment_type) {
      case 'code': return 'e.g., QUEST20OFF';
      case 'link': return 'https://yoursite.com/redeem';
      case 'qr': return 'https://yoursite.com/qr-code.png';
      case 'on_site': return 'Show this screen at the front desk...';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingReward ? 'Edit Reward' : 'Create Reward'}</DialogTitle>
          <DialogDescription>
            {editingReward 
              ? 'Update your reward details'
              : 'Create a new reward for quest participants'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Reward Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., 20% Off Your First Order"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What do participants receive?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fulfillment Type</Label>
            <Select
              value={formData.fulfillment_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, fulfillment_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FULFILLMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <span className="font-medium">{type.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        – {type.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fulfillment_data">{getFulfillmentLabel()}</Label>
            <Input
              id="fulfillment_data"
              value={formData.fulfillment_data}
              onChange={(e) => setFormData(prev => ({ ...prev, fulfillment_data: e.target.value }))}
              placeholder={getFulfillmentPlaceholder()}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_redemptions">Max Redemptions</Label>
              <Input
                id="max_redemptions"
                type="number"
                min="1"
                value={formData.max_redemptions}
                onChange={(e) => setFormData(prev => ({ ...prev, max_redemptions: e.target.value }))}
                placeholder="Unlimited"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Expires On</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingReward ? 'Update Reward' : 'Create Reward'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
