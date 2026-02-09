import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QuestFormData } from '../types';
import { Shield } from 'lucide-react';
import { AIFieldSuggester } from '../AIFieldSuggester';

interface SafetyStepProps {
  formData: QuestFormData;
  updateFormData: (updates: Partial<QuestFormData>) => void;
}

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
    </div>
  );
}
