/**
 * =============================================================================
 * PROFILE TYPES - User Preferences Data Model
 * =============================================================================
 * 
 * This file defines the TypeScript interfaces for user preferences stored
 * in the profiles.preferences JSON column. All questionnaire responses are
 * captured in a structured format suitable for analytics and LLM analysis.
 * 
 * =============================================================================
 */

// Social style preferences
export type GroupSize = 'one_on_one' | 'small_3_5' | 'medium_6_10' | 'depends';
export type GroupTendency = 'jump_in_early' | 'warm_up_slowly' | 'mostly_listen' | 'help_facilitate';
export type PostEventEnergy = 'energized' | 'neutral' | 'drained' | 'depends';

// Intent & motivation
export type Goal = 'make_friends' | 'explore_city' | 'low_pressure' | 'meet_people' | 'get_out' | 'try_new_things';
export type QuestFrequency = 'monthly' | '2_3_per_month' | 'weekly' | 'occasionally';

// Availability
export type TimeSlot = 'weekday_evenings' | 'weekend_daytime' | 'weekend_evenings';
export type PreferredLength = '60_min' | '90_min' | '2_plus_hours';
export type Constraint = 'avoid_loud' | 'prefer_seated' | 'prefer_active' | 'early_nights' | 'accessibility_needs';

// Interests
export type QuestType = 'food_drink' | 'live_music' | 'outdoors' | 'arts_creative' | 'games' | 'learning' | 'volunteering';
export type NotMyThing = 'drinking_focused' | 'big_crowds' | 'early_mornings' | 'late_nights' | 'competitive';

// Group comfort
export type ComfortWith = 'strangers' | 'mixed_new_familiar' | 'mostly_new' | 'mostly_familiar';
export type OpenTo = 'mixed_ages' | 'mixed_backgrounds' | 'first_timers' | 'returning_members';

// Context tags
export type ContextTag = 'new_to_city' | 'remote_wfh' | 'student' | 'career_transition' | 'busy_season' | 'building_routine';

// Demographics (ranges to minimize PII)
export type AgeRange = '18_24' | '25_34' | '35_44' | '45_54' | '55_plus';
export type AustinArea = 'downtown' | 'east_austin' | 'south_austin' | 'north_austin' | 'central' | 'round_rock_pflugerville' | 'cedar_park_leander' | 'other';

// School/University types
export type VerificationTier = 'self_reported' | 'email_verified';

export interface SchoolInfo {
  school_id: string;
  school_name: string;
  verification_tier: VerificationTier;
  verified_at?: string; // ISO timestamp
}

export interface AustinSchool {
  id: string;
  name: string;
  domain: string | null; // Email domain for verification
  emoji: string;
  color: string; // Hex color
}

// Austin-area schools constant
export const AUSTIN_SCHOOLS: AustinSchool[] = [
  { id: 'ut_austin', name: 'UT Austin', domain: 'utexas.edu', emoji: '🤘', color: '#BF5700' },
  { id: 'texas_state', name: 'Texas State', domain: 'txstate.edu', emoji: '🐱', color: '#501214' },
  { id: 'st_edwards', name: "St. Edward's University", domain: 'stedwards.edu', emoji: '⛪', color: '#003087' },
  { id: 'acc', name: 'Austin Community College', domain: 'austincc.edu', emoji: '📚', color: '#00563F' },
  { id: 'concordia', name: 'Concordia University', domain: 'concordia.edu', emoji: '🎓', color: '#002855' },
  { id: 'huston_tillotson', name: 'Huston-Tillotson University', domain: 'htu.edu', emoji: '🏛️', color: '#FFC72C' },
  { id: 'southwestern', name: 'Southwestern University', domain: 'southwestern.edu', emoji: '🏴', color: '#000000' },
  { id: 'texas_aandm', name: 'Texas A&M', domain: 'tamu.edu', emoji: '👍', color: '#500000' },
  { id: 'rice', name: 'Rice University', domain: 'rice.edu', emoji: '🦉', color: '#00205B' },
  { id: 'baylor', name: 'Baylor University', domain: 'baylor.edu', emoji: '🐻', color: '#154734' },
  { id: 'texas_tech', name: 'Texas Tech', domain: 'ttu.edu', emoji: '🔴', color: '#CC0000' },
  { id: 'utsa', name: 'UTSA', domain: 'utsa.edu', emoji: '🏃', color: '#0C2340' },
  { id: 'txst_round_rock', name: 'Texas State (Round Rock)', domain: 'txstate.edu', emoji: '🐱', color: '#501214' },
  { id: 'other', name: 'Other', domain: null, emoji: '🎓', color: '#6B7280' },
];

