import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { QuestFormData } from '../types';
import { ClipboardList } from 'lucide-react';

interface ExpectationsStepProps {
  formData: QuestFormData;
  updateFormData: (updates: Partial<QuestFormData>) => void;
}

export function ExpectationsStep({ formData, updateFormData }: ExpectationsStepProps) {
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
        <p className="text-sm text-muted-foreground">
          What should participants wear? Any specific requirements?
        </p>
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
        <p className="text-sm text-muted-foreground">
          Be honest about physical demands so participants can self-select.
        </p>
      </div>
    </div>
  );
}
