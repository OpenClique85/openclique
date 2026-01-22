import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QuestFormData } from '../types';
import { Target } from 'lucide-react';

interface ObjectivesStepProps {
  formData: QuestFormData;
  updateFormData: (updates: Partial<QuestFormData>) => void;
}

export function ObjectivesStep({ formData, updateFormData }: ObjectivesStepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-creator/5 border border-creator/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-creator mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Internal Goals (Admin-Only)</p>
            <p className="text-sm text-muted-foreground">
              These notes help us understand your vision and measure success. They won't be shown to participants.
            </p>
          </div>
        </div>
      </div>

      {/* Objectives */}
      <div className="space-y-2">
        <Label htmlFor="objectives" className="text-base font-medium">Quest Objectives</Label>
        <Textarea
          id="objectives"
          placeholder="What are the main goals of this quest? What do you want participants to walk away with?

Example:
- Help newcomers to Austin make 2-3 genuine connections
- Introduce people to the local live music scene
- Create a memorable, Instagram-worthy experience"
          value={formData.objectives}
          onChange={(e) => updateFormData({ objectives: e.target.value })}
          rows={6}
        />
        <p className="text-sm text-muted-foreground">
          These help us understand your vision for the experience.
        </p>
      </div>

      {/* Success Criteria */}
      <div className="space-y-2">
        <Label htmlFor="success_criteria" className="text-base font-medium">Success Criteria</Label>
        <Textarea
          id="success_criteria"
          placeholder="How will we know this quest was successful? What metrics matter?

Example:
- 80%+ of participants exchange contact info
- Average rating of 4.5+ stars
- At least 3 social media posts from attendees"
          value={formData.success_criteria}
          onChange={(e) => updateFormData({ success_criteria: e.target.value })}
          rows={6}
        />
        <p className="text-sm text-muted-foreground">
          We'll use these to evaluate and improve future quests.
        </p>
      </div>
    </div>
  );
}
