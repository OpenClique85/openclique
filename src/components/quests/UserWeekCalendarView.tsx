/**
 * User-Facing Week Calendar View
 * 
 * A visual 7-day calendar grid showing upcoming quests by date.
 * Helps users plan around time rather than just browsing by interest.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Loader2, Users, MapPin } from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
  isToday,
  parseISO,
  isSameDay,
} from 'date-fns';

interface CalendarQuest {
  id: string;
  slug: string;
  title: string;
  icon: string;
  scheduled_date: string;
  start_time: string;
  end_time: string | null;
  current_signup_count: number;
  capacity: number;
  meeting_point_name: string | null;
  progression_tree: string | null;
}

const TREE_COLORS: Record<string, string> = {
  culture: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/20',
  wellness: 'border-l-green-500 bg-green-50/50 dark:bg-green-900/20',
  connector: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/20',
};

const TREE_BADGES: Record<string, string> = {
  culture: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  wellness: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  connector: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
};

interface UserWeekCalendarViewProps {
  onQuestClick: (questSlug: string) => void;
}

export function UserWeekCalendarView({ onQuestClick }: UserWeekCalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Fetch recruiting instances for the calendar
  const { data: instances, isLoading } = useQuery({
    queryKey: ['user-quest-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_instances')
        .select(`
          id, 
          instance_slug,
          title, 
          icon, 
          scheduled_date, 
          start_time, 
          end_time, 
          current_signup_count, 
          capacity, 
          meeting_point_name,
          quests!inner(slug, progression_tree)
        `)
        .eq('status', 'recruiting')
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map((inst) => ({
        id: inst.id,
        slug: inst.quests?.slug || inst.instance_slug,
        title: inst.title,
        icon: inst.icon,
        scheduled_date: inst.scheduled_date,
        start_time: inst.start_time,
        end_time: inst.end_time,
        current_signup_count: inst.current_signup_count,
        capacity: inst.capacity,
        meeting_point_name: inst.meeting_point_name,
        progression_tree: inst.quests?.progression_tree || null,
      })) as CalendarQuest[];
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
    const map = new Map<string, CalendarQuest[]>();
    
    (instances || []).forEach((instance) => {
      const dateKey = instance.scheduled_date;
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, instance]);
    });
    
    return map;
  }, [instances]);

  const goToPrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToThisWeek = () => setCurrentWeek(new Date());

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Count quests this week
  const questsThisWeek = useMemo(() => {
    return (instances || []).filter((inst) =>
      weekDays.some((d) => isSameDay(parseISO(inst.scheduled_date), d))
    ).length;
  }, [instances, weekDays]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold min-w-[180px] text-center">
            {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d')}
          </h3>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToThisWeek}>
            This Week
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {questsThisWeek} quest{questsThisWeek !== 1 ? 's' : ''} this week
        </p>
      </div>

      {/* Week grid - responsive layout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayInstances = instancesByDate.get(dateKey) || [];
          const isTodayDate = isToday(day);
          const isPast = day < new Date() && !isTodayDate;

          return (
            <Card
              key={dateKey}
              className={`min-h-[140px] sm:min-h-[180px] transition-all ${
                isTodayDate ? 'ring-2 ring-primary' : ''
              } ${isPast ? 'opacity-60' : ''}`}
            >
              <CardHeader className="p-2 pb-1">
                <div className={`text-center ${isTodayDate ? 'text-primary font-bold' : ''}`}>
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(day, 'EEE')}
                  </div>
                  <div 
                    className={`text-lg ${
                      isTodayDate 
                        ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto text-sm' 
                        : ''
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0 space-y-1.5">
                {dayInstances.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    No quests
                  </div>
                ) : (
                  dayInstances.map((instance) => (
                    <button
                      key={instance.id}
                      onClick={() => onQuestClick(instance.slug)}
                      className={`w-full text-left p-2 rounded border-l-4 hover:shadow-md transition-all ${
                        TREE_COLORS[instance.progression_tree || ''] || 'border-l-muted-foreground bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-1">
                        <span className="text-sm shrink-0">{instance.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium line-clamp-2">
                            {instance.title}
                          </span>
                          
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {formatTime(instance.start_time)}
                          </div>
                          
                          <div className="flex items-center justify-between gap-1 mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-[9px] px-1 py-0 ${
                                TREE_BADGES[instance.progression_tree || ''] || ''
                              }`}
                            >
                              {instance.progression_tree || 'Quest'}
                            </Badge>
                            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Users className="h-2.5 w-2.5" />
                              {instance.current_signup_count}/{instance.capacity}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center pt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-l-2 border-l-amber-500 bg-amber-50 dark:bg-amber-900/30" />
          <span>Culture</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-l-2 border-l-green-500 bg-green-50 dark:bg-green-900/30" />
          <span>Wellness</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-l-2 border-l-blue-500 bg-blue-50 dark:bg-blue-900/30" />
          <span>Connector</span>
        </div>
      </div>
    </div>
  );
}
