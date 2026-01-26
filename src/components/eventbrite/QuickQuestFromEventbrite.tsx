/**
 * QuickQuestFromEventbrite - Minimal form for fast quest creation from Eventbrite data
 * 
 * Bypasses the full 9-step wizard for rapid quest creation.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, MapPin, Ticket, Edit, Save, Send, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const PROGRESSION_TREES = [
  { value: 'culture', label: 'Culture Vulture', emoji: '🎭' },
  { value: 'wellness', label: 'Wellness Warrior', emoji: '🧘' },
  { value: 'connector', label: 'Social Connector', emoji: '🤝' },
];

interface EventbriteEventData {
  eventbrite_event_id: string;
  name: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  venue_name: string | null;
  venue_address: any;
  image_url: string | null;
  ticket_url: string;
  is_free: boolean;
  capacity: number | null;
  organizer_name: string | null;
}

interface QuickQuestFromEventbriteProps {
  eventData: EventbriteEventData;
  onCancel: () => void;
  onEditFull?: () => void;
}

export function QuickQuestFromEventbrite({ 
  eventData, 
  onCancel,
  onEditFull 
}: QuickQuestFromEventbriteProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(eventData.name);
  const [shortDescription, setShortDescription] = useState(
    eventData.description?.slice(0, 280) || ''
  );
  const [progressionTree, setProgressionTree] = useState<string>('');
  const [cliqueSize, setCliqueSize] = useState(4);

  // Format the address for display
  const formatAddress = (address: any): string => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    return address.localized_address_display || 
           [address.address_1, address.city, address.region].filter(Boolean).join(', ');
  };

  const createQuestMutation = useMutation({
    mutationFn: async (isDraft: boolean) => {
      if (!user) throw new Error('Not authenticated');
      if (!progressionTree) throw new Error('Please select a quest category');

      // Generate a slug from the title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + 
        '-' + Date.now().toString(36);

      const questData: Record<string, unknown> = {
        title,
        slug,
        short_description: shortDescription,
        full_description: eventData.description || '',
        progression_tree: progressionTree as 'culture' | 'wellness' | 'connector',
        default_squad_size: cliqueSize,
        capacity_total: eventData.capacity || cliqueSize * 2,
        start_datetime: eventData.start_datetime,
        end_datetime: eventData.end_datetime,
        meeting_location_name: eventData.venue_name || '',
        meeting_address: formatAddress(eventData.venue_address),
        image_url: eventData.image_url || '',
        external_ticket_url: eventData.ticket_url,
        is_ticketed: !eventData.is_free,
        cost_description: eventData.is_free ? 'Free' : 'See Eventbrite for pricing',
        created_via: 'eventbrite',
        eventbrite_event_id: eventData.eventbrite_event_id,
        creator_id: user.id,
        status: 'draft',
        review_status: isDraft ? 'draft' : 'pending_review',
        icon: PROGRESSION_TREES.find(t => t.value === progressionTree)?.emoji || '🎯',
        theme: PROGRESSION_TREES.find(t => t.value === progressionTree)?.label || '',
      };

      const { data, error } = await supabase
        .from('quests')
        .insert(questData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, isDraft) => {
      queryClient.invalidateQueries({ queryKey: ['creator-quests'] });
      if (isDraft) {
        toast.success('Quest saved as draft!');
      } else {
        toast.success('Quest submitted for review!');
      }
      navigate('/creator/quests');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create quest');
    },
  });

  const handleSaveDraft = () => createQuestMutation.mutate(true);
  const handleSubmit = () => createQuestMutation.mutate(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Event Preview Card */}
      <Card className="overflow-hidden">
        {eventData.image_url && (
          <div className="relative h-48 w-full">
            <img
              src={eventData.image_url}
              alt={eventData.name}
              className="w-full h-full object-cover"
            />
            <Badge className="absolute top-3 right-3 bg-background/90 text-foreground">
              <Ticket className="h-3 w-3 mr-1" />
              From Eventbrite
            </Badge>
          </div>
        )}
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {eventData.start_datetime && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(eventData.start_datetime), 'PPp')}
              </span>
            )}
            {eventData.venue_name && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {eventData.venue_name}
              </span>
            )}
            <a 
              href={eventData.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline ml-auto"
            >
              View on Eventbrite
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Quick Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Quest Setup</CardTitle>
          <CardDescription>
            Review and customize the key details for your OpenClique quest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Quest Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quest title"
            />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Short Description
              <span className="text-muted-foreground ml-2 text-xs">
                ({shortDescription.length}/280)
              </span>
            </Label>
            <Textarea
              id="description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value.slice(0, 280))}
              placeholder="Brief description for quest cards..."
              rows={3}
            />
          </div>

          {/* Progression Tree */}
          <div className="space-y-2">
            <Label htmlFor="progression">Quest Category *</Label>
            <Select value={progressionTree} onValueChange={setProgressionTree}>
              <SelectTrigger id="progression">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {PROGRESSION_TREES.map((tree) => (
                  <SelectItem key={tree.value} value={tree.value}>
                    <span className="flex items-center gap-2">
                      <span>{tree.emoji}</span>
                      <span>{tree.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clique Size */}
          <div className="space-y-2">
            <Label htmlFor="clique-size">Target Clique Size</Label>
            <Select 
              value={cliqueSize.toString()} 
              onValueChange={(v) => setCliqueSize(parseInt(v))}
            >
              <SelectTrigger id="clique-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 4, 5, 6].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} people per clique
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              className="sm:order-1"
            >
              Cancel
            </Button>
            
            {onEditFull && (
              <Button
                variant="outline"
                onClick={onEditFull}
                className="gap-2 sm:order-2"
              >
                <Edit className="h-4 w-4" />
                Edit Full Details
              </Button>
            )}

            <div className="flex gap-2 sm:ml-auto sm:order-3">
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={createQuestMutation.isPending}
                className="gap-2"
              >
                {createQuestMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Draft
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createQuestMutation.isPending || !progressionTree}
                className="gap-2"
              >
                {createQuestMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit for Review
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
