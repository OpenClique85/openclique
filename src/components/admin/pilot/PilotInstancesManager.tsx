/**
 * Pilot Instances Manager
 * 
 * Admin component for listing, creating, and managing quest instances.
 * Features operational status labels, attention flags, squad counts, and clickable rows.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { 
  Plus, Rocket, Calendar, MapPin, 
  ExternalLink, Copy, Loader2, Clock, List, CalendarDays, Settings2, Users
} from 'lucide-react';
import { BulkStatusUpdateDialog } from './BulkStatusUpdateDialog';
import { InstanceCalendarView } from './InstanceCalendarView';
import { WeekCalendarView } from './WeekCalendarView';
import { InstanceStatusBadge } from './InstanceStatusBadge';
import { InstanceAttentionFlag, calculateAttentionFlag } from './InstanceAttentionFlag';
import { InstanceSummaryStats } from './InstanceSummaryStats';
import { useInstanceSquadCounts } from '@/hooks/useInstanceSquadCounts';
import type { Enums } from '@/integrations/supabase/types';

type InstanceStatus = Enums<'instance_status'>;

interface QuestInstance {
  id: string;
  instance_slug: string;
  title: string;
  icon: string | null;
  status: InstanceStatus;
  scheduled_date: string;
  start_time: string;
  meeting_point_name: string | null;
  capacity: number;
  current_signup_count: number | null;
  target_squad_size: number | null;
  quest_card_token: string;
  created_at: string;
}

interface QuestForPicker {
  id: string;
  slug: string;
  title: string;
  icon: string;
  default_capacity: number | null;
  is_repeatable: boolean;
}

export function PilotInstancesManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'calendar' | 'week'>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState({
    scheduled_date: '',
    start_time: '10:00',
    meeting_point_name: '',
    meeting_point_address: '',
  });

  // Fetch instances
  const { data: instances, isLoading } = useQuery({
    queryKey: ['quest-instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_instances')
        .select('id, instance_slug, title, icon, status, scheduled_date, start_time, meeting_point_name, capacity, current_signup_count, target_squad_size, quest_card_token, created_at')
        .not('status', 'eq', 'archived')
        .order('scheduled_date', { ascending: true });
      if (error) throw error;
      return data as QuestInstance[];
    },
  });

  // Fetch squad counts for all instances
  const instanceIds = useMemo(() => instances?.map(i => i.id) || [], [instances]);
  const { data: squadCounts } = useInstanceSquadCounts(instanceIds);

  // Fetch quests (as templates)
  const { data: quests } = useQuery({
    queryKey: ['quests-for-instance-picker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select('id, slug, title, icon, default_capacity, is_repeatable')
        .eq('is_active', true)
        .eq('review_status', 'approved')
        .order('title');
      if (error) throw error;
      return data as QuestForPicker[];
    },
  });

  // Create instance from quest
  const createInstanceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate || !formData.scheduled_date || !formData.start_time) {
        throw new Error('Please fill in all required fields');
      }

      const { data, error } = await supabase.rpc('create_instance_from_quest', {
        p_quest_id: selectedTemplate,
        p_scheduled_date: formData.scheduled_date,
        p_start_time: formData.start_time,
        p_meeting_point_name: formData.meeting_point_name || null,
        p_meeting_point_address: formData.meeting_point_address || null,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (instanceId) => {
      queryClient.invalidateQueries({ queryKey: ['quest-instances'] });
      setIsCreateOpen(false);
      setSelectedTemplate('');
      setFormData({
        scheduled_date: '',
        start_time: '10:00',
        meeting_point_name: '',
        meeting_point_address: '',
      });
      toast({ title: 'Instance created!' });
      navigate(`/admin/pilot/${instanceId}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create instance', description: err.message, variant: 'destructive' });
    }
  });

  const copyQuestCardUrl = (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/quest-card/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Quest Card URL copied!' });
  };

  const getCountdown = (date: string, time: string) => {
    const eventDate = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Past';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h`;
    
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m`;
  };

  const handleRowClick = (instanceId: string) => {
    navigate(`/admin/pilot/${instanceId}`);
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!instances) return { totalInstances: 0, todayCount: 0, needsAttention: 0, totalConfirmed: 0 };

    const today = new Date().toISOString().split('T')[0];
    let needsAttention = 0;
    let totalConfirmed = 0;

    instances.forEach(instance => {
      totalConfirmed += instance.current_signup_count || 0;
      const squadCount = squadCounts?.[instance.id] || 0;
      const flag = calculateAttentionFlag(instance, squadCount);
      if (flag && (flag.severity === 'warning' || flag.severity === 'error')) {
        needsAttention++;
      }
    });

    return {
      totalInstances: instances.length,
      todayCount: instances.filter(i => i.scheduled_date === today).length,
      needsAttention,
      totalConfirmed,
    };
  }, [instances, squadCounts]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Quest Instances</h2>
          <p className="text-sm text-muted-foreground">Active and upcoming quest runs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsBulkUpdateOpen(true)}>
            <Settings2 className="h-4 w-4 mr-2" />
            Bulk Update
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Instance
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <InstanceSummaryStats {...summaryStats} />

      {/* View Toggle */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'list' | 'calendar' | 'week')}>
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-1">
            <List className="h-4 w-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="week" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Week
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            Month
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {/* Instances Table */}
          {instances && instances.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quest</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Countdown</TableHead>
                      <TableHead>Signups</TableHead>
                      <TableHead>Squads</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Attention</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instances.map((instance) => {
                      const squadCount = squadCounts?.[instance.id] || 0;
                      const attentionFlag = calculateAttentionFlag(instance, squadCount);

                      return (
                        <TableRow 
                          key={instance.id} 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleRowClick(instance.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{instance.icon || '🎯'}</span>
                              <div>
                                <p className="font-medium">{instance.title}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {instance.instance_slug}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <InstanceStatusBadge status={instance.status} size="sm" />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {new Date(instance.scheduled_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short', 
                                  day: 'numeric'
                                })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {instance.start_time?.slice(0, 5)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {getCountdown(instance.scheduled_date, instance.start_time || '00:00')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{instance.current_signup_count || 0}</span>
                              <span className="text-muted-foreground">/ {instance.capacity}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {squadCount > 0 ? squadCount : '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground max-w-32 truncate">
                              {instance.meeting_point_name ? (
                                <>
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{instance.meeting_point_name}</span>
                                </>
                              ) : (
                                '—'
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <InstanceAttentionFlag flag={attentionFlag} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={(e) => copyQuestCardUrl(instance.quest_card_token, e)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/pilot/${instance.id}`);
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No Pilot Instances</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first quest instance from a template.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Instance
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="week" className="mt-4">
          <WeekCalendarView />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <InstanceCalendarView />
        </TabsContent>
      </Tabs>

      {/* Bulk Status Update Dialog */}
      <BulkStatusUpdateDialog
        open={isBulkUpdateOpen}
        onOpenChange={setIsBulkUpdateOpen}
        instances={instances || []}
      />

      {/* Create Instance Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quest Instance</DialogTitle>
            <DialogDescription>
              Schedule a new run of a quest.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Quest Selection */}
            <div className="space-y-2">
              <Label>Quest</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a quest..." />
                </SelectTrigger>
                <SelectContent>
                  {quests?.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.icon} {q.title}
                      {q.is_repeatable && <span className="ml-2 text-xs text-muted-foreground">(Repeatable)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {quests?.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No approved quests available.
                </p>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Meeting Point Name</Label>
              <Input
                placeholder="e.g., Zilker Park Entrance"
                value={formData.meeting_point_name}
                onChange={(e) => setFormData({ ...formData, meeting_point_name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Address (optional)</Label>
              <Input
                placeholder="Full address"
                value={formData.meeting_point_address}
                onChange={(e) => setFormData({ ...formData, meeting_point_address: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createInstanceMutation.mutate()}
              disabled={createInstanceMutation.isPending || !selectedTemplate}
            >
              {createInstanceMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4 mr-2" />
              )}
              Create Instance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
