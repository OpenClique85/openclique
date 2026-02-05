/**
 * Run of Show Controls
 * 
 * Template-based messaging panel for operators to send notifications at key moments.
 * Features clickable clique cards and direct chat messaging.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { 
  Send, Users, Clock, Bell, 
  CheckCircle, Loader2, MessageCircle, Eye, Radio, Bot, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { SquadChatViewer } from '@/components/admin/SquadChatViewer';
import { SQUAD_STATUS_LABELS, SQUAD_STATUS_STYLES, SquadStatus } from '@/lib/squadLifecycle';
import { EndQuestDialog } from './EndQuestDialog';
import { ProofGalleryPanel } from './ProofGalleryPanel';
import { QuestObjectivesPanel } from './QuestObjectivesPanel';
import { FeedbackExportPanel } from './FeedbackExportPanel';

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

interface ActiveClique {
  id: string;
  squad_name: string;
  status: SquadStatus;
  memberCount: number;
  lastActivity: string | null;
  messageCount: number;
}

interface RunOfShowControlsProps {
  instance: QuestInstance;
}

export function RunOfShowControls({ instance }: RunOfShowControlsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [targetClique, setTargetClique] = useState<string>('all'); // 'all' or clique ID
  const [previewBody, setPreviewBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendAs, setSendAs] = useState<'admin' | 'buggs'>('buggs');
  const [selectedClique, setSelectedClique] = useState<{ id: string; name: string } | null>(null);

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

  // Fetch all cliques for this instance (all statuses except cancelled)
  const { data: cliques = [], isLoading: cliquesLoading } = useQuery({
    queryKey: ['instance-cliques-ros', instance.id],
    queryFn: async () => {
      const { data: squadsData, error: squadsError } = await supabase
        .from('quest_squads')
        .select('id, squad_name, status')
        .eq('instance_id', instance.id)
        .neq('status', 'cancelled');
      
      if (squadsError) throw squadsError;
      
      const enrichedCliques: ActiveClique[] = await Promise.all(
        (squadsData || []).map(async (squad) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from('squad_members')
            .select('*', { count: 'exact', head: true })
            .eq('squad_id', squad.id)
            .neq('status', 'dropped');
          
          // Get message count and last activity
          const { data: messages, count: messageCount } = await supabase
            .from('squad_chat_messages')
            .select('created_at', { count: 'exact' })
            .eq('squad_id', squad.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          return {
            id: squad.id,
            squad_name: squad.squad_name || `Clique ${squad.id.slice(0, 4)}`,
            status: (squad.status || 'confirmed') as SquadStatus,
            memberCount: memberCount || 0,
            lastActivity: messages?.[0]?.created_at || null,
            messageCount: messageCount || 0,
          };
        })
      );
      
      return enrichedCliques;
    },
    enabled: !!instance.id,
    refetchInterval: 30000,
  });

  // Handle template selection
  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = templates?.find(t => t.template_key === templateKey);
    if (template) {
      let body = template.body;
      body = body.replace(/\{\{quest_title\}\}/g, instance.title);
      body = body.replace(/\{\{meeting_point\}\}/g, instance.meeting_point_name || 'TBD');
      body = body.replace(/\{\{start_time\}\}/g, instance.start_time?.slice(0, 5) || 'TBD');
      body = body.replace(/\{\{what_to_bring\}\}/g, instance.what_to_bring || '');
      body = body.replace(/\{\{quest_card_url\}\}/g, `${window.location.origin}/quest-card/${instance.quest_card_token}`);
      setPreviewBody(body);
    }
  };

  // Send message to clique chat(s)
  const sendToChatMutation = useMutation({
    mutationFn: async () => {
      if (!user || !previewBody.trim()) throw new Error('Invalid message');

      const targetSquadIds = targetClique === 'all' 
        ? cliques.map(c => c.id) 
        : [targetClique];

      // Insert message into each clique's chat
      const insertPromises = targetSquadIds.map(squadId =>
        supabase
          .from('squad_chat_messages')
          .insert({
            squad_id: squadId,
            sender_id: user.id,
            message: previewBody,
            sender_type: sendAs,
          })
      );

      const results = await Promise.all(insertPromises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error(`Failed to send to ${errors.length} clique(s)`);
      }

      // Log the event
      await supabase.rpc('log_quest_event', {
        p_instance_id: instance.id,
        p_event_type: 'message_sent' as any,
        p_actor_type: 'admin',
        p_payload: {
          template_key: selectedTemplate,
          target: targetClique === 'all' ? 'broadcast' : targetClique,
          clique_count: targetSquadIds.length,
          send_as: sendAs,
        }
      });

      return targetSquadIds.length;
    },
    onSuccess: (count) => {
      toast.success(`Message sent to ${count} clique${count > 1 ? 's' : ''}!`);
      setSelectedTemplate('');
      setPreviewBody('');
      queryClient.invalidateQueries({ queryKey: ['instance-cliques-ros', instance.id] });
    },
    onError: (err: any) => {
      toast.error('Failed to send message', { description: err.message });
    },
  });

  const handleSend = async () => {
    if (!selectedTemplate || !previewBody) {
      toast.error('Select a template and compose your message first');
      return;
    }
    if (cliques.length === 0) {
      toast.error('No cliques available to message');
      return;
    }
    setIsSending(true);
    await sendToChatMutation.mutateAsync();
    setIsSending(false);
  };

  // Group templates by category
  const templatesByCategory = templates?.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, MessageTemplate[]>) || {};

  const getTargetCount = () => {
    if (targetClique === 'all') return cliques.length;
    return 1;
  };

  return (
    <div className="space-y-6">
      {/* Cliques Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Cliques ({cliques.length})
          </CardTitle>
          <CardDescription>
            Click a clique to view and moderate their chat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cliquesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : cliques.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No cliques formed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {cliques.map((clique) => {
                const statusStyles = SQUAD_STATUS_STYLES[clique.status] || SQUAD_STATUS_STYLES.confirmed;
                
                return (
                  <button
                    key={clique.id}
                    onClick={() => setSelectedClique({ id: clique.id, name: clique.squad_name })}
                    className="p-4 border rounded-lg text-left hover:border-primary hover:bg-muted/50 transition-all group focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm truncate pr-2">
                        {clique.squad_name}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`${statusStyles.bg} ${statusStyles.text} border ${statusStyles.border} text-[10px] shrink-0`}
                      >
                        {SQUAD_STATUS_LABELS[clique.status]?.slice(0, 3) || clique.status.slice(0, 3)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        <span>{clique.memberCount} members</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="h-3 w-3" />
                        <span>{clique.messageCount} messages</span>
                      </div>
                      {clique.lastActivity && (
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <Clock className="h-3 w-3" />
                          <span>Active {format(new Date(clique.lastActivity), 'h:mm a')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 flex items-center justify-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="h-3 w-3" />
                      View Chat
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Composer */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send to Clique Chats
            </CardTitle>
            <CardDescription>
              Compose a message from a template and send directly to clique chats
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

            {/* Target Clique Selection */}
            <div className="space-y-2">
              <Label>Send To</Label>
              <Select value={targetClique} onValueChange={setTargetClique}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4" />
                      Broadcast to All Cliques ({cliques.length})
                    </div>
                  </SelectItem>
                  {cliques.map(clique => (
                    <SelectItem key={clique.id} value={clique.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {clique.squad_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Send As Selection */}
            <div className="space-y-2">
              <Label>Send As</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={sendAs === 'buggs' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSendAs('buggs')}
                  className="flex-1"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Buggs 🐰
                </Button>
                <Button
                  type="button"
                  variant={sendAs === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSendAs('admin')}
                  className="flex-1"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </div>
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
                  Edit the message if needed before sending.
                </p>
              </div>
            )}

            {/* Send Button */}
            <Button 
              onClick={handleSend} 
              disabled={!previewBody || isSending || cliques.length === 0}
              className="w-full"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send to {getTargetCount()} Clique{getTargetCount() !== 1 ? 's' : ''}
            </Button>
          </CardContent>
        </Card>

        {/* Objectives + Actions Column */}
        <div className="space-y-6">
          {/* Quest Objectives */}
          <QuestObjectivesPanel objectives={instance.objectives} />
          
          {/* End Quest Action */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quest Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EndQuestDialog
                instanceId={instance.id}
                instanceTitle={instance.title}
                cliques={cliques.map(c => ({ id: c.id, memberCount: c.memberCount }))}
              />
              
              <div className="text-xs text-muted-foreground">
                Ends quest, marks it complete, and sends feedback requests to all {cliques.reduce((sum, c) => sum + c.memberCount, 0)} participants.
              </div>
            </CardContent>
          </Card>

          {/* Feedback Export */}
          <FeedbackExportPanel 
            instanceId={instance.id}
            questId={instance.quest_id}
            title="Export Instance Data"
          />

          {/* Recent Sends Log */}
          <RecentSendsLog instanceId={instance.id} />
        </div>
      </div>

      {/* Proof Gallery */}
      <ProofGalleryPanel 
        instanceId={instance.id} 
        cliques={cliques.map(c => ({ id: c.id, squad_name: c.squad_name }))}
      />

      {/* Chat Viewer Sheet */}
      <Sheet open={!!selectedClique} onOpenChange={(open) => !open && setSelectedClique(null)}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {selectedClique?.name} Chat
            </SheetTitle>
            <SheetDescription>
              Monitor and moderate the clique's group chat
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            {selectedClique && (
              <SquadChatViewer 
                squadId={selectedClique.id} 
                squadName={selectedClique.name} 
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
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
            const payload = event.payload as { template_key?: string; clique_count?: number; target?: string };
            return (
              <div key={event.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>{payload.template_key || 'Custom'}</span>
                  <Badge variant="outline" className="text-xs">
                    {payload.target === 'broadcast' ? 'All' : '1 clique'}
                  </Badge>
                </div>
                <div className="text-muted-foreground text-xs">
                  {format(new Date(event.created_at), 'h:mm a')}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
