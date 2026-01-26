/**
 * =============================================================================
 * QUESTS COMPONENTS MODULE
 * =============================================================================
 * 
 * Components for quest discovery, scheduling, and user journey management.
 * Quests are the core unit of activity in OpenClique - structured, time-bound
 * real-world experiences that bring small groups together.
 * 
 * ## Quest Model
 * 
 * ```
 * Quest (template)
 *   └── Quest Instance (specific date/time)
 *         └── Quest Signup (user RSVP)
 *               └── Quest Squad (formed group)
 * ```
 * 
 * ## Key Components
 * 
 * - `InstancePicker` - Select from available dates/times
 * - `QuestJourneyTimeline` - Visual progress through quest lifecycle
 * - `UserWeekCalendarView` - Weekly calendar of user's quests
 * 
 * ## Related Modules
 * - `@/components/admin/quests` - Admin quest management
 * - `@/pages/QuestDetailPage` - Full quest detail view
 * - `@/hooks/useQuestSignup` - Signup logic
 * 
 * @module quests
 */

// -----------------------------------------------------------------------------
// INSTANCE SELECTION
// -----------------------------------------------------------------------------

/** 
 * Modal for selecting a specific date/time instance of a quest.
 * Shows available spots, times, and locations.
 */
export { InstancePicker } from './InstancePicker';

/** Type definition for quest instance data */
export type { QuestInstance } from './InstancePicker';

// -----------------------------------------------------------------------------
// JOURNEY & TIMELINE
// -----------------------------------------------------------------------------

/**
 * Visual timeline showing user's progress through a quest.
 * Stages: Discovery → Signup → Warm-up → Quest Day → Debrief
 */
export { QuestJourneyTimeline } from './QuestJourneyTimeline';

/** Props type for QuestJourneyTimeline */
export type { QuestJourneyTimelineProps } from './QuestJourneyTimeline';

// -----------------------------------------------------------------------------
// CALENDAR VIEWS
// -----------------------------------------------------------------------------

/** Weekly calendar showing user's upcoming quests */
export { UserWeekCalendarView } from './UserWeekCalendarView';
