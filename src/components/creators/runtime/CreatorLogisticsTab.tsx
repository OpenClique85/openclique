import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, MapPin, Package, Shield, Save, ExternalLink } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

interface CreatorLogisticsTabProps {
  quest: Tables<'quests'>;
}

export function CreatorLogisticsTab({ quest }: CreatorLogisticsTabProps) {
  const queryClient = useQueryClient();
  
  const [meetingLocation, setMeetingLocation] = useState(quest.meeting_location_name || '');
  const [meetingAddress, setMeetingAddress] = useState(quest.meeting_address || '');
  const [whatToBring, setWhatToBring] = useState(quest.what_to_bring || '');
  const [safetyNotes, setSafetyNotes] = useState(quest.safety_notes || '');
  const [dressCode, setDressCode] = useState(quest.dress_code || '');

  const updateQuest = useMutation({
    mutationFn: async (updates: Partial<Tables<'quests'>>) => {
      const { error } = await supabase
        .from('quests')
        .update(updates)
        .eq('id', quest.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-quest-runtime', quest.id] });
      toast.success('Details updated!');
    },
    onError: () => {
      toast.error('Failed to update details');
    },
  });

  const handleSave = () => {
    updateQuest.mutate({
      meeting_location_name: meetingLocation,
      meeting_address: meetingAddress,
      what_to_bring: whatToBring,
      safety_notes: safetyNotes,
      dress_code: dressCode,
    });
  };

  const hasChanges = 
    meetingLocation !== (quest.meeting_location_name || '') ||
    meetingAddress !== (quest.meeting_address || '') ||
    whatToBring !== (quest.what_to_bring || '') ||
    safetyNotes !== (quest.safety_notes || '') ||
    dressCode !== (quest.dress_code || '');

  return (
    <div className="space-y-6">
      {/* Meeting Point */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Meeting Point
          </CardTitle>
          <CardDescription>
            Where participants should meet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-location">Location Name</Label>
            <Input
              id="meeting-location"
              value={meetingLocation}
              onChange={(e) => setMeetingLocation(e.target.value)}
              placeholder="e.g., Central Park - Bethesda Fountain"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting-address">Address</Label>
            <Input
              id="meeting-address"
              value={meetingAddress}
              onChange={(e) => setMeetingAddress(e.target.value)}
              placeholder="e.g., Central Park, New York, NY 10024"
            />
            {meetingAddress && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                asChild
              >
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(meetingAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open in Google Maps
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* What to Bring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            What to Bring
          </CardTitle>
          <CardDescription>
            Items participants should prepare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="what-to-bring">Items</Label>
            <Textarea
              id="what-to-bring"
              value={whatToBring}
              onChange={(e) => setWhatToBring(e.target.value)}
              placeholder="e.g., Comfortable walking shoes, water bottle, sunscreen..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dress-code">Dress Code</Label>
            <Input
              id="dress-code"
              value={dressCode}
              onChange={(e) => setDressCode(e.target.value)}
              placeholder="e.g., Casual outdoor attire"
            />
          </div>
        </CardContent>
      </Card>

      {/* Safety Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Notes
          </CardTitle>
          <CardDescription>
            Important safety information for participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="safety-notes">Safety Information</Label>
            <Textarea
              id="safety-notes"
              value={safetyNotes}
              onChange={(e) => setSafetyNotes(e.target.value)}
              placeholder="e.g., Bring ID, stay hydrated, emergency contact available..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateQuest.isPending}
          className="gap-2"
        >
          {updateQuest.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
