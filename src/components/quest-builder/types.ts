/**
 * Quest Builder Types
 * 
 * Form data structure and step configuration for the quest creation wizard.
 */

// Constraint type definitions matching database enums
export type AlcoholLevel = 'none' | 'optional' | 'primary';
export type AgeRequirement = 'all_ages' | '18_plus' | '21_plus';
export type IntensityLevel = 'low' | 'medium' | 'high';
export type SocialIntensity = 'chill' | 'moderate' | 'high';
export type NoiseLevel = 'quiet' | 'moderate' | 'loud';
export type IndoorOutdoor = 'indoor' | 'outdoor' | 'mixed';
export type AccessibilityLevel = 'unknown' | 'wheelchair_friendly' | 'not_wheelchair_friendly' | 'mixed';
export type BudgetLevel = 'free' | 'low' | 'medium' | 'high' | 'mixed';
export type SafetyLevel = 'public_only' | 'mixed' | 'private_ok_with_host';

// AI Draft types
export interface QuestObjectiveDraft {
  objective_text: string;
  objective_type: string;
  proof_type: string;
  completion_rule: string;
  is_required: boolean;
  ai_generated: boolean;
  objective_order?: number;
}

export interface QuestRoleDraft {
  role_name: string;
  role_description: string;
  ai_generated: boolean;
}

export interface PersonalityAffinityDraft {
  trait_key: string;
  trait_weight: number;
  explanation: string;
  ai_generated: boolean;
}

export interface QuestFormData {
  // Step 1: Basics
  title: string;
  icon: string;
  theme: string;
  progression_tree: 'culture' | 'wellness' | 'connector' | '';
  tags: string[];
  short_description: string;
  
  // Step 2: Timing
  start_datetime: string;
  end_datetime: string;
  duration_notes: string;
  duration_steps: Array<{ label: string; minutes: number }>;
  default_duration_minutes: number;
  
  // Step 3: Constraints (Hard Filters)
  constraints_alcohol: AlcoholLevel;
  constraints_age_requirement: AgeRequirement;
  constraints_physical_intensity: IntensityLevel;
  constraints_social_intensity: SocialIntensity;
  constraints_noise_level: NoiseLevel;
  constraints_indoor_outdoor: IndoorOutdoor;
  constraints_accessibility_level: AccessibilityLevel;
  constraints_budget_level: BudgetLevel;
  safety_level: SafetyLevel;
  
  // Step 4: AI Draft (stored temporarily, saved to separate tables on submit)
  ai_draft_objectives: QuestObjectiveDraft[];
  ai_draft_roles: QuestRoleDraft[];
  ai_draft_personality_affinities: PersonalityAffinityDraft[];
  ai_draft_suggested_tags: string[];
  ai_generated: boolean;
  ai_version: string;
  ai_skipped: boolean;
  
  // Step 5: Experience
  full_description: string;
  highlights: string[];
  
  // Step 6: Objectives (manual entry, merged with AI draft)
  objectives: string;
  success_criteria: string;
  
  // Step 7: Expectations
  what_to_bring: string;
  dress_code: string;
  physical_requirements: string;
  
  // Step 8: Safety
  safety_notes: string;
  emergency_contact: string;
  age_restriction: string;
  
  // Step 9: Capacity & Settings
  capacity_total: number;
  default_squad_size: number;
  cost_description: string;
  rewards: string;
  is_repeatable: boolean;
  
  // Step 10: Media
  image_url: string;
  meeting_location_name: string;
  meeting_address: string;
  
  // Internal
  id?: string;
  slug?: string;
  review_status?: string;
}

export const defaultFormData: QuestFormData = {
  // Basics
  title: '',
  icon: '🎯',
  theme: '',
  progression_tree: '',
  tags: [],
  short_description: '',
  
  // Timing
  start_datetime: '',
  end_datetime: '',
  duration_notes: '',
  duration_steps: [{ label: '', minutes: 30 }],
  default_duration_minutes: 120,
  
  // Constraints
  constraints_alcohol: 'none',
  constraints_age_requirement: 'all_ages',
  constraints_physical_intensity: 'medium',
  constraints_social_intensity: 'moderate',
  constraints_noise_level: 'moderate',
  constraints_indoor_outdoor: 'mixed',
  constraints_accessibility_level: 'unknown',
  constraints_budget_level: 'free',
  safety_level: 'public_only',
  
  // AI Draft
  ai_draft_objectives: [],
  ai_draft_roles: [],
  ai_draft_personality_affinities: [],
  ai_draft_suggested_tags: [],
  ai_generated: false,
  ai_version: '',
  ai_skipped: false,
  
  // Experience
  full_description: '',
  highlights: [],
  
  // Objectives
  objectives: '',
  success_criteria: '',
  
  // Expectations
  what_to_bring: '',
  dress_code: '',
  physical_requirements: '',
  
  // Safety
  safety_notes: '',
  emergency_contact: '',
  age_restriction: '',
  
  // Capacity & Settings
  capacity_total: 6,
  default_squad_size: 4,
  cost_description: 'Free',
  rewards: '',
  is_repeatable: false,
  
  // Media
  image_url: '',
  meeting_location_name: '',
  meeting_address: '',
};

export interface WizardStep {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: 'Quest Basics', shortTitle: 'Basics', description: 'Name and categorize your quest', icon: '📋' },
  { id: 2, title: 'Timing', shortTitle: 'Timing', description: 'When does your quest take place?', icon: '📅' },
  { id: 3, title: 'Constraints', shortTitle: 'Constraints', description: 'Set matching filters', icon: '🎚️' },
  { id: 4, title: 'AI Draft', shortTitle: 'AI Draft', description: 'Generate content with AI', icon: '✨' },
  { id: 5, title: 'Experience', shortTitle: 'Experience', description: 'Describe the adventure', icon: '🎭' },
  { id: 6, title: 'Objectives', shortTitle: 'Objectives', description: 'Define goals and success criteria', icon: '🎯' },
  { id: 7, title: 'Expectations', shortTitle: 'Expectations', description: 'What should participants know?', icon: '📝' },
  { id: 8, title: 'Safety', shortTitle: 'Safety', description: 'Important safety information', icon: '🛡️' },
  { id: 9, title: 'Capacity & Cost', shortTitle: 'Capacity', description: 'Size, pricing, and rewards', icon: '💰' },
  { id: 10, title: 'Media & Location', shortTitle: 'Media', description: 'Photos and meeting details', icon: '📍' },
  { id: 11, title: 'Review', shortTitle: 'Review', description: 'Review and submit your quest', icon: '🚀' },
];

export const PROGRESSION_TREES = [
  { value: 'culture', label: 'Culture Vulture', emoji: '🎭', description: 'Arts, music, food, and local experiences' },
  { value: 'wellness', label: 'Wellness Warrior', emoji: '🧘', description: 'Health, fitness, and mindfulness' },
  { value: 'connector', label: 'Social Connector', emoji: '🤝', description: 'Networking and community building' },
];

export const ICON_OPTIONS = ['🎯', '🎭', '🎨', '🎪', '🎸', '🍺', '☕', '🌮', '🚴', '🧘', '🏃', '⛺', '🌳', '🏖️', '🎬', '📚', '🎮', '🤝', '💃', '🎤'];

export const TAG_SUGGESTIONS = [
  'Outdoor', 'Indoor', 'Music', 'Food & Drink', 'Art', 'Fitness', 
  'Wellness', 'Social', 'Adventure', 'Learning', 'Networking', 
  'Night Out', 'Weekend', 'Family-Friendly', 'Dog-Friendly', '21+'
];