// Full preferences interface
export interface UserPreferences {
  // Existing field
  interest_tags?: string[];
  
  // Demographics (optional, for matching)
  demographics?: {
    age_range?: AgeRange;
    area?: AustinArea;
    school?: SchoolInfo; // NEW: School/university info
    show_school_publicly?: boolean; // NEW: Privacy toggle
  };
  
  // Social Energy & Style
  social_style?: {
    group_size?: GroupSize[];
    group_tendency?: GroupTendency[];
    post_event_energy?: PostEventEnergy;
    vibe_preference?: number; // 1-5 slider (1=chill, 5=high-energy)
  };
  
  // Intent & Motivation
  intent?: {
    goals?: Goal[]; // up to 2
    quest_frequency?: QuestFrequency;
  };
  
  // Availability & Constraints
  availability?: {
    time_slots?: TimeSlot[];
    preferred_length?: PreferredLength;
    constraints?: Constraint[];
  };
  
  // Interest Signals
  interests?: {
    quest_types?: QuestType[];
    not_my_thing?: NotMyThing[];
  };
  
  // Group Comfort
  group_comfort?: {
    comfort_with?: ComfortWith[];
    open_to?: OpenTo[];
  };
  
  // Context Tags
  context_tags?: ContextTag[];
  
  // Open-ended
  ideal_experience?: string; // max 140 chars
}

// Helper to get school info by ID
export function getSchoolById(schoolId: string): AustinSchool | undefined {
  return AUSTIN_SCHOOLS.find(s => s.id === schoolId);
}

// Check if profile is UT Austin student
export function isUTAustinStudent(preferences: UserPreferences | null | undefined): boolean {
  return preferences?.demographics?.school?.school_id === 'ut_austin';
}

// Check if UT Austin student is email-verified
export function isUTAustinVerified(preferences: UserPreferences | null | undefined): boolean {
  const school = preferences?.demographics?.school;
  return school?.school_id === 'ut_austin' && school?.verification_tier === 'email_verified';
}

// Option definitions for UI rendering
export interface QuestionOption<T extends string> {
  id: T;
  label: string;
  emoji?: string;
}

// Social style options
export const GROUP_SIZE_OPTIONS: QuestionOption<GroupSize>[] = [
  { id: 'one_on_one', label: 'One-on-one' },
  { id: 'small_3_5', label: 'Small groups (3-5)' },
  { id: 'medium_6_10', label: 'Medium groups (6-10)' },
  { id: 'depends', label: 'Depends' },
];

export const GROUP_TENDENCY_OPTIONS: QuestionOption<GroupTendency>[] = [
  { id: 'jump_in_early', label: 'Jump in early' },
  { id: 'warm_up_slowly', label: 'Warm up slowly' },
  { id: 'mostly_listen', label: 'Mostly listen' },
  { id: 'help_facilitate', label: 'Help facilitate' },
];

export const POST_EVENT_ENERGY_OPTIONS: QuestionOption<PostEventEnergy>[] = [
  { id: 'energized', label: 'Energized' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'drained', label: 'Drained' },
  { id: 'depends', label: 'Depends' },
];

// Intent options
export const GOAL_OPTIONS: QuestionOption<Goal>[] = [
  { id: 'make_friends', label: 'Make new friends' },
  { id: 'explore_city', label: 'Explore the city' },
  { id: 'low_pressure', label: 'Low-pressure plans' },
  { id: 'meet_people', label: 'Meet new people' },
  { id: 'get_out', label: 'Get out of the house' },
  { id: 'try_new_things', label: 'Try things I wouldn\'t plan myself' },
];

export const QUEST_FREQUENCY_OPTIONS: QuestionOption<QuestFrequency>[] = [
  { id: 'monthly', label: 'Monthly' },
  { id: '2_3_per_month', label: '2-3× per month' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'occasionally', label: 'Occasionally' },
];

// Availability options
export const TIME_SLOT_OPTIONS: QuestionOption<TimeSlot>[] = [
  { id: 'weekday_evenings', label: 'Weekday evenings' },
  { id: 'weekend_daytime', label: 'Weekend daytime' },
  { id: 'weekend_evenings', label: 'Weekend evenings' },
];

