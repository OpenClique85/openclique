/**
 * OpenClique Quest Data
 * 
 * Central export for all quest-related data.
 * Quests are organized by category for easier maintenance.
 */

// Types
export type { Quest, QuestSection } from './types';

// Page configuration
export { QUESTS_PAGE } from './page-config';

// Quest categories
import { CULTURE_QUESTS } from './culture-quests';
import { WELLNESS_QUESTS } from './wellness-quests';
import { CONNECTOR_QUESTS } from './connector-quests';

// Combined quests array (order matters for display)
export const QUESTS = [
  ...CULTURE_QUESTS.slice(0, 1),  // Mystery Concert first (pilot)
  ...WELLNESS_QUESTS,              // Couch to 5K
  ...CULTURE_QUESTS.slice(1, 2),   // Classic Film Buffs
  ...CONNECTOR_QUESTS.slice(0, 1), // Dungeons & Daddies
  ...CULTURE_QUESTS.slice(2),      // SXSW, ACL
  ...CONNECTOR_QUESTS.slice(1),    // Trail of Lights
];

// Re-export categories for direct access if needed
export { CULTURE_QUESTS, WELLNESS_QUESTS, CONNECTOR_QUESTS };
