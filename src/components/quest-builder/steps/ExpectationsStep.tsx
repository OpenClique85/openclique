import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { QuestFormData } from '../types';
import { ClipboardList } from 'lucide-react';
import { AIFieldSuggester } from '../AIFieldSuggester';

interface ExpectationsStepProps {
  formData: QuestFormData;
  updateFormData: (updates: Partial<QuestFormData>) => void;
}

export function ExpectationsStep({ formData, updateFormData }: ExpectationsStepProps) {
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
          <ClipboardList className="w-5 h-5 text-creator mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Set Expectations</p>
            <p className="text-sm text-muted-foreground">
              Help participants prepare for the best experience possible.
            </p>
          </div>
        </div>
      </div>

      {/* What to Bring */}
      <div className="space-y-2">
        <Label htmlFor="what_to_bring" className="text-base font-medium">What to Bring</Label>
        <Textarea
          id="what_to_bring"
          placeholder="List anything participants should bring:

- Comfortable walking shoes
- Water bottle
- Sunscreen
- Cash for food trucks
- A positive attitude!"
          value={formData.what_to_bring}
          onChange={(e) => updateFormData({ what_to_bring: e.target.value })}
          rows={5}
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Help participants prepare by listing what they should bring.
          </p>
          <AIFieldSuggester
            fieldName="what_to_bring"
            fieldLabel="What to Bring"
            currentValue={formData.what_to_bring}
            onSuggestion={(value) => updateFormData({ what_to_bring: value })}
            questContext={questContext}
          />
        </div>
      </div>

      {/* Dress Code */}
      <div className="space-y-2">
        <Label htmlFor="dress_code" className="text-base font-medium">Dress Code</Label>
        <Input
          id="dress_code"
          placeholder="e.g., Casual and comfortable, Yoga attire, Smart casual"
          value={formData.dress_code}
          onChange={(e) => updateFormData({ dress_code: e.target.value })}
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            What should participants wear? Any specific requirements?
          </p>
          <AIFieldSuggester
            fieldName="dress_code"
            fieldLabel="Dress Code"
            currentValue={formData.dress_code}
            onSuggestion={(value) => updateFormData({ dress_code: value })}
            questContext={questContext}
          />
        </div>
      </div>

      {/* Physical Requirements */}
      <div className="space-y-2">
        <Label htmlFor="physical_requirements" className="text-base font-medium">Physical Requirements</Label>
        <Textarea
          id="physical_requirements"
          placeholder="Describe any physical demands:

e.g., 'Light walking on flat terrain, suitable for all fitness levels'
or 'Moderate hiking with some steep sections, good fitness recommended'"
          value={formData.physical_requirements}
          onChange={(e) => updateFormData({ physical_requirements: e.target.value })}
          rows={4}
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Be honest about physical demands so participants can self-select.
          </p>
          <AIFieldSuggester
            fieldName="physical_requirements"
            fieldLabel="Physical Requirements"
            currentValue={formData.physical_requirements}
            onSuggestion={(value) => updateFormData({ physical_requirements: value })}
            questContext={questContext}
          />
        </div>
      </div>
    </div>
  );
}
