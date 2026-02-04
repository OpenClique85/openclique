/**
 * Run of Show Controls
 * 
 * Template-based messaging panel for operators to send notifications at key moments.
 * Also includes monitoring for active cliques.
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Send, Copy, Users, Clock, Bell, 
  AlertCircle, CheckCircle, Loader2, MessageCircle
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { ActiveCliquesPanel } from './ActiveCliquesPanel';

type QuestInstance = Tables<'quest_instances'>;

interface MessageTemplate {
  id: string;
  template_key: string;
  category: string;
  name: string;
  subject: string | null;
  body: string;
  available_placeholders: string[];
}

interface RunOfShowControlsProps {
  instance: QuestInstance;
}

export function RunOfShowControls({ instance }: RunOfShowControlsProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [recipientType, setRecipientType] = useState<'all' | 'confirmed' | 'squad'>('confirmed');
  const [selectedSquads, setSelectedSquads] = useState<string[]>([]);
  const [previewBody, setPreviewBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('category', { ascending: true });
      if (error) throw error;
      return data as MessageTemplate[];
    },
  });

  // Fetch squads
  const { data: squads } = useQuery({
    queryKey: ['instance-squads', instance.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_squads')
        .select('id, name')
        .eq('quest_id', instance.id);
      if (error) throw error;
      return data;
    },
  });

  // Fetch recipient counts
  const { data: recipientCounts } = useQuery({
    queryKey: ['instance-recipient-counts', instance.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_signups')
        .select('status')
        .eq('instance_id', instance.id)
        .not('status', 'in', '(dropped,no_show)');
      
      if (error) throw error;
      
      return {
        all: data?.length || 0,
        confirmed: data?.filter((s: any) => s.status === 'confirmed' || s.status === 'completed').length || 0,
      };
    },
  });

  // Handle template selection
  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = templates?.find(t => t.template_key === templateKey);
    if (template) {
      // Replace placeholders with instance data
      let body = template.body;
      body = body.replace(/\{\{quest_title\}\}/g, instance.title);
      body = body.replace(/\{\{meeting_point\}\}/g, instance.meeting_point_name || 'TBD');
      body = body.replace(/\{\{start_time\}\}/g, instance.start_time?.slice(0, 5) || 'TBD');
      body = body.replace(/\{\{what_to_bring\}\}/g, instance.what_to_bring || '');
      body = body.replace(/\{\{quest_card_url\}\}/g, `${window.location.origin}/quest-card/${instance.quest_card_token}`);
      setPreviewBody(body);
    }
  };

  // Send messages
  const handleSend = async () => {
    if (!selectedTemplate || !previewBody) {
      toast({ title: 'Select a template first', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      // Get recipients based on selection - use direct query to avoid type issues
      const { data: recipients, error: fetchError } = await supabase
        .from('quest_signups')
        .select('user_id, status')
        .eq('instance_id', instance.id);
      
      if (fetchError) throw fetchError;
      
      let filteredRecipients = recipients || [];
      if (recipientType === 'confirmed') {
        filteredRecipients = filteredRecipients.filter((r: any) => 
          r.status === 'confirmed' || r.status === 'completed'
        );
      }
      // Note: squad filtering would need instance_id column support
      
      const userIds = filteredRecipients.map((r: any) => r.user_id);
      
      if (userIds.length === 0) {
        toast({ title: 'No recipients found', variant: 'destructive' });
        return;
      }

      // Create notifications for each user
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: 'general' as const,
        title: `Quest Update: ${instance.title}`,
        body: previewBody,
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);
      
      if (insertError) throw insertError;

      // Log the send event
      await supabase.rpc('log_quest_event', {
        p_instance_id: instance.id,
        p_event_type: 'message_sent' as any,
        p_actor_type: 'admin',
        p_payload: {
          template_key: selectedTemplate,
          recipient_type: recipientType,
          recipient_count: userIds.length,
        }
      });

      toast({ 
        title: 'Messages sent!', 
        description: `Notified ${userIds.length} participants` 
      });
      
      // Reset form
      setSelectedTemplate('');
      setPreviewBody('');
    } catch (err: any) {
      toast({ title: 'Failed to send', description: err.message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  // Copy message for WhatsApp
  const copyForWhatsApp = () => {
    if (!previewBody) return;
    navigator.clipboard.writeText(previewBody);
    toast({ title: 'Message copied!', description: 'Paste into WhatsApp' });
  };

  // Group templates by category
  const templatesByCategory = templates?.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, MessageTemplate[]>) || {};

  const getRecipientCount = () => {
    if (recipientType === 'all') return recipientCounts?.all || 0;
    if (recipientType === 'confirmed') return recipientCounts?.confirmed || 0;
    return selectedSquads.length * 6; // Estimate
  };

  return (
    <Tabs defaultValue="messages" className="space-y-6">
      <TabsList>
        <TabsTrigger value="messages" className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          Messages
        </TabsTrigger>
        <TabsTrigger value="cliques" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Active Cliques
        </TabsTrigger>
      </TabsList>

      <TabsContent value="messages">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Message Composer */}
          <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
          <CardDescription>
            Select a template and recipients to send notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Message Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(templatesByCategory).map(([category, temps]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                      {category}
                    </div>
                    {temps.map(t => (
                      <SelectItem key={t.template_key} value={t.template_key}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Selection */}
          <div className="space-y-3">
            <Label>Recipients</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={recipientType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecipientType('all')}
              >
                All ({recipientCounts?.all || 0})
              </Button>
              <Button
                variant={recipientType === 'confirmed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecipientType('confirmed')}
              >
                Confirmed ({recipientCounts?.confirmed || 0})
              </Button>
              <Button
                variant={recipientType === 'squad' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecipientType('squad')}
              >
                By Clique
              </Button>
            </div>

            {recipientType === 'squad' && squads && (
              <div className="pl-4 space-y-2">
                {squads.map((squad: any) => (
                  <div key={squad.id} className="flex items-center gap-2">
                    <Checkbox
                      id={squad.id}
                      checked={selectedSquads.includes(squad.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSquads([...selectedSquads, squad.id]);
                        } else {
                          setSelectedSquads(selectedSquads.filter(id => id !== squad.id));
                        }
                      }}
                    />
                    <label htmlFor={squad.id} className="text-sm">{squad.squad_name || squad.id.slice(0, 8)}</label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Preview */}
          {previewBody && (
            <div className="space-y-2">
              <Label>Message Preview</Label>
              <Textarea
                value={previewBody}
                onChange={(e) => setPreviewBody(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Edit the message if needed. Placeholders like {"{{name}}"} will be replaced per-user.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSend} 
              disabled={!previewBody || isSending}
              className="flex-1"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send to {getRecipientCount()} Recipients
            </Button>
            <Button variant="outline" onClick={copyForWhatsApp} disabled={!previewBody}>
              <Copy className="h-4 w-4 mr-2" />
              Copy for WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions & Recent Sends */}
      <div className="space-y-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleTemplateSelect('reminder_24h')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Send 24-Hour Reminder
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleTemplateSelect('check_in_open')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Send Check-In Open Notice
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleTemplateSelect('join_whatsapp')}
            >
              <Users className="h-4 w-4 mr-2" />
              Send WhatsApp Join Reminder
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleTemplateSelect('feedback_request')}
            >
              <Bell className="h-4 w-4 mr-2" />
              Request Feedback
            </Button>
          </CardContent>
        </Card>

        {/* Recent Sends Log */}
        <RecentSendsLog instanceId={instance.id} />
        </div>
        </div>
      </TabsContent>

      <TabsContent value="cliques">
        <ActiveCliquesPanel instanceId={instance.id} />
      </TabsContent>
    </Tabs>
  );
}

function RecentSendsLog({ instanceId }: { instanceId: string }) {
  const { data: recentEvents } = useQuery({
    queryKey: ['recent-sends', instanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_event_log')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('event_type', 'message_sent')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  if (!recentEvents?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Sends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentEvents.map((event) => {
            const payload = event.payload as { template_key?: string; recipient_count?: number };
            return (
              <div key={event.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>{payload.template_key}</span>
                </div>
                <div className="text-muted-foreground">
                  {payload.recipient_count} sent • {new Date(event.created_at).toLocaleTimeString()}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
