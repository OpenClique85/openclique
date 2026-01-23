import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, Send, Copy, Loader2 } from 'lucide-react';

// Template definitions matching the edge function
const TEMPLATES = {
  quest_confirmation: {
    name: 'Quest Confirmation',
    description: 'Sent when a user is confirmed for a quest',
    subject: "🎉 You're In!",
    variables: ['display_name', 'quest_name', 'quest_date', 'quest_location', 'squad_size', 'whatsapp_link'],
    defaultVars: {
      display_name: 'Alex',
      quest_name: 'Morning Hike at Mount Bonnell',
      quest_date: 'Saturday, Feb 15 at 8:00 AM',
      quest_location: 'Mount Bonnell Trailhead',
      squad_size: '4-6',
      whatsapp_link: 'https://chat.whatsapp.com/example',
    },
  },
  quest_reminder: {
    name: 'Quest Reminder',
    description: 'Sent 24h before or day-of the quest',
    subject: '⏰ Quest Reminder!',
    variables: ['display_name', 'quest_name', 'quest_date', 'quest_location', 'time_until'],
    defaultVars: {
      display_name: 'Alex',
      quest_name: 'Morning Hike at Mount Bonnell',
      quest_date: 'Tomorrow at 8:00 AM',
      quest_location: 'Mount Bonnell Trailhead',
      time_until: 'tomorrow',
    },
  },
  quest_cancelled: {
    name: 'Quest Cancelled',
    description: 'Sent when a quest is cancelled',
    subject: 'Quest Update',
    variables: ['display_name', 'quest_name', 'reason'],
    defaultVars: {
      display_name: 'Alex',
      quest_name: 'Morning Hike at Mount Bonnell',
      reason: 'Inclement weather forecast',
    },
  },
  quest_approved: {
    name: 'Quest Approved (Creator)',
    description: 'Sent to creators when their quest is approved',
    subject: '🎉 Your Quest is Approved!',
    variables: ['creator_name', 'quest_title', 'is_published', 'quest_url'],
    defaultVars: {
      creator_name: 'Jordan',
      quest_title: 'Sunset Kayak Adventure',
      is_published: 'true',
      quest_url: 'https://openclique.lovable.app/quests/sunset-kayak',
    },
  },
  quest_needs_changes: {
    name: 'Quest Needs Changes (Creator)',
    description: 'Sent to creators with revision feedback',
    subject: '📝 Quest Feedback',
    variables: ['creator_name', 'quest_title', 'admin_notes', 'edit_url'],
    defaultVars: {
      creator_name: 'Jordan',
      quest_title: 'Sunset Kayak Adventure',
      admin_notes: 'Please add more details about the meeting point and any equipment participants should bring.',
      edit_url: 'https://openclique.lovable.app/creator/quests',
    },
  },
  quest_rejected: {
    name: 'Quest Rejected (Creator)',
    description: 'Sent when a quest submission is declined',
    subject: 'Quest Update',
    variables: ['creator_name', 'quest_title', 'admin_notes'],
    defaultVars: {
      creator_name: 'Jordan',
      quest_title: 'Extreme Cliff Diving',
      admin_notes: 'This activity exceeds our safety guidelines for community quests.',
    },
  },
  support_reply: {
    name: 'Support Reply',
    description: 'Sent when admin responds to a support ticket',
    subject: '📬 Support Update',
    variables: ['display_name', 'ticket_subject', 'message', 'ticket_url'],
    defaultVars: {
      display_name: 'Alex',
      ticket_subject: 'Question about squad matching',
      message: 'Great question! Squad matching happens 48 hours before the quest based on your profile preferences and past quest history.',
      ticket_url: 'https://openclique.lovable.app/support/ticket/123',
    },
  },
  admin_dm: {
    name: 'Admin Direct Message',
    description: 'Personal message from admin to user',
    subject: '💬 Message from OpenClique',
    variables: ['display_name', 'subject', 'message', 'app_url'],
    defaultVars: {
      display_name: 'Alex',
      subject: 'Welcome to OpenClique!',
      message: 'We noticed you just completed your first quest - congrats! If you have any questions, just reply here.',
      app_url: 'https://openclique.lovable.app/notifications',
    },
  },
};

type TemplateKey = keyof typeof TEMPLATES;

