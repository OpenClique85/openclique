/**
 * =============================================================================
 * SuggestQuestModal - Propose a quest to your clique
 * =============================================================================
 * 
 * Features:
 * - Browse available quests
 * - Add optional message
 * - Creates squad_quest_invite with 'proposed' status
 * - Notifies clique members
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
  cliqueId: string;
  cliqueName: string;
  userId: string;
}

export function SuggestQuestModal({
  open,
  onOpenChange,
  cliqueId,
  cliqueName,
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
    
    // Fetch upcoming quest instances that are recruiting
    const today = new Date().toISOString().split('T')[0];
    const { data: instances, error } = await supabase
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
      .gte('scheduled_date', today)
      .eq('status', 'recruiting')
      .order('scheduled_date', { ascending: true })
      .limit(20);

    if (!error && instances) {
      // Filter out quests already invited/proposed to this clique
      const { data: existingInvites } = await supabase
        .from('squad_quest_invites')
        .select('quest_id')
        .eq('squad_id', cliqueId);

      const existingQuestIds = new Set(existingInvites?.map(i => i.quest_id) || []);

      const availableQuests: Quest[] = instances
        .filter(inst => !existingQuestIds.has(inst.id))
        .map(inst => ({
          id: inst.id,
          title: inst.title,
          icon: inst.icon,
          scheduled_date: inst.scheduled_date,
          start_time: inst.start_time,
          meeting_point_name: inst.meeting_point_name,
          progression_tree: inst.progression_tree
        }));

      setQuests(availableQuests);
    }
    
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedQuest) return;

    setIsSubmitting(true);

    try {
      // Create the clique quest invite with 'proposed' status
      const { data: invite, error: inviteError } = await supabase
        .from('squad_quest_invites')
        .insert({
          squad_id: cliqueId,
          quest_id: selectedQuest.id,
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

      toast.success(`Quest suggested to ${cliqueName}!`, {
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
          <DialogTitle>Suggest a Quest to {cliqueName}</DialogTitle>
          <DialogDescription>
            Pick a quest for your clique. Members will vote to join together.
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
              placeholder="Hey clique, this looks fun! Who's in?"
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
              'Suggest to Clique'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
