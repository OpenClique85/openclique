/**
 * Schedule Instance Dialog
 * 
 * Quick dialog to create a quest instance directly from the quest catalog.
 * Supports single instance and recurring (weekly/monthly) scheduling.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Rocket, Calendar, Clock, MapPin, Repeat, ExternalLink } from 'lucide-react';
import { addWeeks, addMonths, format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;

interface ScheduleInstanceDialogProps {
  quest: Quest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (instanceId: string) => void;
}

type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly';

export function ScheduleInstanceDialog({
  quest,
  open,
  onOpenChange,
  onSuccess,
}: ScheduleInstanceDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    scheduled_date: '',
    start_time: '10:00',
    end_time: '',
    meeting_point_name: '',
    meeting_point_address: '',
  });
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('weekly');
  const [recurringCount, setRecurringCount] = useState(4);
  const [navigateAfter, setNavigateAfter] = useState(true);

  // Reset form when dialog opens with a new quest
  useEffect(() => {
    if (open && quest) {
      // Pre-fill with quest defaults if available
      const startDate = quest.start_datetime 
        ? new Date(quest.start_datetime).toISOString().split('T')[0]
        : '';
      const startTime = quest.start_datetime
        ? new Date(quest.start_datetime).toTimeString().slice(0, 5)
        : '10:00';
      const endTime = quest.end_datetime
        ? new Date(quest.end_datetime).toTimeString().slice(0, 5)
        : '';
        
      setFormData({
        scheduled_date: startDate,
        start_time: startTime,
        end_time: endTime,
        meeting_point_name: quest.meeting_location_name || '',
        meeting_point_address: quest.meeting_address || '',
      });
      setIsRecurring(false);
      setRecurringCount(4);
    }
  }, [open, quest]);

  // Calculate recurring dates for preview
  const getRecurringDates = (): Date[] => {
    if (!formData.scheduled_date) return [];
    
    const dates: Date[] = [];
    let currentDate = new Date(formData.scheduled_date);
    
    for (let i = 0; i < recurringCount; i++) {
      dates.push(new Date(currentDate));
      switch (recurringFrequency) {
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'biweekly':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
      }
    }
    
    return dates;
  };

  const createInstanceMutation = useMutation({
    mutationFn: async () => {
      if (!quest || !formData.scheduled_date || !formData.start_time) {
        throw new Error('Please fill in the required fields');
      }

      const dates = isRecurring ? getRecurringDates() : [new Date(formData.scheduled_date)];
      const instanceIds: string[] = [];
      
      for (const date of dates) {
        const { data, error } = await supabase.rpc('create_instance_from_quest', {
          p_quest_id: quest.id,
          p_scheduled_date: date.toISOString().split('T')[0],
          p_start_time: formData.start_time,
          p_end_time: formData.end_time || null,
          p_meeting_point_name: formData.meeting_point_name || null,
          p_meeting_point_address: formData.meeting_point_address || null,
        });
        
        if (error) throw error;
        instanceIds.push(data as string);
      }
      
      return instanceIds;
    },
    onSuccess: (instanceIds) => {
      queryClient.invalidateQueries({ queryKey: ['quest-instances'] });
      queryClient.invalidateQueries({ queryKey: ['quest-instance-counts'] });
      
      const count = instanceIds.length;
      toast({ 
        title: count > 1 ? `${count} instances scheduled!` : 'Instance scheduled!', 
        description: `Created ${count > 1 ? 'recurring instances' : 'instance'} for ${quest?.title}` 
      });
      
      onOpenChange(false);
      onSuccess?.(instanceIds[0]);
      
      // Navigate to the first instance's control room
      if (navigateAfter && instanceIds[0]) {
        navigate(`/admin/pilot/${instanceIds[0]}`);
      }
    },
    onError: (err: Error) => {
      toast({ 
        title: 'Failed to create instance', 
        description: err.message, 
        variant: 'destructive' 
      });
    }
  });

  const recurringDates = isRecurring ? getRecurringDates() : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Instance
          </DialogTitle>
          <DialogDescription>
            {quest ? (
              <span className="flex items-center gap-2">
                <span className="text-lg">{quest.icon}</span>
                <span>{quest.title}</span>
                {quest.is_repeatable && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Repeatable
                  </span>
                )}
              </span>
            ) : (
              'Select a quest to schedule'
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Start Date *
              </Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Start Time *
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end_time">End Time (optional)</Label>
            <Input
              id="end_time"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="recurring" className="cursor-pointer">Schedule Recurring</Label>
                <p className="text-xs text-muted-foreground">Create multiple instances on a schedule</p>
              </div>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>
          
          {/* Recurring Options */}
          {isRecurring && (
            <div className="space-y-3 p-3 rounded-lg border border-dashed">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={recurringFrequency} onValueChange={(v) => setRecurringFrequency(v as RecurringFrequency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Number of Instances</Label>
                  <Select value={String(recurringCount)} onValueChange={(v) => setRecurringCount(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 6, 8, 10, 12].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} instances</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Preview dates */}
              {recurringDates.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Scheduled dates:</Label>
                  <div className="flex flex-wrap gap-1">
                    {recurringDates.map((date, i) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {format(date, 'MMM d')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="meeting_point_name" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Meeting Point
            </Label>
            <Input
              id="meeting_point_name"
              placeholder="e.g., Zilker Park Main Entrance"
              value={formData.meeting_point_name}
              onChange={(e) => setFormData({ ...formData, meeting_point_name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meeting_point_address">Address (optional)</Label>
            <Input
              id="meeting_point_address"
              placeholder="Full street address"
              value={formData.meeting_point_address}
              onChange={(e) => setFormData({ ...formData, meeting_point_address: e.target.value })}
            />
          </div>
          
          {/* Navigate after toggle */}
          <div className="flex items-center gap-2 pt-2">
            <Switch
              id="navigate-after"
              checked={navigateAfter}
              onCheckedChange={setNavigateAfter}
            />
            <Label htmlFor="navigate-after" className="text-sm cursor-pointer flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              Open Control Room after scheduling
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => createInstanceMutation.mutate()}
            disabled={createInstanceMutation.isPending || !formData.scheduled_date || !formData.start_time}
          >
            {createInstanceMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            {isRecurring ? `Schedule ${recurringCount} Instances` : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
