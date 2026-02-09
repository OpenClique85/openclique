import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { QuestFormData } from '../types';
import { CalendarDays, Clock, Plus, Trash2, ListOrdered } from 'lucide-react';

interface TimingStepProps {
  formData: QuestFormData;
  updateFormData: (updates: Partial<QuestFormData>) => void;
}

export function TimingStep({ formData, updateFormData }: TimingStepProps) {
  const steps = formData.duration_steps || [{ label: '', minutes: 30 }];

  const updateStep = (index: number, field: 'label' | 'minutes', value: string | number) => {
    const updated = steps.map((s, i) => i === index ? { ...s, [field]: value } : s);
    updateFormData({ duration_steps: updated });
  };

  const addStep = () => {
    if (steps.length >= 8) return;
    updateFormData({ duration_steps: [...steps, { label: '', minutes: 30 }] });
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    updateFormData({ duration_steps: steps.filter((_, i) => i !== index) });
  };

  const totalMinutes = steps.reduce((sum, s) => sum + s.minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return (
    <div className="space-y-6">
      <div className="bg-creator/5 border border-creator/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CalendarDays className="w-5 h-5 text-creator mt-0.5" />
          <div>
            <p className="font-medium text-foreground">When does your quest take place?</p>
            <p className="text-sm text-muted-foreground">
              Set the start and end times, then break down the quest into steps.
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

      {/* Duration Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-muted-foreground" />
            <Label className="text-base font-medium">Quest Steps</Label>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Total: {totalHours > 0 ? `${totalHours}h ` : ''}{remainingMinutes}m
          </span>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-creator shrink-0">
                    Step {index + 1}
                  </span>
                  <Input
                    placeholder={`e.g., ${index === 0 ? 'Icebreaker' : index === 1 ? 'Main Activity' : 'Wrap-up'}`}
                    value={step.label}
                    onChange={(e) => updateStep(index, 'label', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                {steps.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeStep(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[step.minutes]}
                  onValueChange={([value]) => updateStep(index, 'minutes', value)}
                  min={5}
                  max={180}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-foreground w-12 text-right shrink-0">
                  {step.minutes}m
                </span>
              </div>
            </div>
          ))}
        </div>

        {steps.length < 8 && (
          <Button variant="outline" size="sm" onClick={addStep} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Step ({steps.length}/8)
          </Button>
        )}

        <p className="text-sm text-muted-foreground">
          Break your quest into phases so participants know what to expect.
        </p>
      </div>

      {/* Preview */}
      {formData.start_datetime && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Preview:</p>
          {(() => {
            const startDate = new Date(formData.start_datetime);
            const endDate = formData.end_datetime ? new Date(formData.end_datetime) : null;
            
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
