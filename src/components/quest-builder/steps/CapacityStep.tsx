import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { QuestFormData } from '../types';
import { Users, DollarSign, Gift } from 'lucide-react';

interface CapacityStepProps {
  formData: QuestFormData;
  updateFormData: (updates: Partial<QuestFormData>) => void;
}

export function CapacityStep({ formData, updateFormData }: CapacityStepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-creator/5 border border-creator/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-creator mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Group Size & Value</p>
            <p className="text-sm text-muted-foreground">
              Define capacity, costs, and what participants will earn.
            </p>
          </div>
        </div>
      </div>

      {/* Capacity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Squad Size</Label>
          <span className="text-2xl font-bold text-creator">{formData.capacity_total}</span>
        </div>
        <Slider
          value={[formData.capacity_total]}
          onValueChange={([value]) => updateFormData({ capacity_total: value })}
          min={2}
          max={25}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>2 (Intimate)</span>
          <span>25 (Large Group)</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Smaller groups (4-8) create stronger connections. Larger groups work for events.
        </p>
      </div>

      {/* Cost */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="cost_description" className="text-base font-medium">Cost to Participants</Label>
        </div>
        <Input
          id="cost_description"
          placeholder="e.g., Free, $20 per person, $15 (first drink sponsored)"
          value={formData.cost_description}
          onChange={(e) => updateFormData({ cost_description: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          Be specific about what's included and any out-of-pocket expenses.
        </p>
      </div>

      {/* Rewards */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="rewards" className="text-base font-medium">Rewards & What They'll Earn</Label>
        </div>
        <Textarea
          id="rewards"
          placeholder="What do participants get for completing this quest?

Examples:
- +50 XP toward Culture Vulture badge
- Exclusive merch bundle
- $25 gift card to local restaurant
- Bragging rights and new friends!"
          value={formData.rewards}
          onChange={(e) => updateFormData({ rewards: e.target.value })}
          rows={5}
        />
        <p className="text-sm text-muted-foreground">
          Tangible and intangible rewards that make this quest worth joining.
        </p>
      </div>
    </div>
  );
}
