import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { QuestFormData } from '../types';
import { Users, DollarSign, Gift, Repeat, UsersRound } from 'lucide-react';
import { RewardTemplateSelector } from '../RewardTemplateSelector';

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

      {/* Repeatable Quest Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <Repeat className="w-5 h-5 text-primary" />
          <div>
            <Label htmlFor="is_repeatable" className="text-base font-medium cursor-pointer">
              Repeatable Quest
            </Label>
            <p className="text-sm text-muted-foreground">
              Run this quest multiple times with different dates
            </p>
          </div>
        </div>
        <Switch
          id="is_repeatable"
          checked={formData.is_repeatable}
          onCheckedChange={(checked) => updateFormData({ is_repeatable: checked })}
        />
      </div>

      {/* Total Capacity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <Label className="text-base font-medium">Total Capacity</Label>
          </div>
          <span className="text-2xl font-bold text-creator">{formData.capacity_total}</span>
        </div>
        <Slider
          value={[formData.capacity_total]}
          onValueChange={([value]) => updateFormData({ capacity_total: value })}
          min={2}
          max={50}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>2 (Intimate)</span>
          <span>50 (Large Event)</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Maximum number of participants for this quest.
        </p>
      </div>

      {/* Squad Size */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersRound className="w-4 h-4 text-muted-foreground" />
            <Label className="text-base font-medium">Squad Size</Label>
          </div>
          <span className="text-2xl font-bold text-primary">{formData.default_squad_size}</span>
        </div>
        <Slider
          value={[formData.default_squad_size]}
          onValueChange={([value]) => updateFormData({ default_squad_size: value })}
          min={2}
          max={Math.min(12, formData.capacity_total)}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>2 (Pairs)</span>
          <span>{Math.min(12, formData.capacity_total)} (Max)</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Smaller squads (4-6) create stronger connections. Participants will be grouped into squads of this size.
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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="rewards" className="text-base font-medium">Rewards & What They'll Earn</Label>
        </div>
        
        {/* Reward Templates */}
        <RewardTemplateSelector 
          currentValue={formData.rewards}
          onUpdate={(value) => updateFormData({ rewards: value })}
        />
        
        <Textarea
          id="rewards"
          placeholder="What do participants get for completing this quest?

Use the buttons above to add templated rewards, or type your own:
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
