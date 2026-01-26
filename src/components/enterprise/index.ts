/**
 * =============================================================================
 * ENTERPRISE PORTAL COMPONENTS
 * =============================================================================
 * 
 * Platform admin components for managing the entire organization ecosystem.
 * These components are used in `/enterprise` routes and require admin privileges.
 * 
 * ## Architecture Overview
 * 
 * ```
 * EnterprisePortal (main container)
 *   ├── EnterpriseOrgsTab     → List/manage umbrella organizations
 *   │     └── OrgDetailView   → Drill-down for single org
 *   ├── EnterpriseClubsTab    → List/manage all clubs across orgs
 *   │     └── ClubDetailView  → Drill-down for single club
 *   ├── EnterpriseMembersTab  → Cross-org member management
 *   ├── EnterpriseCliquesTab  → Platform-wide clique oversight
 *   └── EnterpriseAnalyticsTab → Aggregate metrics dashboard
 * ```
 * 
 * ## Access Control
 * 
 * All components require platform admin role (`isAdmin` from useAuth).
 * RLS policies enforce this at the database level.
 * 
 * ## Key Features
 * 
 * - **Organization CRUD**: Create, suspend, archive umbrella orgs
 * - **Club Management**: View clubs under orgs, assign social chairs
 * - **Clique Tracking**: See which org each clique belongs to
 * - **Invite Codes**: View/manage codes across all clubs
 * - **Analytics**: Aggregate engagement metrics
 * 
 * @module enterprise
 */

// -----------------------------------------------------------------------------
// TAB COMPONENTS (Main navigation panels)
// -----------------------------------------------------------------------------

/** Manage umbrella organizations (universities, companies, etc.) */
export { EnterpriseOrgsTab } from './EnterpriseOrgsTab';

/** Manage clubs/sub-orgs across all umbrella organizations */
export { EnterpriseClubsTab } from './EnterpriseClubsTab';

/** Cross-organization member management and role assignment */
export { EnterpriseMembersTab } from './EnterpriseMembersTab';

/** 
 * Platform-wide clique management with organization filtering.
 * Shows which org each clique belongs to for better oversight.
 */
export { EnterpriseCliquesTab } from './EnterpriseCliquesTab';

/** Aggregate analytics across all organizations */
export { EnterpriseAnalyticsTab } from './EnterpriseAnalyticsTab';

// -----------------------------------------------------------------------------
// DETAIL VIEWS (Drill-down panels)
// -----------------------------------------------------------------------------

/** Full detail view for a single umbrella organization */
export { OrgDetailView } from './OrgDetailView';

/** 
 * Full detail view for a single club.
 * Includes members, quests, invite codes, and social chair management.
 */
export { ClubDetailView } from './ClubDetailView';
