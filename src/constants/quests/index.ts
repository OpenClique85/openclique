/**
 * =============================================================================
 * QUESTS/INDEX.TS - QUEST DATA CENTRAL HUB
 * =============================================================================
 * 
 * This file is the main entry point for all quest-related data.
 * It combines quests from different category files into one master list.
 * 
 * FILE STRUCTURE:
 * src/constants/quests/
 * ├── index.ts          ← YOU ARE HERE (combines everything)
 * ├── types.ts          ← TypeScript definitions (what a quest looks like)
 * ├── page-config.ts    ← Quests page text (title, description, etc.)
 * ├── culture-quests.ts ← Arts, music, film quests
 * ├── wellness-quests.ts← Fitness, health quests
 * └── connector-quests.ts← Social, hobby quests
 * 
 * HOW TO ADD A NEW QUEST:
 * 1. Open the appropriate category file (e.g., culture-quests.ts)
 * 2. Copy an existing quest object
 * 3. Update all fields with your new quest info
 * 4. The quest will automatically appear on the Quests page
 * 
 * HOW TO CHANGE QUEST ORDER:
 * Edit the QUESTS array below to reorder. The order here = display order.
 * 
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// EXPORTS: Types (for TypeScript - defines what a Quest looks like)
// -----------------------------------------------------------------------------
export type { Quest, QuestSection, QuestStatus } from './types';
export { QUEST_STATUS_CONFIG } from './types';

// -----------------------------------------------------------------------------
// EXPORTS: Page Configuration (title, description for the Quests page)
// -----------------------------------------------------------------------------
export { QUESTS_PAGE } from './page-config';

// -----------------------------------------------------------------------------
// IMPORTS: Quest Categories
// Each file contains an array of quests for that category
// -----------------------------------------------------------------------------
import { CULTURE_QUESTS } from './culture-quests';     // Arts, music, film
import { WELLNESS_QUESTS } from './wellness-quests';   // Fitness, health
import { CONNECTOR_QUESTS } from './connector-quests'; // Social, hobbies

// -----------------------------------------------------------------------------
// MASTER QUEST LIST
// This is the final ordered list that appears on the website.
// 
// HOW IT WORKS:
// - We use .slice() to pick specific quests from each category
// - .slice(0, 1) = first item only
// - .slice(1, 2) = second item only
// - .slice(2) = everything from third item onward
// - ... (spread operator) combines them into one array
// 
// CURRENT ORDER:
// 1. Mystery Concert (culture) - featured pilot quest
// 2. Couch to 5K (wellness)
// 3. Classic Film Buffs (culture)
// 4. Dungeons & Daddies (connector)
// 5. SXSW, ACL (culture)
// 6. Trail of Lights (connector)
// -----------------------------------------------------------------------------
export const QUESTS = [
  ...CULTURE_QUESTS.slice(0, 1),  // Mystery Concert first (pilot)
  ...WELLNESS_QUESTS,              // Couch to 5K
  ...CULTURE_QUESTS.slice(1, 2),   // Classic Film Buffs
  ...CONNECTOR_QUESTS.slice(0, 1), // Dungeons & Daddies
  ...CULTURE_QUESTS.slice(2),      // SXSW, ACL
  ...CONNECTOR_QUESTS.slice(1),    // Trail of Lights
];

// -----------------------------------------------------------------------------
// CATEGORY EXPORTS (for direct access if needed)
// Useful if you want to display quests by category elsewhere
// -----------------------------------------------------------------------------
export { CULTURE_QUESTS, WELLNESS_QUESTS, CONNECTOR_QUESTS };
