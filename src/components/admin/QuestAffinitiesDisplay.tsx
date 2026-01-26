/**
 * QuestAffinitiesDisplay
 * 
 * Displays quest personality affinities (soft matching factors) with weights and explanations.
 * Used in admin review to understand AI-suggested matching criteria.
 */

import { Badge } from '@/components/ui/badge';
import { Sparkles, Brain } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type QuestPersonalityAffinity = Tables<'quest_personality_affinity'>;

interface QuestAffinitiesDisplayProps {
  affinities: QuestPersonalityAffinity[] | null;
  compact?: boolean;
}

// Trait key display labels
const TRAIT_LABELS: Record<string, { label: string; emoji: string }> = {
  introversion_fit: { label: 'Introvert-Friendly', emoji: '🧘' },
  extroversion_fit: { label: 'Extrovert-Friendly', emoji: '🎉' },
  novelty_seeking: { label: 'Novelty Seekers', emoji: '🆕' },
  structure_needed: { label: 'Structure Lovers', emoji: '📋' },
  planner_fit: { label: 'Planners', emoji: '📅' },
  spontaneity_fit: { label: 'Spontaneous', emoji: '⚡' },
  group_leadership: { label: 'Natural Leaders', emoji: '👑' },
  low_social_anxiety: { label: 'Social Butterflies', emoji: '🦋' },
  high_social_anxiety_support: { label: 'Anxiety-Supportive', emoji: '💚' },
  competitive: { label: 'Competitive', emoji: '🏆' },
  reflective: { label: 'Reflective', emoji: '🪞' },
  creative: { label: 'Creative', emoji: '🎨' },
  adventurous: { label: 'Adventurous', emoji: '🧗' },
  foodie: { label: 'Food Lovers', emoji: '🍽️' },
  culture_vulture: { label: 'Culture Enthusiasts', emoji: '🎭' },
  wellness_focused: { label: 'Wellness-Minded', emoji: '🧘' },
  night_owl: { label: 'Night Owls', emoji: '🦉' },
  early_bird: { label: 'Early Birds', emoji: '🐦' },
};

// Weight to color mapping
function getWeightColor(weight: number): string {
  if (weight >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (weight >= 60) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (weight >= 40) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-muted text-muted-foreground';
}

function getWeightLabel(weight: number): string {
  if (weight >= 80) return 'Strong';
  if (weight >= 60) return 'Good';
  if (weight >= 40) return 'Moderate';
  return 'Weak';
}

export function QuestAffinitiesDisplay({ affinities, compact = false }: QuestAffinitiesDisplayProps) {
  if (!affinities || affinities.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No personality affinities set
      </div>
    );
  }

  // Sort by weight descending
  const sortedAffinities = [...affinities].sort((a, b) => b.trait_weight - a.trait_weight);

  if (compact) {
    // Show top 3 in compact mode
    return (
      <div className="flex flex-wrap gap-1.5">
        {sortedAffinities.slice(0, 3).map((affinity) => {
          const trait = TRAIT_LABELS[affinity.trait_key];
          return (
            <Badge
              key={affinity.id}
              variant="outline"
              className={getWeightColor(affinity.trait_weight)}
            >
              {trait?.emoji || '🎯'} {trait?.label || affinity.trait_key}
            </Badge>
          );
        })}
        {sortedAffinities.length > 3 && (
          <Badge variant="secondary">+{sortedAffinities.length - 3} more</Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <Brain className="h-4 w-4" />
        Personality Affinities (Soft Matching)
      </h4>
      <div className="space-y-2">
        {sortedAffinities.map((affinity) => {
          const trait = TRAIT_LABELS[affinity.trait_key];
          return (
            <div
              key={affinity.id}
              className="flex items-start gap-3 p-2 rounded-lg bg-muted/30"
            >
              <span className="text-lg">{trait?.emoji || '🎯'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {trait?.label || affinity.trait_key}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getWeightColor(affinity.trait_weight)}`}
                  >
                    {affinity.trait_weight}% • {getWeightLabel(affinity.trait_weight)}
                  </Badge>
                  {affinity.ai_generated && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI
                    </Badge>
                  )}
                </div>
                {affinity.explanation && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {affinity.explanation}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
