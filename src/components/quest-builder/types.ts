/**
 * Quest Builder Types
 * 
 * Form data structure and step configuration for the 9-step wizard.
 */

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
  
  // Step 3: Experience
  full_description: string;
  highlights: string[];
  
  // Step 4: Objectives
  objectives: string;
  success_criteria: string;
  
  // Step 5: Expectations
  what_to_bring: string;
  dress_code: string;
  physical_requirements: string;
  
  // Step 6: Safety
  safety_notes: string;
  emergency_contact: string;
  age_restriction: string;
  
  // Step 7: Capacity
  capacity_total: number;
  cost_description: string;
  rewards: string;
  
  // Step 8: Media
  image_url: string;
  meeting_location_name: string;
  meeting_address: string;
  whatsapp_invite_link: string;
  
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
  
  // Capacity
  capacity_total: 6,
  cost_description: 'Free',
  rewards: '',
  
  // Media
  image_url: '',
  meeting_location_name: '',
  meeting_address: '',
  whatsapp_invite_link: '',
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
  { id: 3, title: 'Experience', shortTitle: 'Experience', description: 'Describe the adventure', icon: '✨' },
  { id: 4, title: 'Objectives', shortTitle: 'Objectives', description: 'Define goals and success criteria', icon: '🎯' },
  { id: 5, title: 'Expectations', shortTitle: 'Expectations', description: 'What should participants know?', icon: '📝' },
  { id: 6, title: 'Safety', shortTitle: 'Safety', description: 'Important safety information', icon: '🛡️' },
  { id: 7, title: 'Capacity & Cost', shortTitle: 'Capacity', description: 'Size, pricing, and rewards', icon: '💰' },
  { id: 8, title: 'Media & Location', shortTitle: 'Media', description: 'Photos and meeting details', icon: '📍' },
  { id: 9, title: 'Review', shortTitle: 'Review', description: 'Review and submit your quest', icon: '🚀' },
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
