/**
 * Week Calendar View
 * 
 * 7-day column layout showing all instances per day with full details.
 * Supports drag-and-drop rescheduling.
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Loader2, Users, GripVertical } from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import type { Enums } from '@/integrations/supabase/types';

type InstanceStatus = Enums<'instance_status'>;

interface CalendarInstance {
  id: string;
  instance_slug: string;
  title: string;
  icon: string;
  status: InstanceStatus;
  scheduled_date: string;
  start_time: string;
  end_time: string | null;
  current_signup_count: number;
  capacity: number;
  meeting_point_name: string | null;
}

const STATUS_COLORS: Record<InstanceStatus, string> = {
  draft: 'border-l-muted-foreground bg-muted/50',
  recruiting: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20',
  locked: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/20',
  live: 'border-l-green-500 bg-green-50 dark:bg-green-900/20',
  completed: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20',
  cancelled: 'border-l-destructive bg-destructive/10',
  archived: 'border-l-muted-foreground bg-muted/30',
};

const STATUS_BADGE_COLORS: Record<InstanceStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  recruiting: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  locked: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  live: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  cancelled: 'bg-destructive/20 text-destructive',
  archived: 'bg-muted text-muted-foreground',
};

export function WeekCalendarView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<InstanceStatus | 'all'>('all');
  const [draggedInstance, setDraggedInstance] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Fetch all non-archived instances
  const { data: instances, isLoading } = useQuery({
    queryKey: ['quest-instances-week'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_instances')
        .select('id, instance_slug, title, icon, status, scheduled_date, start_time, end_time, current_signup_count, capacity, meeting_point_name')
        .not('status', 'eq', 'archived')
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data as CalendarInstance[];
    },
  });

  // Mutation for rescheduling
  const rescheduleMutation = useMutation({
    mutationFn: async ({ instanceId, newDate }: { instanceId: string; newDate: string }) => {
      const { error } = await supabase
        .from('quest_instances')
        .update({ scheduled_date: newDate })
        .eq('id', instanceId);
      
      if (error) throw error;

      // Log the event using ops_events instead
      await supabase.from('ops_events').insert({
        event_type: 'manual_override',
        quest_id: instanceId,
        metadata: { action: 'instance_rescheduled', new_date: newDate },
        actor_type: 'admin',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quest-instances-week'] });
      queryClient.invalidateQueries({ queryKey: ['quest-instances-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['quest-instances'] });
      toast({
        title: 'Instance rescheduled',
        description: 'The quest instance has been moved to the new date.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Reschedule failed',
        description: error instanceof Error ? error.message : 'Failed to reschedule instance',
        variant: 'destructive',
      });
    },
  });

  // Generate week days
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentWeek);
    const weekEnd = endOfWeek(currentWeek);
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentWeek]);

  // Group instances by date
  const instancesByDate = useMemo(() => {
    const map = new Map<string, CalendarInstance[]>();
    
    (instances || [])
      .filter((inst) => statusFilter === 'all' || inst.status === statusFilter)
      .forEach((instance) => {
        const dateKey = instance.scheduled_date;
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, instance]);
      });
    
    return map;
  }, [instances, statusFilter]);

  const goToPrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToThisWeek = () => setCurrentWeek(new Date());

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, instanceId: string) => {
    e.dataTransfer.setData('instanceId', instanceId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedInstance(instanceId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedInstance(null);
    setDragOverDate(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    const instanceId = e.dataTransfer.getData('instanceId');
    
    if (instanceId) {
      const instance = instances?.find(i => i.id === instanceId);
      if (instance && instance.scheduled_date !== dateKey) {
        rescheduleMutation.mutate({ instanceId, newDate: dateKey });
      }
    }
    
    setDraggedInstance(null);
    setDragOverDate(null);
  }, [instances, rescheduleMutation]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToThisWeek}>
            This Week
          </Button>
        </div>
        
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InstanceStatus | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="recruiting">Recruiting</SelectItem>
            <SelectItem value="locked">Locked</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Drag hint */}
      <p className="text-xs text-muted-foreground">
        💡 Drag instances to reschedule them to a different day
      </p>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayInstances = instancesByDate.get(dateKey) || [];
          const isTodayDate = isToday(day);
          const isDragOver = dragOverDate === dateKey;

          return (
            <Card
              key={dateKey}
              className={`min-h-[400px] transition-all ${
                isTodayDate ? 'ring-2 ring-primary' : ''
              } ${isDragOver ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
              onDragOver={(e) => handleDragOver(e, dateKey)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dateKey)}
            >
              <CardHeader className="p-2 pb-1">
                <div className={`text-center ${isTodayDate ? 'text-primary font-bold' : ''}`}>
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-lg ${isTodayDate ? 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0 space-y-2">
                {dayInstances.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No instances
                  </div>
                ) : (
                  dayInstances.map((instance) => (
                    <div
                      key={instance.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, instance.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => navigate(`/admin/pilot/${instance.id}`)}
                      className={`p-2 rounded border-l-4 cursor-pointer hover:shadow-md transition-all ${
                        STATUS_COLORS[instance.status]
                      } ${draggedInstance === instance.id ? 'opacity-50 scale-95' : ''}`}
                    >
                      <div className="flex items-start gap-1">
                        <GripVertical className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-sm">{instance.icon}</span>
                            <span className="text-xs font-medium truncate">
                              {instance.title}
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-muted-foreground mb-1">
                            {formatTime(instance.start_time)}
                            {instance.end_time && ` - ${formatTime(instance.end_time)}`}
                          </div>
                          
                          {instance.meeting_point_name && (
                            <div className="text-[10px] text-muted-foreground truncate mb-1">
                              📍 {instance.meeting_point_name}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between gap-1">
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1 py-0 ${STATUS_BADGE_COLORS[instance.status]}`}
                            >
                              {instance.status}
                            </Badge>
                            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Users className="h-2.5 w-2.5" />
                              {instance.current_signup_count}/{instance.capacity}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Week stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>
          {Array.from(instancesByDate.values()).flat().length} instances this week
        </span>
        <span>•</span>
        <span>
          {instances?.filter((i) => 
            i.status === 'recruiting' && 
            weekDays.some(d => isSameDay(parseISO(i.scheduled_date), d))
          ).length || 0} recruiting
        </span>
        <span>•</span>
        <span>
          {instances?.filter((i) => 
            i.status === 'live' && 
            weekDays.some(d => isSameDay(parseISO(i.scheduled_date), d))
          ).length || 0} live
        </span>
      </div>
    </div>
  );
}
