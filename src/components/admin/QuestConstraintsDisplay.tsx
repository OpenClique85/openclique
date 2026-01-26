/**
 * QuestConstraintsDisplay
 * 
 * Displays quest constraints (hard filters) in a visual grid format.
 * Used in admin review and quest detail views.
 */

import { Badge } from '@/components/ui/badge';
import { 
  Wine, 
  Users, 
  Zap, 
  Volume2, 
  Sun, 
  Home, 
  Accessibility, 
  DollarSign,
  Clock
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type QuestConstraints = Tables<'quest_constraints'>;

interface QuestConstraintsDisplayProps {
  constraints: QuestConstraints | null;
  compact?: boolean;
}

// Constraint label maps
const ALCOHOL_LABELS: Record<string, { label: string; color: string }> = {
  none: { label: 'No Alcohol', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  optional: { label: 'Alcohol Optional', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  primary: { label: 'Drinking Focused', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const AGE_LABELS: Record<string, { label: string; color: string }> = {
  all_ages: { label: 'All Ages', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  '18_plus': { label: '18+', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  '21_plus': { label: '21+', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const INTENSITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'Low Intensity', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  medium: { label: 'Medium Intensity', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  high: { label: 'High Intensity', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const SOCIAL_LABELS: Record<string, { label: string; color: string }> = {
  chill: { label: 'Chill Vibes', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  moderate: { label: 'Moderate Social', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  high: { label: 'High Energy', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

const NOISE_LABELS: Record<string, { label: string; color: string }> = {
  quiet: { label: 'Quiet', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  moderate: { label: 'Moderate Noise', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  loud: { label: 'Loud', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const TIME_LABELS: Record<string, { label: string }> = {
  morning: { label: 'Morning' },
  afternoon: { label: 'Afternoon' },
  evening: { label: 'Evening' },
  late_night: { label: 'Late Night' },
  flex: { label: 'Flexible' },
};

const LOCATION_LABELS: Record<string, { label: string }> = {
  indoor: { label: 'Indoor' },
  outdoor: { label: 'Outdoor' },
  mixed: { label: 'Indoor/Outdoor' },
};

const ACCESSIBILITY_LABELS: Record<string, { label: string; color: string }> = {
  unknown: { label: 'Unknown', color: 'bg-muted text-muted-foreground' },
  wheelchair_friendly: { label: 'Wheelchair Friendly', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  not_wheelchair_friendly: { label: 'Not Wheelchair Friendly', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  mixed: { label: 'Partially Accessible', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
};

const BUDGET_LABELS: Record<string, { label: string; icon: string }> = {
  free: { label: 'Free', icon: '🆓' },
  low: { label: 'Low ($)', icon: '$' },
  medium: { label: 'Medium ($$)', icon: '$$' },
  high: { label: 'High ($$$)', icon: '$$$' },
  mixed: { label: 'Varies', icon: '~$' },
};

export function QuestConstraintsDisplay({ constraints, compact = false }: QuestConstraintsDisplayProps) {
  if (!constraints) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No constraints set
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {/* Priority constraints shown in compact mode */}
        <Badge variant="outline" className={ALCOHOL_LABELS[constraints.alcohol]?.color || ''}>
          <Wine className="h-3 w-3 mr-1" />
          {ALCOHOL_LABELS[constraints.alcohol]?.label}
        </Badge>
        <Badge variant="outline" className={AGE_LABELS[constraints.age_requirement]?.color || ''}>
          {AGE_LABELS[constraints.age_requirement]?.label}
        </Badge>
        <Badge variant="outline" className={INTENSITY_LABELS[constraints.physical_intensity]?.color || ''}>
          <Zap className="h-3 w-3 mr-1" />
          {INTENSITY_LABELS[constraints.physical_intensity]?.label}
        </Badge>
        <Badge variant="outline">
          {BUDGET_LABELS[constraints.budget_level]?.icon} {BUDGET_LABELS[constraints.budget_level]?.label}
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Quest Constraints (Hard Filters)</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {/* Alcohol */}
        <div className="flex items-center gap-2">
          <Wine className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className={ALCOHOL_LABELS[constraints.alcohol]?.color || ''}>
            {ALCOHOL_LABELS[constraints.alcohol]?.label || constraints.alcohol}
          </Badge>
        </div>

        {/* Age */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className={AGE_LABELS[constraints.age_requirement]?.color || ''}>
            {AGE_LABELS[constraints.age_requirement]?.label || constraints.age_requirement}
          </Badge>
        </div>

        {/* Physical Intensity */}
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className={INTENSITY_LABELS[constraints.physical_intensity]?.color || ''}>
            {INTENSITY_LABELS[constraints.physical_intensity]?.label || constraints.physical_intensity}
          </Badge>
        </div>

        {/* Social Intensity */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className={SOCIAL_LABELS[constraints.social_intensity]?.color || ''}>
            {SOCIAL_LABELS[constraints.social_intensity]?.label || constraints.social_intensity}
          </Badge>
        </div>

        {/* Noise Level */}
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className={NOISE_LABELS[constraints.noise_level]?.color || ''}>
            {NOISE_LABELS[constraints.noise_level]?.label || constraints.noise_level}
          </Badge>
        </div>

        {/* Time of Day */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline">
            {TIME_LABELS[constraints.time_of_day]?.label || constraints.time_of_day}
          </Badge>
        </div>

        {/* Indoor/Outdoor */}
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline">
            {LOCATION_LABELS[constraints.indoor_outdoor]?.label || constraints.indoor_outdoor}
          </Badge>
        </div>

        {/* Accessibility */}
        <div className="flex items-center gap-2">
          <Accessibility className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className={ACCESSIBILITY_LABELS[constraints.accessibility_level]?.color || ''}>
            {ACCESSIBILITY_LABELS[constraints.accessibility_level]?.label || constraints.accessibility_level}
          </Badge>
        </div>

        {/* Budget */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline">
            {BUDGET_LABELS[constraints.budget_level]?.label || constraints.budget_level}
          </Badge>
        </div>
      </div>
    </div>
  );
}
