/**
 * Pilot Instances Manager
 * 
 * Admin component for listing, creating, and managing quest instances.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Plus, Rocket, Calendar, MapPin, Users, 
  ExternalLink, Copy, Loader2, Clock
} from 'lucide-react';
import type { Tables, Enums } from '@/integrations/supabase/types';

type InstanceStatus = Enums<'instance_status'>;

interface QuestInstance {
  id: string;
  instance_slug: string;
  title: string;
  icon: string;
  status: InstanceStatus;
  scheduled_date: string;
  start_time: string;
  meeting_point_name: string | null;
  capacity: number;
  current_signup_count: number;
  quest_card_token: string;
  created_at: string;
}

interface QuestTemplate {
  id: string;
  slug: string;
  title: string;
  icon: string;
  default_capacity: number;
}

const STATUS_COLORS: Record<InstanceStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  recruiting: 'bg-blue-500/20 text-blue-700',
  locked: 'bg-amber-500/20 text-amber-700',
  live: 'bg-green-500/20 text-green-700',
  completed: 'bg-purple-500/20 text-purple-700',
  cancelled: 'bg-destructive/20 text-destructive',
  archived: 'bg-muted text-muted-foreground',
};

export function PilotInstancesManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
        .select('*')
        .not('status', 'eq', 'archived')
        .order('scheduled_date', { ascending: true });
      if (error) throw error;
      return data as QuestInstance[];
    },
  });

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['quest-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_templates')
        .select('id, slug, title, icon, default_capacity')
        .eq('is_active', true)
        .order('title');
      if (error) throw error;
      return data as QuestTemplate[];
    },
  });

  // Create instance from template
  const createInstanceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate || !formData.scheduled_date || !formData.start_time) {
        throw new Error('Please fill in all required fields');
      }

      const { data, error } = await supabase.rpc('create_instance_from_template', {
        p_template_id: selectedTemplate,
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
      toast({ title: 'Instance created!' });
      navigate(`/admin/pilot/${instanceId}`);
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create instance', description: err.message, variant: 'destructive' });
    }
  });

  const copyQuestCardUrl = (token: string) => {
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
    return `${hours}h`;
  };

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
          <h2 className="text-xl font-semibold">Pilot Instances</h2>
          <p className="text-sm text-muted-foreground">Manage active quest runs</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Instance
        </Button>
      </div>

      {/* Instances Table */}
      {instances && instances.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Countdown</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{instance.icon}</span>
                        <div>
                          <p className="font-medium">{instance.title}</p>
                          <p className="text-xs text-muted-foreground">{instance.instance_slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[instance.status]}>
                        {instance.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(instance.scheduled_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric'
                      })}
                      <span className="text-muted-foreground ml-1">
                        {instance.start_time?.slice(0, 5)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getCountdown(instance.scheduled_date, instance.start_time || '00:00')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {instance.current_signup_count || 0} / {instance.capacity}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {instance.meeting_point_name || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyQuestCardUrl(instance.quest_card_token);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/admin/pilot/${instance.id}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Create Instance Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quest Instance</DialogTitle>
            <DialogDescription>
              Create a new pilot run from a quest template.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Quest Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.icon} {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templates?.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No templates available. Create a template first.
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
