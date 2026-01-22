import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestFormData } from '../types';
import { Shield } from 'lucide-react';

interface SafetyStepProps {
  formData: QuestFormData;
  updateFormData: (updates: Partial<QuestFormData>) => void;
}

const AGE_OPTIONS = [
  { value: 'all-ages', label: 'All Ages Welcome' },
  { value: '18+', label: '18+ Only' },
  { value: '21+', label: '21+ Only' },
  { value: 'family', label: 'Family-Friendly (Kids Welcome)' },
];

export function SafetyStep({ formData, updateFormData }: SafetyStepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-creator/5 border border-creator/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-creator mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Safety First</p>
            <p className="text-sm text-muted-foreground">
              Important safety information and restrictions for your quest.
            </p>
          </div>
        </div>
      </div>

      {/* Age Restriction */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Age Restriction</Label>
        <Select
          value={formData.age_restriction}
          onValueChange={(value) => updateFormData({ age_restriction: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select age requirement" />
          </SelectTrigger>
          <SelectContent>
            {AGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Safety Notes */}
      <div className="space-y-2">
        <Label htmlFor="safety_notes" className="text-base font-medium">Safety Notes</Label>
        <Textarea
          id="safety_notes"
          placeholder="Any safety considerations participants should know:

- We'll be outdoors; bring sun protection
- The trail can be slippery after rain
- Participants with severe allergies should note there may be dogs present
- This venue is wheelchair accessible"
          value={formData.safety_notes}
          onChange={(e) => updateFormData({ safety_notes: e.target.value })}
          rows={6}
        />
        <p className="text-sm text-muted-foreground">
          Include any health, environmental, or accessibility considerations.
        </p>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-2">
        <Label htmlFor="emergency_contact" className="text-base font-medium">Emergency Contact</Label>
        <Input
          id="emergency_contact"
          placeholder="Your phone number for day-of emergencies"
          value={formData.emergency_contact}
          onChange={(e) => updateFormData({ emergency_contact: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          This will only be shared with participants on the day of the event.
        </p>
      </div>
    </div>
  );
}
