/**
 * Quest Data Saver
 * 
 * Handles persisting quest-related data to normalized tables:
 * - quest_constraints (hard filters for discovery)
 * - quest_objectives (structured goals)
 * - quest_roles (squad role suggestions)
 * - quest_personality_affinity (soft matching weights)
 */

import { supabase } from '@/integrations/supabase/client';
import type { QuestFormData } from '@/components/quest-builder/types';
import type { Database } from '@/integrations/supabase/types';

// Type aliases for database enums
type ObjectiveType = Database['public']['Enums']['quest_objective_type'];
type ProofType = Database['public']['Enums']['quest_proof_type'];
type CompletionRule = Database['public']['Enums']['quest_completion_rule'];
type RoleName = Database['public']['Enums']['quest_role_name'];
type AlcoholLevel = Database['public']['Enums']['quest_alcohol_level'];
type AgeRequirement = Database['public']['Enums']['quest_age_requirement'];
type IntensityLevel = Database['public']['Enums']['quest_intensity_level'];
type SocialIntensity = Database['public']['Enums']['quest_social_intensity'];
type NoiseLevel = Database['public']['Enums']['quest_noise_level'];
type IndoorOutdoor = Database['public']['Enums']['quest_indoor_outdoor'];
type AccessibilityLevel = Database['public']['Enums']['quest_accessibility_level'];
type BudgetLevel = Database['public']['Enums']['quest_budget_level'];
type SafetyLevel = Database['public']['Enums']['quest_safety_level'];

// Valid role names from enum
const VALID_ROLE_NAMES: RoleName[] = ['Navigator', 'Timekeeper', 'Vibe Curator', 'Photographer', 'Connector', 'Wildcard'];

interface SaveRelatedDataResult {
  success: boolean;
  error?: string;
  savedCounts: {
    constraints: boolean;
    objectives: number;
    roles: number;
    affinities: number;
  };
}

/**
 * Save all quest-related data to normalized tables
 * Call this after the main quest record is created/updated
 */
