/**
 * =============================================================================
 * SuggestQuestModal - Propose a quest to your squad
 * =============================================================================
 * 
 * Features:
 * - Browse available quests
 * - Add optional message
 * - Creates squad_quest_invite with 'proposed' status
 * - Notifies squad members
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, Calendar, MapPin, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Quest {
  id: string;
  title: string;
  icon: string | null;
  scheduled_date: string;
  start_time: string;
  meeting_point_name: string | null;
  progression_tree: string | null;
}

interface SuggestQuestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  squadId: string;
  squadName: string;
  userId: string;
}

export function SuggestQuestModal({
  open,
  onOpenChange,
  squadId,
  squadName,
  userId
}: SuggestQuestModalProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      fetchAvailableQuests();
    }
  }, [open]);

  const fetchAvailableQuests = async () => {
    setIsLoading(true);
    
    const now = new Date().toISOString();
    
    // First try quest_instances that are recruiting
    const { data: instances } = await supabase
      .from('quest_instances')
      .select(`
        id,
        scheduled_date,
        start_time,
        title,
        icon,
        meeting_point_name,
        progression_tree
      `)
      .gte('scheduled_date', now.split('T')[0])
      .eq('status', 'recruiting')
      .order('scheduled_date', { ascending: true })
      .limit(20);

    // Also fetch open quests directly (they may not have instances yet)
    const { data: quests } = await supabase
      .from('quests')
      .select(`
        id,
        title,
        icon,
        start_datetime,
        meeting_location_name,
        progression_tree
      `)
      .eq('status', 'open')
      .eq('visibility', 'public')
      .gte('start_datetime', now)
      .order('start_datetime', { ascending: true })
      .limit(20);

    // Filter out quests already invited/proposed to this squad
    const { data: existingInvites } = await supabase
      .from('squad_quest_invites')
      .select('quest_id')
      .eq('squad_id', squadId);

    const existingQuestIds = new Set(existingInvites?.map(i => i.quest_id) || []);

    // Combine instances and quests, deduplicating by ID
    const seenIds = new Set<string>();
    const availableQuests: Quest[] = [];

    // Add instances first
    instances?.forEach(inst => {
      if (!existingQuestIds.has(inst.id) && !seenIds.has(inst.id)) {
        seenIds.add(inst.id);
        availableQuests.push({
          id: inst.id,
          title: inst.title,
          icon: inst.icon,
          scheduled_date: inst.scheduled_date,
          start_time: inst.start_time,
          meeting_point_name: inst.meeting_point_name,
          progression_tree: inst.progression_tree
        });
      }
    });

    // Add quests that don't have instances yet
    quests?.forEach(quest => {
      if (!existingQuestIds.has(quest.id) && !seenIds.has(quest.id)) {
        seenIds.add(quest.id);
        const startDate = quest.start_datetime ? new Date(quest.start_datetime) : null;
        availableQuests.push({
          id: quest.id,
          title: quest.title,
          icon: quest.icon,
          scheduled_date: startDate ? startDate.toISOString().split('T')[0] : '',
          start_time: startDate ? startDate.toTimeString().slice(0, 5) : '',
          meeting_point_name: quest.meeting_location_name,
          progression_tree: quest.progression_tree
        });
      }
    });

    // Sort by date
    availableQuests.sort((a, b) => {
      const dateA = a.scheduled_date || '';
      const dateB = b.scheduled_date || '';
      return dateA.localeCompare(dateB);
    });

    setQuests(availableQuests);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedQuest) return;

    setIsSubmitting(true);

    try {
      // Create the squad quest invite with 'proposed' status
      // Note: squad_quest_invites.quest_id references quests, so we need the quest template ID
      // For now, we'll use the instance ID and handle the mapping in the backend
      const { data: invite, error: inviteError } = await supabase
        .from('squad_quest_invites')
        .insert({
          squad_id: squadId,
          quest_id: selectedQuest.id, // Using instance ID for now - should map to quest template
          status: 'proposed',
          proposed_by: userId,
          proposal_message: message || null,
          proposed_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (inviteError) throw inviteError;

      // Auto-accept for the proposer
      if (invite) {
        await supabase
          .from('squad_invite_responses')
          .insert({
            invite_id: invite.id,
            user_id: userId,
            response: 'accept'
          });
      }

      // Send notifications to squad members
      try {
        await supabase.functions.invoke('notify-clique-members', {
          body: {
            squad_id: squadId,
            notification_type: 'quest_suggested',
            title: 'New Quest Suggested',
            body: `A quest "${selectedQuest.title}" was suggested to ${squadName}`,
            metadata: {
              quest_id: selectedQuest.id,
              quest_title: selectedQuest.title,
              suggested_by: userId,
              message,
            },
            exclude_user_ids: [userId], // Don't notify the proposer
          },
        });
      } catch (notifyError) {
        console.error('Failed to send notifications:', notifyError);
        // Don't fail the whole operation if notifications fail
      }

      toast.success(`Quest suggested to ${squadName}!`, {
        description: 'Your clique members will be notified to RSVP.'
      });

      onOpenChange(false);
      setSelectedQuest(null);
      setMessage('');
    } catch (error) {
      console.error('Error suggesting quest:', error);
      toast.error('Failed to suggest quest');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuests = quests.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to format date and time
  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date}T${time}`);
      return format(dateTime, 'MMM d, h:mm a');
    } catch {
      return `${date} ${time}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Suggest a Quest to {squadName}</DialogTitle>
          <DialogDescription>
            Pick a quest for your squad. Members will vote to join together.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Quest List */}
        <ScrollArea className="flex-1 -mx-6 px-6 min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredQuests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No available quests found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredQuests.map((quest) => (
                <Card
                  key={quest.id}
                  className={`cursor-pointer transition-colors ${
                    selectedQuest?.id === quest.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedQuest(quest)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{quest.icon || '🎯'}</span>
                        <div>
                          <p className="font-medium">{quest.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(quest.scheduled_date, quest.start_time)}
                            </span>
                            {quest.meeting_point_name && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {quest.meeting_point_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedQuest?.id === quest.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    {quest.progression_tree && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {quest.progression_tree}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Message */}
        {selectedQuest && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Add a message (optional)
            </label>
            <Textarea
              placeholder="Hey squad, this looks fun! Who's in?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedQuest || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suggesting...
              </>
            ) : (
              'Suggest to Squad'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
