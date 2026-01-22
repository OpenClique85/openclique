import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageCircle, Send, AlertTriangle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;

export function WhatsAppManager() {
  const { toast } = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuestId, setSelectedQuestId] = useState<string>('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(0);

  useEffect(() => {
    const fetchQuests = async () => {
      const { data } = await supabase
        .from('quests')
        .select('*')
        .order('start_datetime', { ascending: false });
      
      if (data && data.length > 0) {
        setQuests(data);
        setSelectedQuestId(data[0].id);
      }
      setIsLoading(false);
    };
    
    fetchQuests();
  }, []);

  useEffect(() => {
    if (selectedQuestId) {
      const quest = quests.find(q => q.id === selectedQuestId);
      setWhatsappLink(quest?.whatsapp_invite_link || '');
      
      // Fetch confirmed count
      supabase
        .from('quest_signups')
        .select('*', { count: 'exact', head: true })
        .eq('quest_id', selectedQuestId)
        .eq('status', 'confirmed')
        .then(({ count }) => setConfirmedCount(count || 0));
    }
  }, [selectedQuestId, quests]);

  const handleSaveLink = async () => {
    if (!selectedQuestId) return;
    
    setIsSaving(true);
    
    const { error } = await supabase
      .from('quests')
      .update({ whatsapp_invite_link: whatsappLink || null })
      .eq('id', selectedQuestId);
    
    setIsSaving(false);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Failed to save link' });
      return;
    }
    
    // Update local state
    setQuests(prev => prev.map(q => 
      q.id === selectedQuestId ? { ...q, whatsapp_invite_link: whatsappLink } : q
    ));
    
    toast({ title: 'WhatsApp link saved!' });
  };

  const handleSendToConfirmed = async () => {
    if (!whatsappLink) {
      toast({ variant: 'destructive', title: 'Please save a WhatsApp link first' });
      return;
    }
    
    setIsSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          questId: selectedQuestId,
          segment: 'confirmed',
          template: 'whatsapp',
          subject: '📱 Join the WhatsApp Group',
          body: `Hey {{display_name}}!\n\nYour squad is forming! Join the WhatsApp group to connect with your fellow questers:\n\n${whatsappLink}\n\n⚠️ Note: Joining shares your phone number with squad members.\n\nSee you there!\n- The OpenClique Team`
        }
      });
      
      if (error) throw error;
      
      toast({
        title: 'WhatsApp links sent!',
        description: `Sent to ${data?.sent || 0} confirmed participants.`
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to send',
        description: error.message
      });
    }
    
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            WhatsApp Distribution
          </CardTitle>
          <CardDescription>
            Manage WhatsApp invite links and distribute them to confirmed participants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quest Selector */}
          <div className="space-y-2">
            <Label>Quest</Label>
            <Select value={selectedQuestId} onValueChange={setSelectedQuestId}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Select quest" />
              </SelectTrigger>
              <SelectContent>
                {quests.map((quest) => (
                  <SelectItem key={quest.id} value={quest.id}>
                    {quest.icon} {quest.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* WhatsApp Link */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Invite Link</Label>
            <div className="flex gap-2">
              <Input
                id="whatsapp"
                value={whatsappLink}
                onChange={(e) => setWhatsappLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="flex-1"
              />
              <Button onClick={handleSaveLink} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Create a group in WhatsApp, then tap "Invite to group via link" to get the link
            </p>
          </div>
          
          {/* Privacy Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> When participants join the WhatsApp group, their phone numbers become visible to all members. Make sure participants understand this before joining.
            </AlertDescription>
          </Alert>
          
          {/* Send Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>{confirmedCount}</strong> confirmed participant{confirmedCount !== 1 ? 's' : ''} will receive this link
            </p>
            <Button 
              onClick={handleSendToConfirmed} 
              disabled={isSending || !whatsappLink || confirmedCount === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send to Confirmed
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
