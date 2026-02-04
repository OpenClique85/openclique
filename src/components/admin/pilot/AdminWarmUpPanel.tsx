/**
 * Admin Warm-Up Panel
 * 
 * Full admin view for managing a clique's warm-up session.
 * Includes chat transcript, member progress, and admin controls.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  MessageCircle,
  Send,
  CheckCircle2,
  XCircle,
  Unlock,
  Lock,
  AlertTriangle,
  SlidersHorizontal,
  Loader2,
  ThermometerSun,
  Bot,
  ShieldCheck,
  Bell,
  UserCog,
  Mail,
  Sparkles,
} from 'lucide-react';
import { SQUAD_STATUS_LABELS, SQUAD_STATUS_STYLES, SquadStatus, calculateWarmUpProgress } from '@/lib/squadLifecycle';
import { auditLog } from '@/lib/auditLog';

interface AdminWarmUpPanelProps {
  cliqueId: string;
  onClose?: () => void;
}

interface CliqueMember {
  id: string;
  user_id: string;
  status: string;
  prompt_response: string | null;
  readiness_confirmed_at: string | null;
  warm_up_progress: Record<string, unknown>;
  clique_role: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface ChatMessage {
  id: string;
  squad_id: string;
  sender_id: string;
  message: string;
  sender_type: 'user' | 'admin' | 'buggs' | 'system';
  created_at: string;
}

interface CliqueData {
  id: string;
  squad_name: string;
  status: SquadStatus;
  instance_id: string;
  instance?: {
    id: string;
    title: string;
    scheduled_date: string;
  } | null;
}

export function AdminWarmUpPanel({ cliqueId, onClose }: AdminWarmUpPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [adminMessage, setAdminMessage] = useState('');
  const [sendAs, setSendAs] = useState<'admin' | 'buggs'>('buggs');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState<{ open: boolean; memberId: string; memberName: string }>({ open: false, memberId: '', memberName: '' });
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [manualProgress, setManualProgress] = useState(0);
  const [showIcebreakerDialog, setShowIcebreakerDialog] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<{ id: string; name: string; body: string } | null>(null);
  const [customIcebreaker, setCustomIcebreaker] = useState('');

  // Fetch clique data
  const { data: clique, isLoading: cliqueLoading } = useQuery({
    queryKey: ['admin-clique-warmup', cliqueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_squads')
        .select('id, squad_name, status, instance_id')
        .eq('id', cliqueId)
        .single();
      
      if (error) throw error;

      // Fetch instance info
      const { data: instance } = await supabase
        .from('quest_instances')
        .select('id, title, scheduled_date')
        .eq('id', data.instance_id)
        .single();

      return {
        id: data.id,
        squad_name: data.squad_name,
        status: (data.status || 'confirmed') as SquadStatus,
        instance_id: data.instance_id,
        instance,
      } as CliqueData;
    },
    enabled: !!cliqueId,
  });

  // Fetch members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['admin-clique-members', cliqueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('squad_members')
        .select('*')
        .eq('squad_id', cliqueId);
      
      if (error) throw error;

      // Fetch profiles
      const userIds = (data as { user_id: string }[]).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const profileMap = new Map(
        profiles?.map(p => [p.id, { display_name: p.display_name }]) || []
      );

      return (data as unknown[]).map((m: unknown) => {
        const member = m as Record<string, unknown>;
        const userId = member.user_id as string;
        const profile = profileMap.get(userId);
        return {
          id: member.id as string,
          user_id: userId,
          status: member.status as string,
          prompt_response: member.prompt_response as string | null,
          readiness_confirmed_at: member.readiness_confirmed_at as string | null,
          warm_up_progress: (member.warm_up_progress as Record<string, unknown>) || {},
          clique_role: member.clique_role as string | null,
          display_name: profile?.display_name || null,
          avatar_url: null,
        };
      }) as CliqueMember[];
    },
    enabled: !!cliqueId,
  });

  // Fetch warm-up prompts from message_templates
  const { data: warmUpPrompts = [] } = useQuery({
    queryKey: ['warm-up-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('id, name, body')
        .eq('category', 'warm_up');
      
      if (error) return [];
      return data as Array<{ id: string; name: string; body: string }>;
    },
  });

  // Fetch chat messages
  const { data: messages = [] } = useQuery({
    queryKey: ['admin-clique-chat', cliqueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('squad_chat_messages' as 'quest_ratings')
        .select('*')
        .eq('squad_id' as 'quest_id', cliqueId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data as unknown as ChatMessage[]) || [];
    },
    enabled: !!cliqueId,
  });

  // Subscribe to realtime chat
  useEffect(() => {
    if (!cliqueId) return;

    const channel = supabase
      .channel(`admin-clique-chat-${cliqueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'squad_chat_messages',
          filter: `squad_id=eq.${cliqueId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-clique-chat', cliqueId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cliqueId, queryClient]);

  // Calculate progress
  const progress = calculateWarmUpProgress(
    members.map(m => ({
      prompt_response: m.prompt_response,
      readiness_confirmed_at: m.readiness_confirmed_at,
      status: m.status,
    })),
    100 // Default to 100% required
  );

  // Send admin message to chat (as BUGGS or Admin)
  const sendAdminMessage = useMutation({
    mutationFn: async ({ message, asType = 'buggs' }: { message: string; asType?: 'admin' | 'buggs' | 'system' }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('squad_chat_messages')
        .insert({
          squad_id: cliqueId,
          sender_id: user.id,
          message,
          sender_type: asType,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setAdminMessage('');
      toast.success('Message sent to clique');
      queryClient.invalidateQueries({ queryKey: ['admin-clique-chat', cliqueId] });
    },
    onError: (error) => {
      toast.error('Failed to send message', { description: error.message });
    },
  });

  // Update clique status
  const updateStatus = useMutation({
    mutationFn: async ({ status, notes }: { status: SquadStatus; notes?: string }) => {
      const { error } = await supabase
        .from('quest_squads')
        .update({ 
          status, 
          approval_notes: notes,
          ...(status === 'approved' && { approved_at: new Date().toISOString(), approved_by: user?.id }),
        } as Record<string, unknown>)
        .eq('id', cliqueId);
      
      if (error) throw error;

      // Notify members if approved
      if (status === 'approved') {
        await supabase.functions.invoke('notify-clique-members', {
          body: {
            squad_id: cliqueId,
            notification_type: 'clique_approved',
            title: 'Clique Approved!',
            body: 'Your clique has been approved. Quest instructions are now unlocked!',
            metadata: { instance_id: clique?.instance_id },
          },
        });
      }

      await auditLog({
        action: `clique_status_${status}`,
        targetTable: 'quest_squads',
        targetId: cliqueId,
        newValues: { status, notes },
      });
    },
    onSuccess: (_, variables) => {
      toast.success(`Clique ${variables.status === 'approved' ? 'approved' : 'updated'}!`);
      queryClient.invalidateQueries({ queryKey: ['admin-clique-warmup', cliqueId] });
      queryClient.invalidateQueries({ queryKey: ['instance-cliques-detail'] });
      queryClient.invalidateQueries({ queryKey: ['instance-squads-warmup'] });
      setShowApproveDialog(false);
      setApprovalNotes('');
    },
    onError: (error) => {
      toast.error('Failed to update clique', { description: error.message });
    },
  });

  // Admin override member progress
  const overrideMemberProgress = useMutation({
    mutationFn: async ({ memberId, confirmed }: { memberId: string; confirmed: boolean }) => {
      const { error } = await supabase
        .from('squad_members')
        .update({
          readiness_confirmed_at: confirmed ? new Date().toISOString() : null,
          prompt_response: confirmed ? '[Admin Override]' : null,
        } as Record<string, unknown>)
        .eq('id', memberId);
      
      if (error) throw error;

      await auditLog({
        action: 'admin_override_member_progress',
        targetTable: 'squad_members',
        targetId: memberId,
        newValues: { confirmed },
      });
    },
    onSuccess: () => {
      toast.success('Member progress updated');
      queryClient.invalidateQueries({ queryKey: ['admin-clique-members', cliqueId] });
    },
    onError: (error) => {
      toast.error('Failed to update member', { description: error.message });
    },
  });

  const handleSendMessage = () => {
    if (!adminMessage.trim()) return;
    sendAdminMessage.mutate({ message: adminMessage.trim(), asType: sendAs });
  };

  // Ready Check action
  const initiateReadyCheck = async () => {
    // Send ready check message as system
    await sendAdminMessage.mutateAsync({
      message: '🔔 **READY CHECK!** Are you ready to begin? React with ✅ to confirm!',
      asType: 'system',
    });
    toast.success('Ready Check sent to clique');
  };

  // Send Ice-Breaker prompt action
  const sendIcebreakerPrompt = async (promptBody: string) => {
    await sendAdminMessage.mutateAsync({
      message: `🎯 **Ice-Breaker Time!**\n\n${promptBody}\n\n💬 *Reply in the chat to share your answer!*`,
      asType: 'buggs',
    });
    setShowIcebreakerDialog(false);
    setSelectedPrompt(null);
    setCustomIcebreaker('');
    toast.success('Ice-Breaker prompt sent to clique!');
  };

  // Role label mapping for display
  const ROLE_LABELS: Record<string, string> = {
    navigator: 'Navigator',
    vibe_curator: 'Vibe Curator',
    timekeeper: 'Timekeeper',
    archivist: 'Archivist',
  };

  // Assign role to member
  const assignRole = useMutation({
    mutationFn: async ({ memberId, role, memberName }: { memberId: string; role: string; memberName: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Update the member's role using the proper clique_role column
      const { error: memberError } = await supabase
        .from('squad_members')
        .update({
          clique_role: role,
          role_assigned_at: new Date().toISOString(),
          role_assigned_by: user.id,
        })
        .eq('id', memberId);
      
      if (memberError) throw memberError;
      
      // Post role assignment notification to chat with human-readable label
      const roleLabel = ROLE_LABELS[role] || role;
      await supabase
        .from('squad_chat_messages')
        .insert({
          squad_id: cliqueId,
          sender_id: user.id,
          message: `🎭 **Role Assigned:** ${memberName} has been assigned as **${roleLabel}**!`,
          sender_type: 'system',
        });
      
      await auditLog({
        action: 'assign_clique_role',
        targetTable: 'squad_members',
        targetId: memberId,
        newValues: { role },
      });
    },
    onSuccess: () => {
      toast.success('Role assigned!');
      setShowRoleDialog({ open: false, memberId: '', memberName: '' });
      setSelectedRole('');
      queryClient.invalidateQueries({ queryKey: ['admin-clique-members', cliqueId] });
      queryClient.invalidateQueries({ queryKey: ['admin-clique-chat', cliqueId] });
    },
    onError: (error) => {
      toast.error('Failed to assign role', { description: error.message });
    },
  });

  if (cliqueLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!clique) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Clique not found.
      </div>
    );
  }

  const statusStyles = SQUAD_STATUS_STYLES[clique.status] || SQUAD_STATUS_STYLES.confirmed;
  const isWarmingUp = clique.status === 'warming_up';
  const isReadyForReview = clique.status === 'ready_for_review';
  const isApproved = ['approved', 'active', 'completed'].includes(clique.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <ThermometerSun className="h-5 w-5 text-amber-500" />
            {clique.squad_name || 'Unnamed Clique'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {clique.instance?.title} · {clique.instance?.scheduled_date && 
              format(new Date(clique.instance.scheduled_date), 'MMM d, yyyy')}
          </p>
        </div>
        <Badge className={`${statusStyles.bg} ${statusStyles.text} border ${statusStyles.border}`}>
          {SQUAD_STATUS_LABELS[clique.status]}
        </Badge>
      </div>

      {/* Progress Overview with Admin Controls */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Warm-Up Progress
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProgressDialog(true)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>{progress.readyMembers} of {progress.totalMembers} members ready</span>
              <span className={progress.isComplete ? 'text-emerald-600 font-medium' : ''}>
                {progress.percentage}%
              </span>
            </div>
            <Progress 
              value={progress.percentage} 
              className={`h-3 ${progress.isComplete ? '[&>div]:bg-emerald-500' : ''}`}
            />
            
            {progress.isComplete && !isApproved && (
              <p className="text-sm text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                All members are ready!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="chat">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="responses">
            Responses
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[350px] flex flex-col">
            <CardContent className="flex-1 flex flex-col p-4">
              <ScrollArea className="flex-1 pr-4">
                {messages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No messages yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const sender = members.find(m => m.user_id === msg.sender_id);
                      const isBuggs = msg.sender_type === 'buggs';
                      const isAdmin = msg.sender_type === 'admin';
                      const isSystem = msg.sender_type === 'system';
                      const isPromptResponse = msg.message.startsWith('📝 **Prompt Response:**');
                      
                      return (
                        <div
                          key={msg.id}
                          className={`text-sm rounded-lg p-2 ${
                            isBuggs 
                              ? 'bg-orange-500/10 border border-orange-500/30' 
                              : isAdmin
                                ? 'bg-primary/10 border border-primary/30'
                                : isSystem
                                  ? 'bg-muted border border-border'
                                  : isPromptResponse
                                    ? 'bg-amber-500/10 border border-amber-500/30'
                                    : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={`font-medium ${isBuggs ? 'text-orange-600' : isAdmin ? 'text-primary' : 'text-foreground'}`}>
                              {isBuggs ? '🐰 BUGGS' : isAdmin ? '🛡️ Admin' : isSystem ? '⚙️ System' : sender?.display_name || 'Unknown'}
                            </span>
                            {isPromptResponse && (
                              <Badge variant="outline" className="text-[10px] h-4">
                                Prompt Response
                              </Badge>
                            )}
                            <span>{format(new Date(msg.created_at), 'h:mm a')}</span>
                          </div>
                          <p className="mt-1">{msg.message}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              
              <Separator className="my-3" />
              
              {/* Admin message input with send-as toggle */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={initiateReadyCheck}
                    disabled={sendAdminMessage.isPending}
                    className="text-xs"
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    Ready Check
                  </Button>
                  <div className="flex-1" />
                  <Button
                    variant={sendAs === 'buggs' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSendAs('buggs')}
                    className="text-xs"
                  >
                    <Bot className="h-3 w-3 mr-1" />
                    BUGGS
                  </Button>
                  <Button
                    variant={sendAs === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSendAs('admin')}
                    className="text-xs"
                  >
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Admin
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    placeholder={`Send message as ${sendAs === 'buggs' ? 'BUGGS 🐰' : 'Admin 🛡️'}...`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!adminMessage.trim() || sendAdminMessage.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Prompt</TableHead>
                  <TableHead className="text-center">Ready</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const hasPrompt = !!member.prompt_response;
                  const hasConfirmed = !!member.readiness_confirmed_at;
                  const isReady = hasPrompt && hasConfirmed;
                  // Use the clique_role column directly, with display label
                  const memberRole = member.clique_role;
                  const roleDisplayLabel = memberRole ? ROLE_LABELS[memberRole] || memberRole : null;
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {member.display_name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.display_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {roleDisplayLabel ? (
                          <Badge variant="secondary" className="text-xs">
                            {roleDisplayLabel}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {hasPrompt ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {hasConfirmed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setShowRoleDialog({ open: true, memberId: member.id, memberName: member.display_name || 'Member' })}
                            title="Assign Role"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={isReady ? "outline" : "default"}
                            size="sm"
                            onClick={() => overrideMemberProgress.mutate({ 
                              memberId: member.id, 
                              confirmed: !isReady 
                            })}
                            disabled={overrideMemberProgress.isPending}
                          >
                            {isReady ? 'Reset' : 'Mark Ready'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Responses Tab */}
        <TabsContent value="responses">
          <Card>
            <CardContent className="pt-4">
              {members.filter(m => m.prompt_response && m.prompt_response !== '[Admin Override]').length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No prompt responses yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {members.filter(m => m.prompt_response && m.prompt_response !== '[Admin Override]').map((member) => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{member.display_name || 'Unknown'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.prompt_response}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admin Actions */}
      {!isApproved && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Admin Actions</CardTitle>
            <CardDescription>
              {isReadyForReview 
                ? 'This clique is ready for your approval.'
                : 'Manage clique warm-up status.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {/* Ice-Breaker and Ready Check buttons - available during warm-up */}
              {isWarmingUp && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setShowIcebreakerDialog(true)}
                    disabled={sendAdminMessage.isPending}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Send Ice-Breaker
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={initiateReadyCheck}
                    disabled={sendAdminMessage.isPending}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Ready Check
                  </Button>
                </>
              )}

              {(isWarmingUp || isReadyForReview) && (
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  disabled={updateStatus.isPending}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Approve Clique
                </Button>
              )}
              
              {isReadyForReview && (
                <Button
                  variant="secondary"
                  onClick={() => updateStatus.mutate({ status: 'warming_up' })}
                  disabled={updateStatus.isPending}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Hold Back
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Clique</DialogTitle>
            <DialogDescription>
              This will unlock quest instructions for all clique members and notify them.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Add approval notes (optional)..."
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateStatus.mutate({ status: 'approved', notes: approvalNotes })}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? 'Approving...' : 'Approve Clique'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Management Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Progress</DialogTitle>
            <DialogDescription>
              Override member readiness or manually adjust progress.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick Actions</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    members.forEach(m => {
                      if (!m.readiness_confirmed_at) {
                        overrideMemberProgress.mutate({ memberId: m.id, confirmed: true });
                      }
                    });
                    setShowProgressDialog(false);
                  }}
                >
                  Mark All Ready
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    members.forEach(m => {
                      if (m.readiness_confirmed_at) {
                        overrideMemberProgress.mutate({ memberId: m.id, confirmed: false });
                      }
                    });
                    setShowProgressDialog(false);
                  }}
                >
                  Reset All
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Individual Members</p>
              <div className="space-y-2">
                {members.map(m => {
                  const isReady = !!m.prompt_response && !!m.readiness_confirmed_at;
                  return (
                    <div key={m.id} className="flex items-center justify-between">
                      <span className="text-sm">{m.display_name || 'Unknown'}</span>
                      <Button
                        variant={isReady ? "secondary" : "default"}
                        size="sm"
                        onClick={() => {
                          overrideMemberProgress.mutate({ memberId: m.id, confirmed: !isReady });
                        }}
                      >
                        {isReady ? 'Reset' : 'Mark Ready'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Assignment Dialog */}
      <Dialog open={showRoleDialog.open} onOpenChange={(open) => setShowRoleDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Assign a role to {showRoleDialog.memberName}. This will be announced in the clique chat.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {/* Roles must match DB check constraint: navigator, vibe_curator, timekeeper, archivist */}
            {[
              { value: 'navigator', label: 'Navigator', icon: '🧭', desc: 'Plans routes & venues' },
              { value: 'vibe_curator', label: 'Vibe Curator', icon: '✨', desc: 'Sets the mood' },
              { value: 'timekeeper', label: 'Timekeeper', icon: '⏱️', desc: 'Manages schedule' },
              { value: 'archivist', label: 'Archivist', icon: '📸', desc: 'Captures memories' },
            ].map((role) => (
              <Button
                key={role.value}
                variant={selectedRole === role.value ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setSelectedRole(role.value)}
              >
                <span className="mr-2">{role.icon}</span>
                <span className="flex-1 text-left">
                  <span className="block font-medium">{role.label}</span>
                  <span className="block text-xs text-muted-foreground">{role.desc}</span>
                </span>
              </Button>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRoleDialog({ open: false, memberId: '', memberName: '' });
              setSelectedRole('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const roleLabels: Record<string, string> = {
                  navigator: 'Navigator',
                  vibe_curator: 'Vibe Curator',
                  timekeeper: 'Timekeeper',
                  archivist: 'Archivist',
                };
                assignRole.mutate({ 
                  memberId: showRoleDialog.memberId, 
                  role: selectedRole, 
                  memberName: showRoleDialog.memberName 
                });
              }}
              disabled={!selectedRole || assignRole.isPending}
            >
              {assignRole.isPending ? 'Assigning...' : 'Assign Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ice-Breaker Dialog */}
      <Dialog open={showIcebreakerDialog} onOpenChange={setShowIcebreakerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Send Ice-Breaker Prompt
            </DialogTitle>
            <DialogDescription>
              Pick a pre-made prompt or write your own. This will be sent as BUGGS to the clique chat.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Pre-made prompts */}
            {warmUpPrompts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Pick a prompt:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {warmUpPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      type="button"
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setCustomIcebreaker('');
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedPrompt?.id === prompt.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium text-sm">{prompt.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{prompt.body}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <Separator />
            
            {/* Custom prompt */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Or write your own:</p>
              <Textarea
                placeholder="Write a custom ice-breaker prompt..."
                value={customIcebreaker}
                onChange={(e) => {
                  setCustomIcebreaker(e.target.value);
                  setSelectedPrompt(null);
                }}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowIcebreakerDialog(false);
              setSelectedPrompt(null);
              setCustomIcebreaker('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const promptText = customIcebreaker.trim() || selectedPrompt?.body;
                if (promptText) {
                  sendIcebreakerPrompt(promptText);
                }
              }}
              disabled={!selectedPrompt && !customIcebreaker.trim()}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Send Ice-Breaker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
