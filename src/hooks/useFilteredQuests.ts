/**
 * useFilteredQuests
 * 
 * Hook for fetching and filtering quests based on user preferences.
 * Implements:
 * - Hard filters (alcohol, age, accessibility) - these EXCLUDE quests
 * - Soft affinity scoring - these RANK quests by match quality
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { UserPreferences } from '@/types/profile';

type DbQuest = Tables<'quests'>;
type QuestConstraints = Tables<'quest_constraints'>;
type QuestPersonalityAffinity = Tables<'quest_personality_affinity'>;

// Extended quest with constraints and affinity data
export interface FilteredQuest extends DbQuest {
  constraints: QuestConstraints | null;
  affinities: QuestPersonalityAffinity[];
  sponsor_profiles?: { name: string } | null;
  match_score: number;
  match_reason?: string;
}

// Matching filter preferences
export interface MatchingFilters {
  alcohol_preference?: 'no_alcohol' | 'ok_optional' | 'likes_drinking';
  physical_preference?: 'low' | 'medium' | 'high' | 'any';
  social_preference?: 'chill' | 'moderate' | 'high' | 'any';
  accessibility_needed?: boolean;
  birthdate?: string; // ISO date for age gating
}

interface UseFilteredQuestsOptions {
  matchingFilters?: MatchingFilters;
  userTraits?: Record<string, number>; // trait_key -> weight (0-100)
  enabled?: boolean;
}

// Calculate user age from birthdate
function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Apply hard filters - returns true if quest should be INCLUDED
function passesHardFilters(
  constraints: QuestConstraints | null,
  filters: MatchingFilters
): { passes: boolean; reason?: string } {
  if (!constraints) {
    // No constraints = passes all filters
    return { passes: true };
  }

  // Alcohol filter
  if (filters.alcohol_preference === 'no_alcohol') {
    if (constraints.alcohol === 'primary') {
      return { passes: false, reason: 'Excludes drinking-focused quests' };
    }
  }

  // Age filter
  if (filters.birthdate) {
    const age = calculateAge(filters.birthdate);
    if (constraints.age_requirement === '21_plus' && age < 21) {
      return { passes: false, reason: 'Age requirement not met (21+)' };
    }
    if (constraints.age_requirement === '18_plus' && age < 18) {
      return { passes: false, reason: 'Age requirement not met (18+)' };
    }
  }

  // Accessibility filter
  if (filters.accessibility_needed) {
    if (constraints.accessibility_level === 'not_wheelchair_friendly') {
      return { passes: false, reason: 'Not accessible' };
    }
  }

  // Physical intensity filter (soft exclusion for mismatches)
  if (filters.physical_preference && filters.physical_preference !== 'any') {
    // Only exclude if very mismatched (e.g., user prefers low but quest is high)
    if (filters.physical_preference === 'low' && constraints.physical_intensity === 'high') {
      return { passes: false, reason: 'Physical intensity too high' };
    }
  }

  return { passes: true };
}

// Calculate affinity score based on user traits
function calculateAffinityScore(
  affinities: QuestPersonalityAffinity[],
  userTraits: Record<string, number>
): { score: number; topMatch?: { trait: string; explanation: string } } {
  if (!affinities.length || !Object.keys(userTraits).length) {
    return { score: 50 }; // Default neutral score
  }

  let totalScore = 0;
  let totalWeight = 0;
  let topMatch: { trait: string; explanation: string; score: number } | undefined;

  for (const affinity of affinities) {
    const userWeight = userTraits[affinity.trait_key];
    if (userWeight !== undefined) {
      // Calculate match: higher when both quest and user weights are high
      const matchScore = (affinity.trait_weight * userWeight) / 100;
      totalScore += matchScore;
      totalWeight += affinity.trait_weight;

      // Track the best matching trait for "Why this fits"
      if (!topMatch || matchScore > topMatch.score) {
        topMatch = {
          trait: affinity.trait_key,
          explanation: affinity.explanation || `Great for ${affinity.trait_key} types`,
          score: matchScore,
        };
      }
    }
  }

  const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 50;
  
  return {
    score: Math.round(Math.min(100, Math.max(0, finalScore))),
    topMatch: topMatch ? { trait: topMatch.trait, explanation: topMatch.explanation } : undefined,
  };
}

export function useFilteredQuests(options: UseFilteredQuestsOptions = {}) {
  const { matchingFilters = {}, userTraits = {}, enabled = true } = options;

  return useQuery({
    queryKey: ['filtered-quests', matchingFilters, userTraits],
    queryFn: async (): Promise<FilteredQuest[]> => {
      // Fetch quests with constraints and affinities
      const { data: quests, error: questsError } = await supabase
        .from('quests')
        .select(`
          *,
          sponsor_profiles(name)
        `)
        .eq('status', 'open')
        .eq('review_status', 'approved')
        .order('start_datetime', { ascending: true });

      if (questsError) throw questsError;
      if (!quests?.length) return [];

      // Fetch constraints for all quests
      const questIds = quests.map(q => q.id);
      const { data: allConstraints } = await supabase
        .from('quest_constraints')
        .select('*')
        .in('quest_id', questIds);

      // Fetch affinities for all quests
      const { data: allAffinities } = await supabase
        .from('quest_personality_affinity')
        .select('*')
        .in('quest_id', questIds);

      // Build constraint and affinity maps
      const constraintMap = new Map<string, QuestConstraints>();
      (allConstraints || []).forEach(c => constraintMap.set(c.quest_id, c));

      const affinityMap = new Map<string, QuestPersonalityAffinity[]>();
      (allAffinities || []).forEach(a => {
        const existing = affinityMap.get(a.quest_id) || [];
        existing.push(a);
        affinityMap.set(a.quest_id, existing);
      });

      // Process each quest
      const filteredQuests: FilteredQuest[] = [];

      for (const quest of quests) {
        const constraints = constraintMap.get(quest.id) || null;
        const affinities = affinityMap.get(quest.id) || [];

        // Apply hard filters
        const filterResult = passesHardFilters(constraints, matchingFilters);
        if (!filterResult.passes) {
          continue; // Skip this quest
        }

        // Calculate affinity score
        const affinityResult = calculateAffinityScore(affinities, userTraits);

        filteredQuests.push({
          ...quest,
          constraints,
          affinities,
          match_score: affinityResult.score,
          match_reason: affinityResult.topMatch?.explanation,
        });
      }

      // Sort by match score (descending), then by date
      filteredQuests.sort((a, b) => {
        // First by score
        if (b.match_score !== a.match_score) {
          return b.match_score - a.match_score;
        }
        // Then by date
        const dateA = a.start_datetime ? new Date(a.start_datetime).getTime() : Infinity;
        const dateB = b.start_datetime ? new Date(b.start_datetime).getTime() : Infinity;
        return dateA - dateB;
      });

      return filteredQuests;
    },
    enabled,
  });
}

// Hook to get user's matching filters from their preferences
export function useUserMatchingFilters(preferences: UserPreferences | null | undefined): MatchingFilters {
  if (!preferences) return {};

  const filters: MatchingFilters = {};

  // Map not_my_thing to alcohol preference
  if (preferences.interests?.not_my_thing?.includes('drinking_focused')) {
    filters.alcohol_preference = 'no_alcohol';
  }

  // Map constraints to accessibility
  if (preferences.availability?.constraints?.includes('accessibility_needs')) {
    filters.accessibility_needed = true;
  }

  // Map social style to preferences
  const vibePreference = preferences.social_style?.vibe_preference;
  if (vibePreference !== undefined) {
    if (vibePreference <= 2) {
      filters.social_preference = 'chill';
    } else if (vibePreference >= 4) {
      filters.social_preference = 'high';
    } else {
      filters.social_preference = 'moderate';
    }
  }

  // Map constraints to physical preference
  if (preferences.availability?.constraints?.includes('prefer_seated')) {
    filters.physical_preference = 'low';
  } else if (preferences.availability?.constraints?.includes('prefer_active')) {
    filters.physical_preference = 'high';
  }

  return filters;
}

// Hook to extract user traits for affinity matching
export function useUserTraitsForMatching(preferences: UserPreferences | null | undefined): Record<string, number> {
  if (!preferences) return {};

  const traits: Record<string, number> = {};

  // Map social energy
  const postEventEnergy = preferences.social_style?.post_event_energy;
  if (postEventEnergy === 'energized') {
    traits.extroversion_fit = 80;
    traits.high_social_anxiety_support = 20;
  } else if (postEventEnergy === 'drained') {
    traits.introversion_fit = 80;
    traits.high_social_anxiety_support = 60;
  }

  // Map vibe preference
  const vibePreference = preferences.social_style?.vibe_preference;
  if (vibePreference !== undefined) {
    if (vibePreference <= 2) {
      traits.reflective = 70;
      traits.low_social_anxiety = 30;
    } else if (vibePreference >= 4) {
      traits.competitive = 60;
      traits.extroversion_fit = 70;
    }
  }

  // Map group tendency
  const tendency = preferences.social_style?.group_tendency;
  if (tendency?.includes('help_facilitate')) {
    traits.group_leadership = 80;
    traits.connector = 70;
  }
  if (tendency?.includes('mostly_listen')) {
    traits.reflective = 70;
    traits.introversion_fit = 60;
  }

  // Map quest types to traits
  const questTypes = preferences.interests?.quest_types || [];
  if (questTypes.includes('arts_creative')) {
    traits.creative = 80;
  }
  if (questTypes.includes('outdoors')) {
    traits.adventurous = 70;
  }
  if (questTypes.includes('food_drink')) {
    traits.foodie = 80;
  }

  // Map context tags
  const contextTags = preferences.context_tags || [];
  if (contextTags.includes('new_to_city')) {
    traits.novelty_seeking = 70;
  }

  return traits;
}
