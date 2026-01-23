/**
 * Squad Detail Modal
 * 
 * Shows detailed squad information including formation reasoning,
 * member list, and admin controls for messaging and reassignment.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users, MessageSquare, UserMinus, Edit2, Check, X,
  Info, Sparkles, Link2, Copy
} from 'lucide-react';
import { auditLog } from '@/lib/auditLog';
import type { Enums } from '@/integrations/supabase/types';

type NotificationType = Enums<'notification_type'>;

interface SquadMember {
  id: string;
  user_id: string;
  display_name: string;
  status: string;
}

interface FormationReason {
  primary_factor: 'referral_cluster' | 'compatibility' | 'fill_remaining';
  referral_bonds: number;
  compatibility_breakdown?: {
    vibe_similarity: number;
    age_proximity: number;
    area_proximity: number;
    interest_overlap: number;
    context_overlap: number;
  };
  member_reasoning?: {
    user_id: string;
    added_because: string;
  }[];
}

interface SquadDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  squadId: string;
  instanceId: string;
  instanceTitle: string;
}

type MessageType = 'announcement' | 'instruction' | 'reminder' | 'safety';

const MESSAGE_TYPE_CONFIG: Record<MessageType, { label: string; icon: string; prefix: string }> = {
  announcement: { label: 'Announcement', icon: '📢', prefix: '[Announcement]' },
  instruction: { label: 'Instruction', icon: '📋', prefix: '[Instruction]' },
  reminder: { label: 'Reminder', icon: '⏰', prefix: '[Reminder]' },
  safety: { label: 'Safety/Ops', icon: '🛡️', prefix: '[Safety Alert]' },
};

export function SquadDetailModal({
  open,
  onOpenChange,
  squadId,
  instanceId,
  instanceTitle,
}: SquadDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('announcement');
  const [messageContent, setMessageContent] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Fetch squad details
  const { data: squad, isLoading } = useQuery({
    queryKey: ['squad-detail', squadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_squads')
        .select(`
          id,
          squad_name,
          whatsapp_link,
          formation_reason,
          compatibility_score,
          referral_bonds,
          created_at
        `)
        .eq('id', squadId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!squadId,
  });

  // Fetch squad members with profile info
  const { data: members } = useQuery({
    queryKey: ['squad-members-detail', squadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('squad_members')
        .select(`
          id,
          user_id,
          status,
          profiles:user_id (
            display_name,
            email
          )
        `)
        .eq('squad_id', squadId);
      if (error) throw error;
      return (data || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        status: m.status,
        display_name: m.profiles?.display_name || 'Unknown',
      })) as SquadMember[];
    },
    enabled: open && !!squadId,
  });

  // Update squad name mutation
  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('quest_squads')
        .update({ squad_name: name })
        .eq('id', squadId);
      if (error) throw error;

      await auditLog({
        action: 'squad_renamed',
        targetTable: 'quest_squads',
        targetId: squadId,
        oldValues: { squad_name: squad?.squad_name },
        newValues: { squad_name: name },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squad-detail', squadId] });
      queryClient.invalidateQueries({ queryKey: ['instance-squads-detail'] });
      setIsEditingName(false);
      toast({ title: 'Squad renamed' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to rename squad', description: err.message, variant: 'destructive' });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      recipientIds, 
      content, 
      type 
    }: { 
      recipientIds: string[]; 
      content: string; 
      type: MessageType;
    }) => {
      const config = MESSAGE_TYPE_CONFIG[type];
      
      // Create notifications for all recipients using 'general' type
      const notifications = recipientIds.map((userId) => ({
        user_id: userId,
        type: 'general' as NotificationType,
        title: `${config.icon} ${config.label} for ${squad?.squad_name}`,
        body: `📬 From OpenClique Team\n${config.prefix} ${content}`,
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;

      // Log the message event
      await auditLog({
        action: 'admin_message_sent',
        targetTable: 'quest_squads',
        targetId: squadId,
        newValues: {
          message_type: type,
          recipient_count: recipientIds.length,
          content_preview: content.slice(0, 100),
        },
      });
    },
    onSuccess: () => {
      setMessageContent('');
      setSelectedMemberId(null);
      toast({ title: 'Message sent' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to send message', description: err.message, variant: 'destructive' });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const member = members?.find((m) => m.id === memberId);
      
      // Delete from squad_members
      const { error } = await supabase
        .from('squad_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;

      await auditLog({
        action: 'squad_member_removed',
        targetTable: 'squad_members',
        targetId: memberId,
        oldValues: { squad_id: squadId, user_id: member?.user_id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squad-members-detail', squadId] });
      queryClient.invalidateQueries({ queryKey: ['instance-squads-detail'] });
      queryClient.invalidateQueries({ queryKey: ['instance-unassigned'] });
      toast({ title: 'Member removed from squad' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to remove member', description: err.message, variant: 'destructive' });
    },
  });

  const handleSendSquadMessage = () => {
    if (!messageContent.trim() || !members) return;
    const recipientIds = members.map((m) => m.user_id);
    sendMessageMutation.mutate({ recipientIds, content: messageContent, type: messageType });
  };

  const handleSendIndividualMessage = (userId: string) => {
    if (!messageContent.trim()) return;
    sendMessageMutation.mutate({ recipientIds: [userId], content: messageContent, type: messageType });
  };

  const copyWhatsAppLink = () => {
    if (squad?.whatsapp_link) {
      navigator.clipboard.writeText(squad.whatsapp_link);
      toast({ title: 'WhatsApp link copied' });
    }
  };

  const formationReason = squad?.formation_reason as unknown as FormationReason | null;

  const getFormationExplanation = (): string => {
    if (!formationReason) return 'No formation data available';
    
    switch (formationReason.primary_factor) {
      case 'referral_cluster':
        return `This squad was formed primarily because ${formationReason.referral_bonds} members knew each other through referrals.`;
      case 'compatibility':
        return 'This squad was formed based on compatibility matching across shared preferences and location.';
      case 'fill_remaining':
        return 'This squad was formed to include remaining users who couldn\'t be matched to other groups.';
      default:
        return 'Squad was formed using the default algorithm.';
    }
  };

  const getCompatibilityBreakdown = () => {
    if (!formationReason?.compatibility_breakdown) return null;
    const breakdown = formationReason.compatibility_breakdown;
    return [
      { label: 'Vibe Match', value: Math.round(breakdown.vibe_similarity * 100) },
      { label: 'Age Proximity', value: Math.round(breakdown.age_proximity * 100) },
      { label: 'Area Proximity', value: Math.round(breakdown.area_proximity * 100) },
      { label: 'Interest Overlap', value: Math.round(breakdown.interest_overlap * 100) },
      { label: 'Context Match', value: Math.round(breakdown.context_overlap * 100) },
    ];
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => updateNameMutation.mutate(newName)}
                  disabled={updateNameMutation.isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setIsEditingName(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                {squad?.squad_name}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => {
                    setNewName(squad?.squad_name || '');
                    setIsEditingName(true);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members ({members?.length || 0})</TabsTrigger>
            <TabsTrigger value="message">Message</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">{members?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Members</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">
                    {squad?.compatibility_score ? Math.round(Number(squad.compatibility_score) * 100) : '—'}%
                  </div>
                  <div className="text-xs text-muted-foreground">Compatibility</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">{squad?.referral_bonds || 0}</div>
                  <div className="text-xs text-muted-foreground">Referral Bonds</div>
                </CardContent>
              </Card>
            </div>

            {/* Formation Reasoning */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Formation Reasoning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {getFormationExplanation()}
                </p>
                
                {getCompatibilityBreakdown() && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Compatibility Breakdown:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {getCompatibilityBreakdown()!.map((item) => (
                        <div key={item.label} className="text-center">
                          <div className="text-sm font-medium">{item.value}%</div>
                          <div className="text-[10px] text-muted-foreground">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* WhatsApp Link */}
            {squad?.whatsapp_link && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    WhatsApp Group
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Input
                      value={squad.whatsapp_link}
                      readOnly
                      className="text-xs"
                    />
                    <Button size="icon" variant="outline" onClick={copyWhatsAppLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <div className="space-y-2">
              {members?.map((member) => (
                <Card key={member.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {member.display_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.display_name}</p>
                          <Badge variant="outline" className="text-xs">
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedMemberId(member.user_id);
                            setActiveTab('message');
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Remove ${member.display_name} from this squad?`)) {
                              removeMemberMutation.mutate(member.id);
                            }
                          }}
                          disabled={removeMemberMutation.isPending}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Member-specific formation reason */}
                    {formationReason?.member_reasoning?.find(r => r.user_id === member.user_id) && (
                      <p className="text-xs text-muted-foreground mt-2 pl-11">
                        <Info className="h-3 w-3 inline mr-1" />
                        {formationReason.member_reasoning.find(r => r.user_id === member.user_id)?.added_because}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="message" className="mt-4 space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Message Type</Label>
                <Select value={messageType} onValueChange={(v) => setMessageType(v as MessageType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MESSAGE_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.icon} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">
                  {selectedMemberId
                    ? `Message to ${members?.find(m => m.user_id === selectedMemberId)?.display_name}`
                    : 'Message to entire squad'
                  }
                </Label>
                {selectedMemberId && (
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-2 h-auto p-0"
                    onClick={() => setSelectedMemberId(null)}
                  >
                    Switch to squad message
                  </Button>
                )}
                <Textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type your message..."
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground flex-1">
                  📬 Messages are prefixed with "From OpenClique Team"
                </p>
                <Button
                  onClick={() => {
                    if (selectedMemberId) {
                      handleSendIndividualMessage(selectedMemberId);
                    } else {
                      handleSendSquadMessage();
                    }
                  }}
                  disabled={!messageContent.trim() || sendMessageMutation.isPending}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send {selectedMemberId ? 'to Member' : 'to Squad'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
