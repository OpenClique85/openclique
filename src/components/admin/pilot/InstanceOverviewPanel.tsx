/**
 * Instance Overview Panel
 * 
 * Shows quest instance status, capacity, countdown, and quick stats.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Calendar, MapPin, Clock, ChevronRight, 
  CheckCircle, AlertCircle, Loader2 
} from 'lucide-react';
import type { Tables, Enums } from '@/integrations/supabase/types';

type QuestInstance = Tables<'quest_instances'>;
type InstanceStatus = Enums<'instance_status'>;

interface InstanceOverviewPanelProps {
  instance: QuestInstance;
  onStatusChange: (status: InstanceStatus) => void;
}

const STATUS_CONFIG: Record<InstanceStatus, { label: string; color: string; next?: InstanceStatus; nextLabel?: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', next: 'recruiting', nextLabel: 'Open Recruiting' },
  recruiting: { label: 'Recruiting', color: 'bg-blue-500/20 text-blue-700', next: 'locked', nextLabel: 'Lock Roster' },
  locked: { label: 'Locked', color: 'bg-amber-500/20 text-amber-700', next: 'live', nextLabel: 'Go Live' },
  live: { label: 'Live', color: 'bg-green-500/20 text-green-700', next: 'completed', nextLabel: 'Mark Complete' },
  completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-700', next: 'archived', nextLabel: 'Archive' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/20 text-destructive' },
  archived: { label: 'Archived', color: 'bg-muted text-muted-foreground' },
};

export function InstanceOverviewPanel({ instance, onStatusChange }: InstanceOverviewPanelProps) {
  // Fetch signup counts
  const { data: signupStats } = useQuery({
    queryKey: ['instance-signups', instance.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_signups')
        .select('status, checked_in_at, completed_at')
        .eq('instance_id', instance.id);
      if (error) throw error;
      
      return {
        total: data.length,
        confirmed: data.filter(s => s.status === 'confirmed' || s.status === 'completed').length,
        checkedIn: data.filter(s => s.checked_in_at).length,
        completed: data.filter(s => s.completed_at || s.status === 'completed').length,
      };
    },
  });

  // Fetch squad count
  const { data: squadCount } = useQuery({
    queryKey: ['instance-squads', instance.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('quest_squads')
        .select('*', { count: 'exact', head: true })
        .eq('quest_id', instance.id);
      if (error) return 0;
      return count || 0;
    },
  });

  const statusConfig = STATUS_CONFIG[instance.status];
  const capacityPercent = signupStats ? Math.round((signupStats.confirmed / instance.capacity) * 100) : 0;

  // Calculate countdown
  const getCountdown = () => {
    const eventDate = new Date(`${instance.scheduled_date}T${instance.start_time}`);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff < 0) return { text: 'Started', isPast: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return { text: `${days}d ${hours}h`, isPast: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m`, isPast: false };
    return { text: `${minutes}m`, isPast: false };
  };

  const countdown = getCountdown();

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
              {!countdown.isPast && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{countdown.text}</span>
                  <span className="text-muted-foreground">until start</span>
                </div>
              )}
            </div>
            
            {statusConfig.next && (
              <Button onClick={() => onStatusChange(statusConfig.next!)}>
                {statusConfig.nextLabel}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capacity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signupStats?.confirmed || 0} / {instance.capacity}
            </div>
            <Progress value={capacityPercent} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {capacityPercent}% filled
            </p>
          </CardContent>
        </Card>

        {/* Squads */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Squads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{squadCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Target size: {instance.target_squad_size}
            </p>
            {instance.squads_locked && (
              <Badge variant="secondary" className="mt-2">Locked</Badge>
            )}
          </CardContent>
        </Card>

        {/* Check-ins */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Checked In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signupStats?.checkedIn || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {signupStats?.confirmed || 0} confirmed
            </p>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signupStats?.completed || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              quest finishers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {new Date(instance.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {instance.start_time?.slice(0, 5)} - {instance.end_time?.slice(0, 5) || 'TBD'}
                </p>
              </div>
            </div>
            
            {instance.meeting_point_name && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{instance.meeting_point_name}</p>
                  {instance.meeting_point_address && (
                    <p className="text-sm text-muted-foreground">{instance.meeting_point_address}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Operator Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {instance.operator_notes || 'No notes yet. Add notes from the edit screen.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
