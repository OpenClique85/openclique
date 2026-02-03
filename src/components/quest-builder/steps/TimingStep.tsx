import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QuestFormData } from '../types';
import { CalendarDays, Clock } from 'lucide-react';

interface TimingStepProps {
  formData: QuestFormData;
  updateFormData: (updates: Partial<QuestFormData>) => void;
}

export function TimingStep({ formData, updateFormData }: TimingStepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-creator/5 border border-creator/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CalendarDays className="w-5 h-5 text-creator mt-0.5" />
          <div>
            <p className="font-medium text-foreground">When does your quest take place?</p>
            <p className="text-sm text-muted-foreground">
              Set the start and end times. Multi-day quests are supported!
            </p>
          </div>
        </div>
      </div>

      {/* Start Date & Time */}
      <div className="space-y-2">
        <Label htmlFor="start_datetime" className="text-base font-medium">Start Date & Time *</Label>
        <div className="relative">
          <Input
            id="start_datetime"
            type="datetime-local"
            value={formData.start_datetime}
            onChange={(e) => updateFormData({ start_datetime: e.target.value })}
            className="pl-10"
          />
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* End Date & Time */}
      <div className="space-y-2">
        <Label htmlFor="end_datetime" className="text-base font-medium">End Date & Time</Label>
        <div className="relative">
          <Input
            id="end_datetime"
            type="datetime-local"
            value={formData.end_datetime}
            onChange={(e) => updateFormData({ end_datetime: e.target.value })}
            className="pl-10"
            min={formData.start_datetime}
          />
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Leave blank for single-moment events or if the end time varies.
        </p>
      </div>

      {/* Duration Notes */}
      <div className="space-y-2">
        <Label htmlFor="duration_notes" className="text-base font-medium">Duration Notes</Label>
        <Textarea
          id="duration_notes"
          placeholder="e.g., 'The main activity is 2 hours, but we'll hang out afterwards' or 'This is a 4-week program meeting every Saturday'"
          value={formData.duration_notes}
          onChange={(e) => updateFormData({ duration_notes: e.target.value })}
          rows={3}
        />
        <p className="text-sm text-muted-foreground">
          Any additional context about timing, recurring sessions, or flexible end times.
        </p>
      </div>

      {/* Preview */}
      {formData.start_datetime && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Preview:</p>
          {(() => {
            const startDate = new Date(formData.start_datetime);
            const endDate = formData.end_datetime ? new Date(formData.end_datetime) : null;
            
            // Check if dates are on different days using local date components
            const isSameDay = endDate && 
              startDate.getFullYear() === endDate.getFullYear() &&
              startDate.getMonth() === endDate.getMonth() &&
              startDate.getDate() === endDate.getDate();
            
            const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });
            
            const formatTime = (date: Date) => date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            });
            
            const formatDateShort = (date: Date) => date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            if (!endDate || isSameDay) {
              // Same day or no end date - show single date with time range
              return (
                <>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-creator" />
                    <span className="font-medium">{formatDate(startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-creator" />
                    <span>
                      {formatTime(startDate)}
                      {endDate && <> - {formatTime(endDate)}</>}
                    </span>
                  </div>
                </>
              );
            } else {
              // Multi-day event - show full date range
              return (
                <>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-creator" />
                    <span className="font-medium">
                      {formatDateShort(startDate)} - {formatDateShort(endDate)}, {endDate.getFullYear()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-creator" />
                    <span>
                      {formatDateShort(startDate)} at {formatTime(startDate)} → {formatDateShort(endDate)} at {formatTime(endDate)}
                    </span>
                  </div>
                </>
              );
            }
          })()}
        </div>
      )}
    </div>
  );
}
