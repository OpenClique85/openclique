import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, MapPin, Users, Loader2 } from 'lucide-react';

export interface QuestInstance {
  id: string;
  instance_slug: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  end_time: string | null;
  meeting_point_name: string | null;
  meeting_point_address: string | null;
  capacity: number;
  current_signup_count: number | null;
  status: string;
  spots_remaining: number;
}

interface InstancePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instances: QuestInstance[];
  questTitle: string;
  onSelectInstance: (instanceId: string) => void;
  isLoading?: boolean;
}

export function InstancePicker({
  open,
  onOpenChange,
  instances,
  questTitle,
  onSelectInstance,
  isLoading = false,
}: InstancePickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedId) {
      onSelectInstance(selectedId);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Choose a Date</DialogTitle>
          <DialogDescription>
            Select which session of <span className="font-medium text-foreground">{questTitle}</span> you'd like to join.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4 -mr-4">
          <div className="space-y-3">
            {instances.map((instance) => {
              const isSelected = selectedId === instance.id;
              const isFull = instance.spots_remaining <= 0;
              const spotsText = isFull
                ? 'Full'
                : instance.spots_remaining === 1
                ? '1 spot left'
                : `${instance.spots_remaining} spots left`;

              return (
                <button
                  key={instance.id}
                  onClick={() => setSelectedId(instance.id)}
                  disabled={isFull}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : isFull
                      ? 'border-muted bg-muted/30 opacity-60 cursor-not-allowed'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      {/* Date & Time */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <Calendar className="h-4 w-4 text-primary" />
                          {format(new Date(instance.scheduled_date), 'EEE, MMM d')}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatTime(instance.start_time)}
                          {instance.end_time && ` - ${formatTime(instance.end_time)}`}
                        </div>
                      </div>

                      {/* Location */}
                      {instance.meeting_point_name && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{instance.meeting_point_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Capacity */}
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={isFull ? 'secondary' : 'outline'}
                        className={isFull ? '' : 'border-emerald-500 text-emerald-600'}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {spotsText}
                      </Badge>
                      {isSelected && (
                        <span className="text-xs text-primary font-medium">Selected</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={!selectedId || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join This Session'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default InstancePicker;