export async function saveQuestRelatedData(
  questId: string,
  formData: QuestFormData
): Promise<SaveRelatedDataResult> {
  const savedCounts = {
    constraints: false,
    objectives: 0,
    roles: 0,
    affinities: 0,
  };

  try {
    // 1. Save/update quest_constraints
    // Note: Database column names match DB schema (e.g., 'alcohol' not 'alcohol_level')
    const constraintsData = {
      quest_id: questId,
      alcohol: (formData.constraints_alcohol || 'none') as AlcoholLevel,
      age_requirement: (formData.constraints_age_requirement || 'all_ages') as AgeRequirement,
      physical_intensity: (formData.constraints_physical_intensity || 'medium') as IntensityLevel,
      social_intensity: (formData.constraints_social_intensity || 'moderate') as SocialIntensity,
      noise_level: (formData.constraints_noise_level || 'moderate') as NoiseLevel,
      indoor_outdoor: (formData.constraints_indoor_outdoor || 'mixed') as IndoorOutdoor,
      accessibility_level: (formData.constraints_accessibility_level || 'unknown') as AccessibilityLevel,
      budget_level: (formData.constraints_budget_level || 'free') as BudgetLevel,
      safety_level: (formData.safety_level || 'public_only') as SafetyLevel,
    };

    // Upsert constraints (one per quest)
    const { error: constraintsError } = await supabase
      .from('quest_constraints')
      .upsert(constraintsData, { onConflict: 'quest_id' });

    if (constraintsError) {
      console.error('Error saving constraints:', constraintsError);
    } else {
      savedCounts.constraints = true;
    }

    // 2. Save quest_objectives (from AI draft or manual entry)
    if (formData.ai_draft_objectives && formData.ai_draft_objectives.length > 0) {
      // Delete existing objectives first
      await supabase
        .from('quest_objectives')
        .delete()
        .eq('quest_id', questId);

      // Insert new objectives with proper type casting
      const objectivesData = formData.ai_draft_objectives.map((obj, index) => ({
        quest_id: questId,
        objective_text: obj.objective_text,
        objective_type: (obj.objective_type || 'task') as ObjectiveType,
        proof_type: (obj.proof_type || 'none') as ProofType,
        completion_rule: (obj.completion_rule || 'all_members') as CompletionRule,
        is_required: obj.is_required ?? true,
        ai_generated: obj.ai_generated ?? false,
        objective_order: index + 1,
      }));

      const { error: objectivesError, data: insertedObjectives } = await supabase
        .from('quest_objectives')
        .insert(objectivesData)
        .select();

      if (objectivesError) {
        console.error('Error saving objectives:', objectivesError);
      } else {
        savedCounts.objectives = insertedObjectives?.length || 0;
      }
    }

    // 3. Save quest_roles (from AI draft)
    // Note: role_name is an enum, so we need to map AI-generated names to valid values
    if (formData.ai_draft_roles && formData.ai_draft_roles.length > 0) {
      // Delete existing roles first
      await supabase
        .from('quest_roles')
        .delete()
        .eq('quest_id', questId);

      // Map role names to valid enum values
      const rolesData = formData.ai_draft_roles
        .map(role => {
          // Try to match AI role name to a valid enum value
          const matchedRole = VALID_ROLE_NAMES.find(
            validName => validName.toLowerCase() === role.role_name.toLowerCase()
          );
          
          if (!matchedRole) {
            // Default to Wildcard for unrecognized roles
            console.warn(`Role "${role.role_name}" not in enum, defaulting to Wildcard`);
          }

          return {
            quest_id: questId,
            role_name: (matchedRole || 'Wildcard') as RoleName,
            role_description: role.role_description || null,
            ai_generated: role.ai_generated ?? false,
          };
        });

      const { error: rolesError, data: insertedRoles } = await supabase
        .from('quest_roles')
        .insert(rolesData)
        .select();

      if (rolesError) {
        console.error('Error saving roles:', rolesError);
      } else {
        savedCounts.roles = insertedRoles?.length || 0;
      }
    }

    // 4. Save quest_personality_affinity (from AI draft)
    if (formData.ai_draft_personality_affinities && formData.ai_draft_personality_affinities.length > 0) {
      // Delete existing affinities first
      await supabase
        .from('quest_personality_affinity')
        .delete()
        .eq('quest_id', questId);

      // Insert new affinities
      const affinitiesData = formData.ai_draft_personality_affinities.map(aff => ({
        quest_id: questId,
        trait_key: aff.trait_key,
        trait_weight: aff.trait_weight ?? 1.0,
        explanation: aff.explanation || null,
        ai_generated: aff.ai_generated ?? false,
      }));

      const { error: affinitiesError, data: insertedAffinities } = await supabase
        .from('quest_personality_affinity')
        .insert(affinitiesData)
        .select();

      if (affinitiesError) {
        console.error('Error saving personality affinities:', affinitiesError);
      } else {
        savedCounts.affinities = insertedAffinities?.length || 0;
      }
    }

    return { success: true, savedCounts };
  } catch (error: any) {
    console.error('Error saving quest related data:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to save quest data',
      savedCounts 
    };
  }
}

/**
 * Generate default objectives from plain text objectives field
 * Used when AI draft was skipped but creator entered objectives manually
 */
export function parseManualObjectives(objectivesText: string): Array<{
  objective_text: string;
  objective_type: string;
  proof_type: string;
  completion_rule: string;
  is_required: boolean;
  ai_generated: boolean;
}> {
  if (!objectivesText?.trim()) return [];

  // Split by line breaks or numbered list patterns
  const lines = objectivesText
    .split(/\n+/)
    .map(line => line.replace(/^[\d\.\-\*\)\]\s]+/, '').trim())
    .filter(line => line.length > 0);

  return lines.map((text, index) => ({
    objective_text: text,
    objective_type: 'task',
    proof_type: 'none',
    completion_rule: 'all_members',
    is_required: index === 0, // First objective is required by default
    ai_generated: false,
  }));
}
