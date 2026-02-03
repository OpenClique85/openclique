import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestFormData } from '../types';
import { Shield } from 'lucide-react';
import { AIFieldSuggester } from '../AIFieldSuggester';

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
  const questContext = {
    title: formData.title,
    theme: formData.theme,
    progression_tree: formData.progression_tree,
    short_description: formData.short_description,
    constraints_physical_intensity: formData.constraints_physical_intensity,
    constraints_social_intensity: formData.constraints_social_intensity,
    constraints_indoor_outdoor: formData.constraints_indoor_outdoor,
    constraints_age_requirement: formData.constraints_age_requirement,
  };

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
        <p className="text-sm text-muted-foreground">
          This should match the constraints set in Step 3.
        </p>
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Include any health, environmental, or accessibility considerations.
          </p>
          <AIFieldSuggester
            fieldName="safety_notes"
            fieldLabel="Safety Notes"
            currentValue={formData.safety_notes}
            onSuggestion={(value) => updateFormData({ safety_notes: value })}
            questContext={questContext}
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-2">
        <Label htmlFor="emergency_contact" className="text-base font-medium">Emergency Contact Info</Label>
        <Input
          id="emergency_contact"
          placeholder="How participants can reach you during the event (e.g., @yourname on the app)"
          value={formData.emergency_contact}
          onChange={(e) => updateFormData({ emergency_contact: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          This will be shared with participants on the day of the event. Use in-app contact methods only.
        </p>
      </div>
    </div>
  );
}
