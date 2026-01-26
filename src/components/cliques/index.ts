/**
 * =============================================================================
 * CLIQUES COMPONENTS MODULE
 * =============================================================================
 * 
 * User-facing components for clique (persistent squad) management.
 * Cliques are small groups (3-6 people) that form through shared quests
 * and continue to meet up over time.
 * 
 * ## Core Concept
 * 
 * OpenClique optimizes for repeat group formation, not one-off events.
 * Cliques build trust and ritual through:
 * - Warm-up activities before quests
 * - Role rotation (leader, hype, etc.)
 * - Shared lore and memories
 * - Ready checks and voting
 * 
 * ## Component Categories
 * 
 * ### Discovery & Formation
 * - `LFCBrowser` - "Looking for Clique" discovery
 * - `FormCliqueButton` - Create new clique
 * - `CliqueApplicationsInbox` - Review join requests
 * 
 * ### Clique Interaction
 * - `CliqueCard` - Display clique in list views
 * - `CliqueChat` - Real-time group messaging
 * - `CliqueWarmUpRoom` - Pre-quest bonding activities
 * 
 * ### Coordination
 * - `ReadyCheckCard` / `CreateReadyCheckModal` - Availability polling
 * - `CliquePollCard` / `CreatePollModal` - Group voting
 * - `SuggestQuestModal` - Propose next quest to group
 * 
 * ### Management
 * - `CliqueRolesManager` - Assign/rotate roles
 * - `CliqueSettingsModal` - Privacy, notifications, etc.
 * - `CliqueLoreTab` - Shared memories and achievements
 * 
 * @module cliques
 */

// -----------------------------------------------------------------------------
// FORMATION & DISCOVERY
// -----------------------------------------------------------------------------

/** Prompt to re-enlist in a clique after a quest */
export { ReenlistPrompt } from './ReenlistPrompt';

/** Card component for displaying a clique in lists */
export { CliqueCard } from './CliqueCard';

/** Button to initiate clique creation */
export { FormCliqueButton } from './FormCliqueButton';

/** Browse and apply to open cliques ("Looking for Clique") */
export { LFCBrowser } from './LFCBrowser';

/** Leader view for reviewing join applications */
export { CliqueApplicationsInbox } from './CliqueApplicationsInbox';

// -----------------------------------------------------------------------------
// WARM-UP & BONDING
// -----------------------------------------------------------------------------

/** Pre-quest warm-up room with icebreakers and activities */
export { CliqueWarmUpRoom } from './CliqueWarmUpRoom';

/** Visual progress indicator for warm-up completion */
export { WarmUpProgressBar } from './WarmUpProgressBar';

/** Event lobby for gathering before a quest */
export { EventLobby } from './EventLobby';

// -----------------------------------------------------------------------------
// COORDINATION & VOTING
// -----------------------------------------------------------------------------

/** Modal to suggest a quest for the clique to do next */
export { SuggestQuestModal } from './SuggestQuestModal';

/** Display a poll with voting options */
export { CliquePollCard } from './CliquePollCard';

/** Modal to create a new poll */
export { CreatePollModal } from './CreatePollModal';

/** Display a ready check with member responses */
export { ReadyCheckCard } from './ReadyCheckCard';

/** Modal to initiate a ready check */
export { CreateReadyCheckModal } from './CreateReadyCheckModal';

// -----------------------------------------------------------------------------
// MANAGEMENT & SETTINGS
// -----------------------------------------------------------------------------

/** Manage clique roles (leader, hype, navigator, etc.) */
export { CliqueRolesManager } from './CliqueRolesManager';

/** Settings modal for clique configuration */
export { CliqueSettingsModal } from './CliqueSettingsModal';

/** Real-time group chat interface */
export { CliqueChat } from './CliqueChat';

/** Shared memories, achievements, and clique history */
export { CliqueLoreTab } from './CliqueLoreTab';
