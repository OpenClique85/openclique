/**
 * =============================================================================
 * REWARDS COMPONENTS MODULE
 * =============================================================================
 * 
 * Components for the sponsor rewards system. Sponsors can create rewards
 * (promo codes, discounts, experiences) that users earn through quest completion.
 * 
 * ## Reward Lifecycle
 * 
 * ```
 * 1. Sponsor creates reward in Sponsor Portal
 * 2. Reward attached to quest or achievement
 * 3. User completes quest / earns achievement
 * 4. User claims reward via RewardClaimCard
 * 5. RewardClaimModal shows fulfillment details (code, link, QR)
 * ```
 * 
 * ## Fulfillment Types
 * 
 * - `code` - Promo code to enter at checkout
 * - `link` - URL to claim online
 * - `qr` - QR code to scan at venue
 * - `on_site` - Claim in person at location
 * 
 * @module rewards
 */

// -----------------------------------------------------------------------------
// USER-FACING COMPONENTS
// -----------------------------------------------------------------------------

/** Card displaying a claimable reward with status */
export { RewardClaimCard } from './RewardClaimCard';

/** Modal showing reward details after claiming */
export { RewardClaimModal } from './RewardClaimModal';
