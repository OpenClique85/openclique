import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Mail } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;

const EMAIL_TEMPLATES = {
  confirmation: {
    subject: '🎉 You\'re confirmed for {{quest_title}}!',
    body: `Hey {{display_name}}!

Great news - you're officially confirmed for {{quest_title}} on {{quest_date}}.

📍 Meeting Point: {{meeting_location}}
⏰ Time: {{quest_time}}

What to expect:
{{briefing}}

If you can't make it anymore, please update your status in My Quests:
{{my_quests_url}}

See you there!
- The OpenClique Team`
  },
  reminder_24h: {
    subject: '⏰ Tomorrow: {{quest_title}}',
    body: `Hey {{display_name}}!

Just a friendly reminder that {{quest_title}} is tomorrow!

📍 Where: {{meeting_location}}
⏰ When: {{quest_date}} at {{quest_time}}

If something came up and you can't make it, please let us know:
{{my_quests_url}}

See you soon!
- The OpenClique Team`
  },
  day_of: {
    subject: '🚀 Today\'s the day: {{quest_title}}!',
    body: `Hey {{display_name}}!

Today's the day! {{quest_title}} is happening at {{quest_time}}.

📍 Meeting Point: {{meeting_location}}

Check the app for your squad details and any last-minute updates.

See you soon!
- The OpenClique Team`
  },
  feedback_request: {
    subject: '💬 How was {{quest_title}}?',
    body: `Hey {{display_name}}!

Thanks for joining us at {{quest_title}}! We'd love to hear how it went.

It takes just 60 seconds and helps us create better experiences:
{{feedback_url}}

Thanks for being part of OpenClique!
- The OpenClique Team`
  }
};

type TemplateType = keyof typeof EMAIL_TEMPLATES;

export function MessagingCenter() {
  const { toast } = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuestId, setSelectedQuestId] = useState<string>('');
  const [selectedSegment, setSelectedSegment] = useState<string>('confirmed');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('confirmation');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);

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
    if (selectedTemplate) {
      const template = EMAIL_TEMPLATES[selectedTemplate];
      setSubject(template.subject);
      setBody(template.body);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    const fetchRecipientCount = async () => {
      if (!selectedQuestId) return;
      
      const { count } = await supabase
        .from('quest_signups')
        .select('*', { count: 'exact', head: true })
        .eq('quest_id', selectedQuestId)
        .eq('status', selectedSegment as any);
      
      setRecipientCount(count || 0);
    };
    
    fetchRecipientCount();
  }, [selectedQuestId, selectedSegment]);

  const handleSend = async () => {
    if (!selectedQuestId || !subject || !body) {
      toast({ variant: 'destructive', title: 'Please fill in all fields' });
      return;
    }
    
    setIsSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          questId: selectedQuestId,
          segment: selectedSegment,
          template: selectedTemplate,
          subject,
          body
        }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Emails sent!',
        description: `Successfully sent to ${data?.sent || 0} recipients.`
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to send emails',
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
            <Mail className="h-5 w-5" />
            Send Emails
          </CardTitle>
          <CardDescription>
            Send templated emails to quest participants. Emails are sent from andrew.poss@openclique.net
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selectors */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Quest</Label>
              <Select value={selectedQuestId} onValueChange={setSelectedQuestId}>
                <SelectTrigger>
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
            
            <div className="space-y-2">
              <Label>Segment</Label>
              <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="standby">Standby</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as TemplateType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmation">Confirmation</SelectItem>
                  <SelectItem value="reminder_24h">Reminder (24h)</SelectItem>
                  <SelectItem value="day_of">Day-of</SelectItem>
                  <SelectItem value="feedback_request">Feedback Request</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Email Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {'{{display_name}}'}, {'{{quest_title}}'}, {'{{quest_date}}'}, {'{{quest_time}}'}, {'{{meeting_location}}'}, {'{{my_quests_url}}'}, {'{{feedback_url}}'}, {'{{briefing}}'}
              </p>
            </div>
          </div>
          
          {/* Send Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Will send to <strong>{recipientCount}</strong> {selectedSegment} recipient{recipientCount !== 1 ? 's' : ''}
            </p>
            <Button onClick={handleSend} disabled={isSending || recipientCount === 0}>
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send Emails
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
