/**
 * =============================================================================
 * CLUB COMPONENTS MODULE
 * =============================================================================
 * 
 * User-facing components for club/organization management within the platform.
 * These components power the Social Chair Dashboard and club member interfaces.
 * 
 * ## Architecture Overview
 * 
 * ```
 * ClubDirectory (browse all clubs)
 *   └── ClubCard (individual club display)
 *         └── ClubApplicationForm (join request)
 * 
 * SocialChairDashboard (club admin panel)
 *   ├── InviteCodesTab (generate/manage invite codes)
 *   ├── Cliques management
 *   └── Broadcast messaging
 * ```
 * 
 * ## Key Concepts
 * 
 * - **Club**: A sub-organization under an umbrella org (e.g., MBA Social Club under UT Austin)
 * - **Social Chair**: Club admin role with management permissions
 * - **Invite Code**: Unique code for member onboarding with auto-role assignment
 * 
 * ## Related Modules
 * - `@/components/enterprise` - Platform admin views for clubs
 * - `@/pages/ClubDashboardPage` - Route wrapper for Social Chair Dashboard
 * - `@/hooks/useAuth` - Role-based access control
 * 
 * @module clubs
 */

// -----------------------------------------------------------------------------
// DISPLAY COMPONENTS
// -----------------------------------------------------------------------------

/** Card component displaying club info with join/view actions */
export { ClubCard } from './ClubCard';

/** Browse and filter all available clubs */
export { ClubDirectory } from './ClubDirectory';

/** Form for users to apply to join a club */
export { ClubApplicationForm } from './ClubApplicationForm';

// -----------------------------------------------------------------------------
// MANAGEMENT COMPONENTS (Social Chair)
// -----------------------------------------------------------------------------

/** 
 * Full-featured dashboard for Social Chairs to manage their club.
 * Includes event management, clique operations, and broadcasting.
 */
export { SocialChairDashboard } from './SocialChairDashboard';

/**
 * Invite code management tab within the Social Chair Dashboard.
 * Generate, track, and deactivate club invite codes.
 */
export { InviteCodesTab } from './InviteCodesTab';
