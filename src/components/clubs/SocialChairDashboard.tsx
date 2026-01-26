/**
 * SocialChairDashboard - Club admin dashboard for managing events and cliques
 * 
 * Features:
 * - Event Command Center (selector, RSVP count, cliques formed)
 * - Clique Operations Table (size, status, ready checks)
 * - Broadcast Composer (message all cliques, leaders, roles)
 * - Ops Summary (AI/rules-based overview)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InviteCodesTab } from './InviteCodesTab';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Users,
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Target,
  Megaphone,
  Loader2,
  Ticket,
  Copy,
  Link2,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SocialChairDashboardProps {
  clubId: string;
  clubName: string;
}

export function SocialChairDashboard({ clubId, clubName }: SocialChairDashboardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'leaders' | 'selected'>('all');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedSquadIds, setSelectedSquadIds] = useState<string[]>([]);

  // Fetch club's quest instances
  const { data: instances, isLoading: instancesLoading } = useQuery({
    queryKey: ['club-instances', clubId],
    queryFn: async () => {
      const { data: quests } = await supabase
        .from('quests')
        .select('id')
        .eq('org_id', clubId);

      if (!quests?.length) return [];

      const questIds = quests.map((q) => q.id);
      const { data, error } = await supabase
        .from('quest_instances')
        .select(`
          id,
          instance_slug,
          title,
          scheduled_date,
          start_time,
          status,
          capacity,
          current_signup_count,
          quest:quests(id, title, org_id)
        `)
        .in('quest_id', questIds)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  // Fetch squads for selected instance
  const { data: squads, isLoading: squadsLoading } = useQuery({
    queryKey: ['instance-squads', selectedInstanceId],
    queryFn: async () => {
      if (!selectedInstanceId) return [];
      const { data, error } = await supabase
        .from('quest_squads')
        .select(`
          id,
          squad_name,
          status,
          created_at,
          confirmed_at,
          squad_members:squad_members(
            user_id,
            role,
            status,
            readiness_confirmed_at,
            prompt_response,
            profile:profiles(display_name)
          )
        `)
        .eq('quest_id', selectedInstanceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedInstanceId,
  });

  // Fetch signups for selected instance
  const { data: signups } = useQuery({
    queryKey: ['instance-signups', selectedInstanceId],
    queryFn: async () => {
      if (!selectedInstanceId) return [];
      const { data, error } = await supabase
        .from('quest_signups')
        .select('id, status')
        .eq('quest_id', selectedInstanceId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedInstanceId,
  });

  const selectedInstance = instances?.find((i) => i.id === selectedInstanceId);
  const confirmedSignups = signups?.filter((s) => s.status === 'confirmed').length || 0;
  const totalSignups = signups?.length || 0;
  const activeSquads = squads?.filter((s) => s.status !== 'draft').length || 0;
  const readySquads = squads?.filter((s) => s.status === 'active' || s.status === 'confirmed').length || 0;

  const getSquadHealth = (squad: any) => {
    const members = squad.squad_members || [];
    const readyCount = members.filter((m: any) => m.readiness_confirmed_at).length;
    const ratio = members.length > 0 ? readyCount / members.length : 0;
    if (ratio >= 0.8) return 'healthy';
    if (ratio >= 0.5) return 'warning';
    return 'at_risk';
  };

  // Broadcast mutation
  const sendBroadcast = useMutation({
    mutationFn: async () => {
      if (!selectedInstanceId || !user) return;
      const { data, error } = await supabase.functions.invoke('send-broadcast', {
        body: {
          instance_id: selectedInstanceId,
          target: broadcastTarget,
          message: broadcastMessage,
          squad_ids: broadcastTarget === 'selected' ? selectedSquadIds : undefined,
          sender_id: user.id,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Broadcast sent to ${data?.recipients_count || 0} members`);
      setBroadcastMessage('');
      setSelectedSquadIds([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send broadcast');
    },
  });

  if (instancesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Social Chair Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">{clubName}</p>
        </div>

        {/* Event Selector */}
        <div className="w-full sm:w-64">
          <Select
            value={selectedInstanceId || ''}
            onValueChange={(v) => setSelectedInstanceId(v || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {instances?.map((instance) => (
                <SelectItem key={instance.id} value={instance.id}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="truncate">{instance.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {instance.scheduled_date
                        ? format(new Date(instance.scheduled_date), 'MMM d')
                        : ''}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedInstanceId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select an event to manage</p>
            {instances?.length === 0 && (
              <p className="mt-2 text-sm">No upcoming events found for this club</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalSignups}</p>
                    <p className="text-xs text-muted-foreground">RSVPs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{confirmedSignups}</p>
                    <p className="text-xs text-muted-foreground">Confirmed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeSquads}</p>
                    <p className="text-xs text-muted-foreground">Cliques Formed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{readySquads}</p>
                    <p className="text-xs text-muted-foreground">Ready</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="cliques" className="space-y-4">
            <TabsList>
              <TabsTrigger value="cliques" className="gap-1">
                <Users className="h-4 w-4" />
                Cliques
              </TabsTrigger>
              <TabsTrigger value="invite-codes" className="gap-1">
                <Ticket className="h-4 w-4" />
                Invite Codes
              </TabsTrigger>
              <TabsTrigger value="broadcast" className="gap-1">
                <Megaphone className="h-4 w-4" />
                Broadcast
              </TabsTrigger>
            </TabsList>

            {/* Cliques Tab */}
            <TabsContent value="cliques">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Clique Operations</CardTitle>
                  <CardDescription>
                    Manage cliques for {selectedInstance?.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {squadsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : squads?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No cliques formed yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Clique</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ready Check</TableHead>
                            <TableHead>Health</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {squads?.map((squad) => {
                            const members = squad.squad_members || [];
                            const readyCount = members.filter(
                              (m: any) => m.readiness_confirmed_at
                            ).length;
                            const health = getSquadHealth(squad);

                            return (
                              <TableRow key={squad.id}>
                                <TableCell>
                                  <div className="font-medium">{squad.squad_name}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    {members.length}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      squad.status === 'active' || squad.status === 'confirmed'
                                        ? 'default'
                                        : 'secondary'
                                    }
                                  >
                                    {squad.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">
                                    {readyCount}/{members.length}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {health === 'healthy' ? (
                                    <Badge variant="outline" className="text-green-500 border-green-500">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Healthy
                                    </Badge>
                                  ) : health === 'warning' ? (
                                    <Badge variant="outline" className="text-amber-500 border-amber-500">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Warming
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-red-500 border-red-500">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      At Risk
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm">
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invite Codes Tab */}
            <TabsContent value="invite-codes">
              <InviteCodesTab clubId={clubId} clubName={clubName} />
            </TabsContent>

            {/* Broadcast Tab */}
            <TabsContent value="broadcast">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    Broadcast Composer
                  </CardTitle>
                  <CardDescription>
                    Send a message to cliques for {selectedInstance?.title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select
                      value={broadcastTarget}
                      onValueChange={(v) => setBroadcastTarget(v as typeof broadcastTarget)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clique Members</SelectItem>
                        <SelectItem value="leaders">Clique Leaders Only</SelectItem>
                        <SelectItem value="selected">Selected Cliques</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Write your broadcast message..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      This message will be sent to{' '}
                      {broadcastTarget === 'all'
                        ? 'all members'
                        : broadcastTarget === 'leaders'
                        ? 'clique leaders'
                        : 'selected cliques'}
                    </p>
                  </div>

                  <Button 
                    onClick={() => sendBroadcast.mutate()}
                    disabled={!broadcastMessage.trim() || sendBroadcast.isPending}
                  >
                    {sendBroadcast.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Broadcast
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
