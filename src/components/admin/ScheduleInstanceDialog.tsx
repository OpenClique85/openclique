/**
 * Schedule Instance Dialog
 * 
 * Quick dialog to create a quest instance directly from the quest catalog.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Rocket, Calendar, Clock, MapPin } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;

interface ScheduleInstanceDialogProps {
  quest: Quest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (instanceId: string) => void;
}

export function ScheduleInstanceDialog({
  quest,
  open,
  onOpenChange,
  onSuccess,
}: ScheduleInstanceDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    scheduled_date: '',
    start_time: '10:00',
    end_time: '',
    meeting_point_name: '',
    meeting_point_address: '',
  });

  // Reset form when quest changes
  const resetForm = () => {
    if (quest) {
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
    } else {
      setFormData({
        scheduled_date: '',
        start_time: '10:00',
        end_time: '',
        meeting_point_name: '',
        meeting_point_address: '',
      });
    }
  };

  // Reset form when dialog opens with a new quest
  useState(() => {
    if (open && quest) {
      resetForm();
    }
  });

  const createInstanceMutation = useMutation({
    mutationFn: async () => {
      if (!quest || !formData.scheduled_date || !formData.start_time) {
        throw new Error('Please fill in the required fields');
      }

      const { data, error } = await supabase.rpc('create_instance_from_quest', {
        p_quest_id: quest.id,
        p_scheduled_date: formData.scheduled_date,
        p_start_time: formData.start_time,
        p_end_time: formData.end_time || null,
        p_meeting_point_name: formData.meeting_point_name || null,
        p_meeting_point_address: formData.meeting_point_address || null,
      });
      
      if (error) throw error;
      return data as string;
    },
    onSuccess: (instanceId) => {
      queryClient.invalidateQueries({ queryKey: ['quest-instances'] });
      toast({ title: 'Instance scheduled!', description: `Created instance for ${quest?.title}` });
      onOpenChange(false);
      onSuccess?.(instanceId);
    },
    onError: (err: Error) => {
      toast({ 
        title: 'Failed to create instance', 
        description: err.message, 
        variant: 'destructive' 
      });
    }
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && quest) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
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
                Date *
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
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
