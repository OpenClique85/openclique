import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Megaphone, MessageSquare, Send, Users, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreatorCommsTabProps {
  questId: string;
  questTitle: string;
}

export function CreatorCommsTab({ questId, questTitle }: CreatorCommsTabProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'confirmed' | 'squad'>('all');
  const [selectedSquad, setSelectedSquad] = useState<string>('');

  // Fetch squads for targeting
  const { data: squads } = useQuery({
    queryKey: ['creator-quest-squads', questId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_squads')
        .select('id, squad_name')
        .eq('quest_id', questId);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Send announcement mutation
  const sendAnnouncement = useMutation({
    mutationFn: async () => {
      if (!message.trim()) throw new Error('Message is required');

      // Get target user IDs based on audience
      let userIds: string[] = [];
      
      if (targetAudience === 'squad' && selectedSquad) {
        // Get squad members
        const { data: members } = await supabase
          .from('squad_members')
          .select('user_id')
          .eq('persistent_squad_id', selectedSquad)
          .eq('status', 'active');
        
        userIds = members?.map(m => m.user_id) || [];
      } else {
        // Get quest signups
        const { data: signups } = await supabase
          .from('quest_signups')
          .select('user_id, status')
          .eq('quest_id', questId)
          .in('status', targetAudience === 'confirmed' ? ['confirmed'] : ['pending', 'confirmed', 'standby']);
        
        userIds = signups?.map(s => s.user_id) || [];
      }

      if (userIds.length === 0) {
        throw new Error('No recipients found');
      }

      // Create notifications for each user
      // Use 'general' type which is a valid notification type
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: 'general' as const,
        title: `Update: ${questTitle}`,
        body: message.trim(),
        quest_id: questId,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      return userIds.length;
    },
    onSuccess: (count) => {
      toast.success(`Announcement sent to ${count} participant${count !== 1 ? 's' : ''}`);
      setMessage('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send announcement');
    },
  });

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          As a creator, you can send announcements to participants but cannot view squad chat messages to protect participant privacy.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Send Announcement
          </CardTitle>
          <CardDescription>
            Notify participants about important updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Send To</Label>
            <Select value={targetAudience} onValueChange={(v: any) => setTargetAudience(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All Signups
                  </span>
                </SelectItem>
                <SelectItem value="confirmed">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Confirmed Only
                  </span>
                </SelectItem>
                <SelectItem value="squad">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Specific Squad
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetAudience === 'squad' && (
            <div className="space-y-2">
              <Label>Select Squad</Label>
              <Select value={selectedSquad} onValueChange={setSelectedSquad}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a squad..." />
                </SelectTrigger>
                <SelectContent>
                  {squads?.map((squad) => (
                    <SelectItem key={squad.id} value={squad.id}>
                      {squad.squad_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your announcement here..."
              rows={4}
            />
          </div>

          <Button
            onClick={() => sendAnnouncement.mutate()}
            disabled={!message.trim() || sendAnnouncement.isPending || (targetAudience === 'squad' && !selectedSquad)}
            className="w-full gap-2"
          >
            {sendAnnouncement.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Announcement
          </Button>
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Templates</CardTitle>
          <CardDescription>Common messages you can use</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button
            variant="outline"
            className="justify-start h-auto py-3 px-4"
            onClick={() => setMessage("Hey everyone! Just a friendly reminder that our quest is coming up soon. Make sure to check the meeting location and time. Can't wait to see you there! 🎉")}
          >
            <div className="text-left">
              <p className="font-medium">Reminder</p>
              <p className="text-xs text-muted-foreground">Send a friendly reminder about the upcoming quest</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-3 px-4"
            onClick={() => setMessage("Quick update on our meeting point - please check the quest details for any changes. If you have questions, feel free to reach out!")}
          >
            <div className="text-left">
              <p className="font-medium">Location Update</p>
              <p className="text-xs text-muted-foreground">Notify about meeting point changes</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-3 px-4"
            onClick={() => setMessage("Thanks for joining us today! I hope you had an amazing time. Don't forget to share your experience and connect with your squad members. Until next time! 🙌")}
          >
            <div className="text-left">
              <p className="font-medium">Post-Quest Thank You</p>
              <p className="text-xs text-muted-foreground">Send a thank you message after the quest</p>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
