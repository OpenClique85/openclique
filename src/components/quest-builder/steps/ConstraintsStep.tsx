import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QuestFormData } from '../types';
import { Filter, Wine, Users, Zap, Volume2, Sun, Accessibility } from 'lucide-react';

interface ConstraintsStepProps {
  formData: QuestFormData;
  updateFormData: (updates: Partial<QuestFormData>) => void;
}

const ALCOHOL_OPTIONS = [
  { value: 'none', label: 'No alcohol', description: 'No drinking involved' },
  { value: 'optional', label: 'Alcohol optional', description: 'Available but not central' },
  { value: 'primary', label: 'Drinking is a main part', description: 'Bar crawl, brewery tour, etc.' },
];

const AGE_OPTIONS = [
  { value: 'all_ages', label: 'All ages', description: 'Everyone welcome' },
  { value: '18_plus', label: '18+', description: 'Adults only' },
  { value: '21_plus', label: '21+', description: 'Legal drinking age required' },
];

const PHYSICAL_OPTIONS = [
  { value: 'low', label: 'Low', description: 'Mostly sitting/standing' },
  { value: 'medium', label: 'Medium', description: 'Some walking/activity' },
  { value: 'high', label: 'High', description: 'Athletic/strenuous' },
];

const SOCIAL_OPTIONS = [
  { value: 'chill', label: 'Chill', description: 'Relaxed conversation' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced interaction' },
  { value: 'high', label: 'High-energy', description: 'Lots of socializing' },
];

const NOISE_OPTIONS = [
  { value: 'quiet', label: 'Quiet', description: 'Easy to talk' },
  { value: 'moderate', label: 'Moderate', description: 'Some background noise' },
  { value: 'loud', label: 'Loud', description: 'Concert, club, etc.' },
];

const INDOOR_OUTDOOR_OPTIONS = [
  { value: 'indoor', label: 'Indoor', description: 'Inside venue' },
  { value: 'outdoor', label: 'Outdoor', description: 'Outside activity' },
  { value: 'mixed', label: 'Mixed', description: 'Both indoor and outdoor' },
];

const ACCESSIBILITY_OPTIONS = [
  { value: 'unknown', label: 'Unknown', description: 'Not sure yet' },
  { value: 'wheelchair_friendly', label: 'Wheelchair-friendly', description: 'Fully accessible' },
  { value: 'not_wheelchair_friendly', label: 'Not wheelchair-friendly', description: 'Has accessibility barriers' },
  { value: 'mixed', label: 'Mixed', description: 'Partially accessible' },
];

const BUDGET_OPTIONS = [
  { value: 'free', label: 'Free', description: 'No cost' },
  { value: 'low', label: 'Low ($)', description: 'Under $20' },
  { value: 'medium', label: 'Medium ($$)', description: '$20-50' },
  { value: 'high', label: 'High ($$$)', description: '$50+' },
  { value: 'mixed', label: 'Mixed / depends', description: 'Varies by choice' },
];

const SAFETY_OPTIONS = [
  { value: 'public_only', label: 'Public venues only', description: 'All activities in public spaces' },
  { value: 'mixed', label: 'Mixed', description: 'Some private elements' },
  { value: 'private_ok_with_host', label: 'Private OK with host', description: 'May include private venues' },
];

interface ConstraintGroupProps {
  icon: React.ReactNode;
  label: string;
  helperText?: string;
  options: Array<{ value: string; label: string; description: string }>;
  value: string;
  onChange: (value: string) => void;
}

function ConstraintGroup({ icon, label, helperText, options, value, onChange }: ConstraintGroupProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <Label className="text-base font-medium">{label}</Label>
      </div>
      {helperText && <p className="text-sm text-muted-foreground -mt-1">{helperText}</p>}
      <RadioGroup value={value} onValueChange={onChange} className="grid gap-2">
        {options.map((option) => (
          <Label
            key={option.value}
            htmlFor={`${label}-${option.value}`}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              value === option.value
                ? 'border-creator bg-creator/5'
                : 'border-border hover:border-creator/50'
            }`}
          >
            <RadioGroupItem value={option.value} id={`${label}-${option.value}`} className="sr-only" />
            <div className="flex-1">
              <p className="font-medium text-sm">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
            {value === option.value && (
              <div className="w-2 h-2 rounded-full bg-creator" />
            )}
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}

export function ConstraintsStep({ formData, updateFormData }: ConstraintsStepProps) {
  return (
    <div className="space-y-8">
      <div className="bg-creator/5 border border-creator/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Filter className="w-5 h-5 text-creator mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Make sure the right people see this quest</p>
            <p className="text-sm text-muted-foreground">
              These settings control who we show it to. Be honest—this prevents bad fits.
            </p>
          </div>
        </div>
      </div>

      {/* Alcohol */}
      <ConstraintGroup
        icon={<Wine className="w-5 h-5 text-muted-foreground" />}
        label="Alcohol"
        helperText="Non-drinkers won't be shown drinking-first quests."
        options={ALCOHOL_OPTIONS}
        value={formData.constraints_alcohol || 'none'}
        onChange={(value) => updateFormData({ constraints_alcohol: value as QuestFormData['constraints_alcohol'] })}
      />

      {/* Age Requirement */}
      <ConstraintGroup
        icon={<Users className="w-5 h-5 text-muted-foreground" />}
        label="Age requirement"
        options={AGE_OPTIONS}
        value={formData.constraints_age_requirement || 'all_ages'}
        onChange={(value) => updateFormData({ constraints_age_requirement: value as QuestFormData['constraints_age_requirement'] })}
      />

      {/* Physical Intensity */}
      <ConstraintGroup
        icon={<Zap className="w-5 h-5 text-muted-foreground" />}
        label="Physical intensity"
        options={PHYSICAL_OPTIONS}
        value={formData.constraints_physical_intensity || 'medium'}
        onChange={(value) => updateFormData({ constraints_physical_intensity: value as QuestFormData['constraints_physical_intensity'] })}
      />

      {/* Social Intensity */}
      <ConstraintGroup
        icon={<Users className="w-5 h-5 text-muted-foreground" />}
        label="Social intensity"
        options={SOCIAL_OPTIONS}
        value={formData.constraints_social_intensity || 'moderate'}
        onChange={(value) => updateFormData({ constraints_social_intensity: value as QuestFormData['constraints_social_intensity'] })}
      />

      {/* Noise Level */}
      <ConstraintGroup
        icon={<Volume2 className="w-5 h-5 text-muted-foreground" />}
        label="Noise level"
        options={NOISE_OPTIONS}
        value={formData.constraints_noise_level || 'moderate'}
        onChange={(value) => updateFormData({ constraints_noise_level: value as QuestFormData['constraints_noise_level'] })}
      />

      {/* Indoor / Outdoor */}
      <ConstraintGroup
        icon={<Sun className="w-5 h-5 text-muted-foreground" />}
        label="Indoor / Outdoor"
        options={INDOOR_OUTDOOR_OPTIONS}
        value={formData.constraints_indoor_outdoor || 'mixed'}
        onChange={(value) => updateFormData({ constraints_indoor_outdoor: value as QuestFormData['constraints_indoor_outdoor'] })}
      />

      {/* Accessibility */}
      <ConstraintGroup
        icon={<Accessibility className="w-5 h-5 text-muted-foreground" />}
        label="Accessibility"
        options={ACCESSIBILITY_OPTIONS}
        value={formData.constraints_accessibility_level || 'unknown'}
        onChange={(value) => updateFormData({ constraints_accessibility_level: value as QuestFormData['constraints_accessibility_level'] })}
      />

      {/* Budget */}
      <ConstraintGroup
        icon={<span className="text-muted-foreground">💰</span>}
        label="Budget"
        options={BUDGET_OPTIONS}
        value={formData.constraints_budget_level || 'free'}
        onChange={(value) => updateFormData({ constraints_budget_level: value as QuestFormData['constraints_budget_level'] })}
      />

      {/* Safety Setting */}
      <ConstraintGroup
        icon={<span className="text-muted-foreground">🛡️</span>}
        label="Safety setting"
        options={SAFETY_OPTIONS}
        value={formData.safety_level || 'public_only'}
        onChange={(value) => updateFormData({ safety_level: value as QuestFormData['safety_level'] })}
      />
    </div>
  );
}
