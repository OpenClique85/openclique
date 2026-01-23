/**
 * Instance Broadcast Modal
 * 
 * Send instance-level broadcast messages to ALL users (including unassigned)
 * for delays, venue changes, safety updates, or general announcements.
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle, Clock, MapPin, Shield, 
  Megaphone, Loader2, Send, Users
} from 'lucide-react';
import { auditLog } from '@/lib/auditLog';

type BroadcastType = 'delay' | 'venue_change' | 'safety' | 'general';

interface BroadcastTemplate {
  type: BroadcastType;
  icon: React.ReactNode;
  label: string;
  color: string;
  prefix: string;
  placeholder: string;
}

const BROADCAST_TEMPLATES: BroadcastTemplate[] = [
  {
    type: 'delay',
    icon: <Clock className="h-4 w-4" />,
    label: 'Delay Notice',
    color: 'bg-orange-500/20 text-orange-700 border-orange-500/30',
    prefix: '⏰ Time Update',
    placeholder: 'We are starting 15 minutes late due to...',
  },
  {
    type: 'venue_change',
    icon: <MapPin className="h-4 w-4" />,
    label: 'Venue Change',
    color: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
    prefix: '📍 Location Update',
    placeholder: 'New meeting point: [location]. Please head to...',
  },
  {
    type: 'safety',
    icon: <Shield className="h-4 w-4" />,
    label: 'Safety Update',
    color: 'bg-red-500/20 text-red-700 border-red-500/30',
    prefix: '🚨 Important Safety Info',
    placeholder: 'Please be aware of...',
  },
  {
    type: 'general',
    icon: <Megaphone className="h-4 w-4" />,
    label: 'General Announcement',
    color: 'bg-primary/20 text-primary border-primary/30',
    prefix: '📬 From OpenClique Team',
    placeholder: 'Quick update for everyone...',
  },
];

interface InstanceBroadcastModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  instanceTitle: string;
}

export function InstanceBroadcastModal({
  open,
  onOpenChange,
  instanceId,
  instanceTitle,
}: InstanceBroadcastModalProps) {
  const { toast } = useToast();
  const [broadcastType, setBroadcastType] = useState<BroadcastType>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Fetch all recipients (including unassigned)
  const { data: recipients } = useQuery({
    queryKey: ['broadcast-recipients', instanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_signups')
        .select('user_id, status, profiles!inner(display_name)')
        .eq('instance_id', instanceId)
        .not('status', 'in', '(dropped,no_show,cancelled)');
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const selectedTemplate = BROADCAST_TEMPLATES.find(t => t.type === broadcastType)!;

  // Send broadcast mutation
  const sendBroadcast = useMutation({
    mutationFn: async () => {
      if (!message.trim()) {
        throw new Error('Please enter a message');
      }

      const userIds = recipients?.map(r => r.user_id) || [];
      if (userIds.length === 0) {
        throw new Error('No recipients found');
      }

      // Create notifications for all users
      const fullMessage = `${selectedTemplate.prefix}\n\n${message}`;
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: 'general' as const,
        title: subject || `${instanceTitle}: ${selectedTemplate.label}`,
        body: fullMessage,
        quest_id: instanceId,
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      // Log the broadcast
      await auditLog({
        action: 'instance_broadcast_sent',
        targetTable: 'quest_instances',
        targetId: instanceId,
        newValues: {
          broadcast_type: broadcastType,
          subject: subject || selectedTemplate.label,
          recipient_count: userIds.length,
          message_preview: message.slice(0, 100),
        },
      });

      // Also log to quest_event_log if available
      try {
        await supabase.rpc('log_quest_event', {
          p_instance_id: instanceId,
          p_event_type: 'broadcast_sent' as any,
          p_actor_type: 'admin',
          p_payload: {
            broadcast_type: broadcastType,
            recipient_count: userIds.length,
          },
        });
      } catch (e) {
        // Ignore if RPC doesn't exist
      }

      return { sentCount: userIds.length };
    },
    onSuccess: (data) => {
      toast({
        title: 'Broadcast sent!',
        description: `Notified ${data.sentCount} participants`,
      });
      onOpenChange(false);
      setMessage('');
      setSubject('');
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to send broadcast',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleTypeChange = (type: BroadcastType) => {
    setBroadcastType(type);
    const template = BROADCAST_TEMPLATES.find(t => t.type === type);
    if (template && !subject) {
      setSubject(`${instanceTitle}: ${template.label}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Broadcast to All Participants
          </DialogTitle>
          <DialogDescription>
            Send an important message to ALL users signed up for this quest,
            including those not yet assigned to squads.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient count */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>{recipients?.length || 0}</strong> recipients will receive this message
            </span>
          </div>

          {/* Broadcast Type Selector */}
          <div className="space-y-2">
            <Label>Message Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {BROADCAST_TEMPLATES.map((template) => (
                <button
                  key={template.type}
                  type="button"
                  onClick={() => handleTypeChange(template.type)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors text-left ${
                    broadcastType === template.type
                      ? `${template.color} border-2`
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {template.icon}
                  <span className="text-sm font-medium">{template.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="broadcast-subject">Subject</Label>
            <Input
              id="broadcast-subject"
              placeholder={`${instanceTitle}: ${selectedTemplate.label}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="broadcast-message">Message</Label>
            <Textarea
              id="broadcast-message"
              placeholder={selectedTemplate.placeholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Message will be prefixed with: "{selectedTemplate.prefix}"
            </p>
          </div>

          {/* Preview */}
          {message && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-3 rounded-lg bg-muted text-sm">
                <p className="font-medium mb-1">
                  {subject || `${instanceTitle}: ${selectedTemplate.label}`}
                </p>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {selectedTemplate.prefix}
                  {'\n\n'}
                  {message}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => sendBroadcast.mutate()}
            disabled={!message.trim() || sendBroadcast.isPending}
          >
            {sendBroadcast.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send to {recipients?.length || 0} Participants
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
