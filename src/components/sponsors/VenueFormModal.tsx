import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/integrations/supabase/types';

type VenueOffering = Tables<'venue_offerings'>;

interface VenueFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sponsorId: string;
  editingVenue?: VenueOffering | null;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AMENITIES_OPTIONS = [
  'WiFi', 'Parking', 'A/V Equipment', 'Seating', 'Standing Room',
  'Kitchen', 'Restrooms', 'Outdoor Space', 'Wheelchair Accessible', 'Food & Drinks'
];

const QUEST_TYPES = [
  'Culture', 'Wellness', 'Connector', 'Adventure', 'Food & Drink', 'Creative'
];

export function VenueFormModal({
  isOpen,
  onClose,
  onSuccess,
  sponsorId,
  editingVenue,
}: VenueFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    venue_name: '',
    address: '',
    capacity: '',
    available_days: [] as string[],
    ideal_quest_types: [] as string[],
    amenities: [] as string[],
    venue_rules: '',
    approval_required: true,
  });

  useEffect(() => {
    if (editingVenue) {
      setFormData({
        venue_name: editingVenue.venue_name,
        address: editingVenue.address || '',
        capacity: editingVenue.capacity?.toString() || '',
        available_days: editingVenue.available_days || [],
        ideal_quest_types: editingVenue.ideal_quest_types || [],
        amenities: editingVenue.amenities || [],
        venue_rules: editingVenue.venue_rules || '',
        approval_required: editingVenue.approval_required ?? true,
      });
    } else {
      setFormData({
        venue_name: '',
        address: '',
        capacity: '',
        available_days: [],
        ideal_quest_types: [],
        amenities: [],
        venue_rules: '',
        approval_required: true,
      });
    }
  }, [editingVenue, isOpen]);

  const toggleArrayItem = (arr: string[], item: string): string[] => {
    return arr.includes(item) 
      ? arr.filter(i => i !== item)
      : [...arr, item];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.venue_name.trim()) {
      toast.error('Venue name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const venueData = {
        sponsor_id: sponsorId,
        venue_name: formData.venue_name.trim(),
        address: formData.address.trim() || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        available_days: formData.available_days,
        ideal_quest_types: formData.ideal_quest_types,
        amenities: formData.amenities,
        venue_rules: formData.venue_rules.trim() || null,
        approval_required: formData.approval_required,
      };

      if (editingVenue) {
        const { error } = await supabase
          .from('venue_offerings')
          .update(venueData)
          .eq('id', editingVenue.id);
        
        if (error) throw error;
        toast.success('Venue updated successfully');
      } else {
        const { error } = await supabase
          .from('venue_offerings')
          .insert(venueData);
        
        if (error) throw error;
        toast.success('Venue added successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving venue:', error);
      toast.error('Failed to save venue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingVenue ? 'Edit Venue' : 'Add Venue'}</DialogTitle>
          <DialogDescription>
            {editingVenue 
              ? 'Update your venue details'
              : 'Add a new venue for quest creators to use'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venue_name">Venue Name *</Label>
            <Input
              id="venue_name"
              value={formData.venue_name}
              onChange={(e) => setFormData(prev => ({ ...prev, venue_name: e.target.value }))}
              placeholder="e.g., Downtown Event Space"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Main St, Austin, TX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              placeholder="Max number of people"
            />
          </div>

          <div className="space-y-2">
            <Label>Available Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <Toggle
                  key={day}
                  pressed={formData.available_days.includes(day)}
                  onPressedChange={() => 
                    setFormData(prev => ({
                      ...prev,
                      available_days: toggleArrayItem(prev.available_days, day)
                    }))
                  }
                  size="sm"
                >
                  {day}
                </Toggle>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ideal Quest Types</Label>
            <div className="flex flex-wrap gap-2">
              {QUEST_TYPES.map((type) => (
                <Badge
                  key={type}
                  variant={formData.ideal_quest_types.includes(type) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => 
                    setFormData(prev => ({
                      ...prev,
                      ideal_quest_types: toggleArrayItem(prev.ideal_quest_types, type)
                    }))
                  }
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <Badge
                  key={amenity}
                  variant={formData.amenities.includes(amenity) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => 
                    setFormData(prev => ({
                      ...prev,
                      amenities: toggleArrayItem(prev.amenities, amenity)
                    }))
                  }
                >
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue_rules">Venue Rules / Notes</Label>
            <Textarea
              id="venue_rules"
              value={formData.venue_rules}
              onChange={(e) => setFormData(prev => ({ ...prev, venue_rules: e.target.value }))}
              placeholder="Any restrictions or guidelines..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Approval</Label>
              <p className="text-xs text-muted-foreground">
                Review requests before confirming bookings
              </p>
            </div>
            <Switch
              checked={formData.approval_required}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, approval_required: checked }))
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingVenue ? 'Update Venue' : 'Add Venue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
