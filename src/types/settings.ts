/**
 * =============================================================================
 * Settings Types - Privacy, Notification, and Account Management
 * =============================================================================
 */

export interface NotificationPreferences {
  email_quest_recommendations: boolean;
  email_quest_reminders: boolean;
  email_squad_updates: boolean;
  email_marketing: boolean;
  in_app_quest_recommendations: boolean;
  in_app_squad_updates: boolean;
  in_app_general: boolean;
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'squad-only' | 'private';
  show_activity_history: boolean;
  allow_matching: boolean;
  show_in_squad_lists: boolean;
  show_xp_and_badges: boolean;
}

export interface DeletionFeedback {
  reasons: string[];
  other_reason?: string;
  feedback?: string;
  would_return?: 'yes' | 'maybe' | 'no';
  data_exported: boolean;
}

export interface DeletionRequest {
  id: string;
  user_id: string;
  user_email: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  scheduled_at: string;
  processed_at?: string;
  cancellation_reason?: string;
  created_at: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email_quest_recommendations: true,
  email_quest_reminders: true,
  email_squad_updates: true,
  email_marketing: false,
  in_app_quest_recommendations: true,
  in_app_squad_updates: true,
  in_app_general: true,
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profile_visibility: 'public',
  show_activity_history: true,
  allow_matching: true,
  show_in_squad_lists: true,
  show_xp_and_badges: true,
};

export const DELETION_REASONS = [
  { id: 'not_using', label: "I'm not using the app enough" },
  { id: 'no_quests', label: "I didn't find quests I was interested in" },
  { id: 'privacy', label: 'Privacy concerns' },
  { id: 'moving', label: 'Moving away from Austin' },
  { id: 'other_community', label: 'Found another community' },
  { id: 'confusing', label: 'The app was confusing to use' },
  { id: 'bad_experience', label: 'Bad experience with a squad' },
  { id: 'other', label: 'Other' },
] as const;