export const PREFERRED_LENGTH_OPTIONS: QuestionOption<PreferredLength>[] = [
  { id: '60_min', label: '~60 min' },
  { id: '90_min', label: '~90 min' },
  { id: '2_plus_hours', label: '2+ hours' },
];

export const CONSTRAINT_OPTIONS: QuestionOption<Constraint>[] = [
  { id: 'avoid_loud', label: 'Avoid loud venues' },
  { id: 'prefer_seated', label: 'Prefer seated' },
  { id: 'prefer_active', label: 'Prefer active' },
  { id: 'early_nights', label: 'Early nights' },
  { id: 'accessibility_needs', label: 'Accessibility needs' },
];

// Interest options
export const QUEST_TYPE_OPTIONS: QuestionOption<QuestType>[] = [
  { id: 'food_drink', label: 'Food & drink', emoji: '🍽️' },
  { id: 'live_music', label: 'Live music/shows', emoji: '🎵' },
  { id: 'outdoors', label: 'Outdoors', emoji: '🌳' },
  { id: 'arts_creative', label: 'Arts/creative', emoji: '🎨' },
  { id: 'games', label: 'Games/playful', emoji: '🎮' },
  { id: 'learning', label: 'Learning', emoji: '📚' },
  { id: 'volunteering', label: 'Volunteering', emoji: '💪' },
];

export const NOT_MY_THING_OPTIONS: QuestionOption<NotMyThing>[] = [
  { id: 'drinking_focused', label: 'Drinking-focused' },
  { id: 'big_crowds', label: 'Big crowds' },
  { id: 'early_mornings', label: 'Early mornings' },
  { id: 'late_nights', label: 'Late nights' },
  { id: 'competitive', label: 'Competitive' },
];

// Group comfort options
export const COMFORT_WITH_OPTIONS: QuestionOption<ComfortWith>[] = [
  { id: 'strangers', label: 'People I don\'t know' },
  { id: 'mixed_new_familiar', label: 'Mixed new/familiar' },
  { id: 'mostly_new', label: 'Mostly new people' },
  { id: 'mostly_familiar', label: 'Mostly familiar' },
];

export const OPEN_TO_OPTIONS: QuestionOption<OpenTo>[] = [
  { id: 'mixed_ages', label: 'Mixed ages' },
  { id: 'mixed_backgrounds', label: 'Mixed backgrounds' },
  { id: 'first_timers', label: 'First-timers' },
  { id: 'returning_members', label: 'Returning members' },
];

// Context tag options
export const CONTEXT_TAG_OPTIONS: QuestionOption<ContextTag>[] = [
  { id: 'new_to_city', label: 'New to the city', emoji: '🏙️' },
  { id: 'remote_wfh', label: 'Remote/WFH', emoji: '💻' },
  { id: 'student', label: 'Student', emoji: '📖' },
  { id: 'career_transition', label: 'Career transition', emoji: '🔄' },
  { id: 'busy_season', label: 'Busy season of life', emoji: '⏰' },
  { id: 'building_routine', label: 'Looking to build routine', emoji: '📅' },
];

// Demographics options (using ranges to minimize PII)
export const AGE_RANGE_OPTIONS: QuestionOption<AgeRange>[] = [
  { id: '18_24', label: '18-24' },
  { id: '25_34', label: '25-34' },
  { id: '35_44', label: '35-44' },
  { id: '45_54', label: '45-54' },
  { id: '55_plus', label: '55+' },
];

export const AUSTIN_AREA_OPTIONS: QuestionOption<AustinArea>[] = [
  { id: 'downtown', label: 'Downtown', emoji: '🏙️' },
  { id: 'east_austin', label: 'East Austin', emoji: '🌅' },
  { id: 'south_austin', label: 'South Austin', emoji: '🌳' },
  { id: 'north_austin', label: 'North Austin', emoji: '🏘️' },
  { id: 'central', label: 'Central/UT Area', emoji: '🎓' },
  { id: 'round_rock_pflugerville', label: 'Round Rock/Pflugerville', emoji: '🏡' },
  { id: 'cedar_park_leander', label: 'Cedar Park/Leander', emoji: '🌲' },
  { id: 'other', label: 'Other/Flexible', emoji: '📍' },
];
