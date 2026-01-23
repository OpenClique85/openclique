/**
 * Instance Calendar View
 * 
 * Calendar visualization of scheduled quest instances.
 * Supports drag-and-drop rescheduling.
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Loader2, GripVertical } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
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
  current_signup_count: number;
  capacity: number;
}

const STATUS_COLORS: Record<InstanceStatus, string> = {
  draft: 'bg-muted border-muted-foreground/30',
  recruiting: 'bg-blue-500/20 border-blue-500',
  locked: 'bg-amber-500/20 border-amber-500',
  live: 'bg-green-500/20 border-green-500',
  completed: 'bg-purple-500/20 border-purple-500',
  cancelled: 'bg-destructive/20 border-destructive',
  archived: 'bg-muted border-muted-foreground/30',
  paused: 'bg-orange-500/20 border-orange-500',
};

const STATUS_DOT_COLORS: Record<InstanceStatus, string> = {
  draft: 'bg-muted-foreground',
  recruiting: 'bg-blue-500',
  locked: 'bg-amber-500',
  live: 'bg-green-500',
  completed: 'bg-purple-500',
  cancelled: 'bg-destructive',
  archived: 'bg-muted-foreground',
  paused: 'bg-orange-500',
};

export function InstanceCalendarView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<InstanceStatus | 'all'>('all');
  const [draggedInstance, setDraggedInstance] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Fetch all non-archived instances
  const { data: instances, isLoading } = useQuery({
    queryKey: ['quest-instances-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_instances')
        .select('id, instance_slug, title, icon, status, scheduled_date, start_time, current_signup_count, capacity')
        .not('status', 'eq', 'archived')
        .order('scheduled_date', { ascending: true });
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

      // Log the event
      await supabase.from('ops_events').insert({
        event_type: 'manual_override',
        quest_id: instanceId,
        metadata: { action: 'instance_rescheduled', new_date: newDate },
        actor_type: 'admin',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quest-instances-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['quest-instances-week'] });
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

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

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

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

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
          <Button variant="outline" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[180px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
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

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(STATUS_DOT_COLORS).filter(([status]) => status !== 'archived').map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayInstances = instancesByDate.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);
              const isDragOver = dragOverDate === dateKey;

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] border-b border-r p-1 transition-colors ${
                    !isCurrentMonth ? 'bg-muted/30' : ''
                  } ${isTodayDate ? 'bg-primary/5' : ''} ${
                    isDragOver ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, dateKey)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateKey)}
                >
                  <div className={`text-sm mb-1 ${
                    isTodayDate 
                      ? 'font-bold text-primary' 
                      : isCurrentMonth 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayInstances.slice(0, 3).map((instance) => (
                      <div
                        key={instance.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, instance.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => navigate(`/admin/pilot/${instance.id}`)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-xs truncate border-l-2 hover:opacity-80 transition-all cursor-pointer flex items-center gap-0.5 ${
                          STATUS_COLORS[instance.status]
                        } ${draggedInstance === instance.id ? 'opacity-50 scale-95' : ''}`}
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground shrink-0 cursor-grab" />
                        <span className="mr-1">{instance.icon}</span>
                        <span className="truncate">{instance.title}</span>
                      </div>
                    ))}
                    {dayInstances.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayInstances.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{instances?.length || 0} total instances</span>
        <span>•</span>
        <span>
          {instances?.filter((i) => i.status === 'recruiting').length || 0} recruiting
        </span>
        <span>•</span>
        <span>
          {instances?.filter((i) => i.status === 'live').length || 0} live
        </span>
      </div>
    </div>
  );
}