export function TemplatePreview() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('quest_confirmation');
  const [variables, setVariables] = useState<Record<string, string>>(
    TEMPLATES.quest_confirmation.defaultVars
  );
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const template = TEMPLATES[selectedTemplate];

  const handleTemplateChange = (key: TemplateKey) => {
    setSelectedTemplate(key);
    setVariables(TEMPLATES[key].defaultVars);
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  const generatePreview = () => {
    // Generate HTML preview (simplified - actual rendering happens server-side)
    const html = generateTemplateHtml(selectedTemplate, variables);
    setPreviewHtml(html);
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({ variant: 'destructive', title: 'Please enter a test email address' });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject: `[TEST] ${template.subject}`,
          template: selectedTemplate,
          variables,
        },
      });

      if (error) throw error;

      toast({ title: 'Test email sent!', description: `Sent to ${testEmail}` });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to send test email',
        description: error.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  const copyHtml = () => {
    const html = generateTemplateHtml(selectedTemplate, variables);
    navigator.clipboard.writeText(html);
    toast({ title: 'HTML copied to clipboard' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Template Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Template Editor</CardTitle>
          <CardDescription>Preview and test email templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={(v) => handleTemplateChange(v as TemplateKey)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TEMPLATES).map(([key, t]) => (
                  <SelectItem key={key} value={key}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
          </div>

          <div className="space-y-3">
            <Label>Variables</Label>
            {template.variables.map((varKey) => (
              <div key={varKey}>
                <Label className="text-xs text-muted-foreground">
                  {`{{${varKey}}}`}
                </Label>
                {varKey === 'message' || varKey === 'admin_notes' ? (
                  <Textarea
                    value={variables[varKey] || ''}
                    onChange={(e) => handleVariableChange(varKey, e.target.value)}
                    rows={3}
                  />
                ) : (
                  <Input
                    value={variables[varKey] || ''}
                    onChange={(e) => handleVariableChange(varKey, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={generatePreview} variant="outline" className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={copyHtml} variant="outline" size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="pt-4 border-t space-y-2">
            <Label>Send Test Email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button onClick={sendTestEmail} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Subject: {template.subject}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Rendered</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <div
                className="border rounded-lg p-4 bg-white min-h-[400px]"
                dangerouslySetInnerHTML={{
                  __html: previewHtml || generateTemplateHtml(selectedTemplate, variables),
                }}
              />
            </TabsContent>
            <TabsContent value="html">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[400px]">
                {previewHtml || generateTemplateHtml(selectedTemplate, variables)}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper to generate template HTML (client-side approximation)
function generateTemplateHtml(template: TemplateKey, vars: Record<string, string>): string {
  const escapeHtml = (s: string) =>
    s?.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';

  const baseStyle = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;`;

  switch (template) {
    case 'quest_confirmation':
      return `
        <div style="${baseStyle}">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #14b8a6; margin: 0;">🎉 You're In!</h1>
          </div>
          <p style="font-size: 16px; color: #333;">Hey ${escapeHtml(vars.display_name || 'Adventurer')}!</p>
          <p style="font-size: 16px; color: #333;">Great news — you've been confirmed for <strong>${escapeHtml(vars.quest_name || 'your quest')}</strong>!</p>
          <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>📅 When:</strong> ${escapeHtml(vars.quest_date || 'TBD')}</p>
            <p style="margin: 0 0 10px 0;"><strong>📍 Where:</strong> ${escapeHtml(vars.quest_location || 'TBD')}</p>
            <p style="margin: 0;"><strong>👥 Squad Size:</strong> ${escapeHtml(vars.squad_size || '3-6')} people</p>
          </div>
          ${vars.whatsapp_link ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${escapeHtml(vars.whatsapp_link)}" style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                💬 Join Your Squad's WhatsApp
              </a>
            </div>
          ` : ''}
          <p style="font-size: 14px; color: #666;">See you there!</p>
          <p style="font-size: 14px; color: #666;">— The OpenClique Team</p>
        </div>
      `;

    case 'quest_reminder':
      return `
        <div style="${baseStyle}">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f59e0b; margin: 0;">⏰ Quest Reminder!</h1>
          </div>
          <p style="font-size: 16px; color: #333;">Hey ${escapeHtml(vars.display_name || 'Adventurer')}!</p>
          <p style="font-size: 16px; color: #333;">Just a friendly reminder that <strong>${escapeHtml(vars.quest_name || 'your quest')}</strong> is coming up ${escapeHtml(vars.time_until || 'soon')}!</p>
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>📅 When:</strong> ${escapeHtml(vars.quest_date || 'TBD')}</p>
            <p style="margin: 0;"><strong>📍 Where:</strong> ${escapeHtml(vars.quest_location || 'TBD')}</p>
          </div>
          <p style="font-size: 14px; color: #666;">Can't make it? Please let us know ASAP so we can fill your spot.</p>
          <p style="font-size: 14px; color: #666;">— The OpenClique Team</p>
        </div>
      `;

    case 'support_reply':
      return `
        <div style="${baseStyle}">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #14b8a6; margin: 0;">📬 Support Update</h1>
          </div>
          <p style="font-size: 16px; color: #333;">Hey ${escapeHtml(vars.display_name || 'there')}!</p>
          <p style="font-size: 16px; color: #333;">We've responded to your support ticket: <strong>"${escapeHtml(vars.ticket_subject || 'Your request')}"</strong></p>
          <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Our Reply:</p>
            <p style="margin: 0; font-size: 14px; white-space: pre-wrap;">${escapeHtml(vars.message || '')}</p>
          </div>
          ${vars.ticket_url ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${escapeHtml(vars.ticket_url)}" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View Full Thread
              </a>
            </div>
          ` : ''}
          <p style="font-size: 14px; color: #666;">— The OpenClique Support Team</p>
        </div>
      `;

    default:
      return `<div style="${baseStyle}"><p>Template preview for: ${template}</p></div>`;
  }
}
