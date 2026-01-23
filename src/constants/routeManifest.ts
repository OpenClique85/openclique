/**
 * =============================================================================
 * ROUTE MANIFEST
 * =============================================================================
 * 
 * Complete inventory of all application routes for documentation generation.
 * Used by the CTO Handoff Pack export to auto-generate route documentation.
 * 
 * KEEP THIS IN SYNC WITH src/App.tsx!
 * =============================================================================
 */

export interface RouteDefinition {
  path: string;
  page: string;
  protection: 'public' | 'auth' | 'admin' | 'creator' | 'sponsor';
  description: string;
  category: 'main' | 'auth' | 'creator' | 'sponsor' | 'admin' | 'legal' | 'funnel';
}

export const ROUTE_MANIFEST: RouteDefinition[] = [
  // ==========================================================================
  // MAIN PAGES (PUBLIC)
  // ==========================================================================
  { path: '/', page: 'Index', protection: 'public', description: 'Homepage with hero, benefits, testimonials', category: 'main' },
  { path: '/how-it-works', page: 'HowItWorks', protection: 'public', description: 'Product explanation and user journey', category: 'main' },
  { path: '/about', page: 'About', protection: 'public', description: 'About page with team and mission', category: 'main' },
  { path: '/quests', page: 'Quests', protection: 'public', description: 'Quest catalog with filtering', category: 'main' },
  { path: '/quests/:slug', page: 'QuestDetail', protection: 'public', description: 'Individual quest details and signup', category: 'main' },
  
  // ==========================================================================
  // AUTH & USER PAGES
  // ==========================================================================
  { path: '/auth', page: 'Auth', protection: 'public', description: 'Login and signup forms', category: 'auth' },
  { path: '/my-quests', page: 'MyQuests', protection: 'auth', description: 'User quest signups and history', category: 'auth' },
  { path: '/profile', page: 'Profile', protection: 'auth', description: 'User profile with gamification display', category: 'auth' },
  { path: '/squads/:squadId', page: 'SquadDetail', protection: 'auth', description: 'Squad details and members', category: 'auth' },
  { path: '/notifications', page: 'Notifications', protection: 'auth', description: 'User notification center', category: 'auth' },
  { path: '/support', page: 'Support', protection: 'auth', description: 'Support ticket list', category: 'auth' },
  { path: '/support/:ticketId', page: 'SupportTicketDetail', protection: 'auth', description: 'Individual support ticket thread', category: 'auth' },
  { path: '/feedback/:questId', page: 'FeedbackFlow', protection: 'auth', description: 'Post-quest feedback wizard', category: 'auth' },
  
  // ==========================================================================
  // FUNNEL / SIGNUP PAGES
  // ==========================================================================
  { path: '/pilot', page: 'Pilot', protection: 'public', description: 'Pilot program signup', category: 'funnel' },
  { path: '/partners', page: 'Partners', protection: 'public', description: 'Partner/sponsor information', category: 'funnel' },
  { path: '/work-with-us', page: 'WorkWithUs', protection: 'public', description: 'Multi-role application hub', category: 'funnel' },
  
  // ==========================================================================
  // CREATOR PAGES
  // ==========================================================================
  { path: '/creators', page: 'CreatorsHub', protection: 'public', description: 'Creator landing page', category: 'creator' },
  { path: '/creators/content-creators', page: 'ContentCreatorsPage', protection: 'public', description: 'Content creator info', category: 'creator' },
  { path: '/creators/quest-creators', page: 'QuestCreatorsPage', protection: 'public', description: 'Quest creator info', category: 'creator' },
  { path: '/creators/onboard', page: 'CreatorOnboarding', protection: 'public', description: 'Creator onboarding wizard', category: 'creator' },
  { path: '/creators/directory', page: 'CreatorsDirectory', protection: 'public', description: 'Public creator directory', category: 'creator' },
  { path: '/creators/:slug', page: 'CreatorPublicProfile', protection: 'public', description: 'Public creator profile', category: 'creator' },
  { path: '/org/:slug', page: 'OrgPortal', protection: 'public', description: 'Organization landing page', category: 'creator' },
  
  // Creator Portal (Protected)
  { path: '/creator', page: 'CreatorDashboard', protection: 'auth', description: 'Creator dashboard home', category: 'creator' },
  { path: '/creator/quests', page: 'CreatorQuests', protection: 'auth', description: 'Creator quest management', category: 'creator' },
  { path: '/creator/inbox', page: 'CreatorInbox', protection: 'auth', description: 'Creator unified inbox', category: 'creator' },
  { path: '/creator/proposals', page: 'CreatorProposals', protection: 'auth', description: 'Sponsor proposal inbox', category: 'creator' },
  { path: '/creator/org-requests', page: 'CreatorOrgRequests', protection: 'auth', description: 'Organization collaboration requests', category: 'creator' },
  { path: '/creator/analytics', page: 'CreatorAnalyticsPage', protection: 'auth', description: 'Creator analytics dashboard', category: 'creator' },
  { path: '/creator/profile', page: 'CreatorProfile', protection: 'auth', description: 'Creator profile editor', category: 'creator' },
  { path: '/creator/quests/new', page: 'QuestBuilder', protection: 'auth', description: 'Quest creation wizard', category: 'creator' },
  { path: '/creator/quests/:questId/edit', page: 'QuestBuilder', protection: 'auth', description: 'Quest edit wizard', category: 'creator' },
  { path: '/creator/browse-listings', page: 'CreatorBrowseListings', protection: 'auth', description: 'Browse sponsor listings', category: 'creator' },
  
  // ==========================================================================
  // SPONSOR PAGES
  // ==========================================================================
  { path: '/sponsors/onboard', page: 'SponsorOnboarding', protection: 'public', description: 'Sponsor onboarding wizard', category: 'sponsor' },
  { path: '/sponsors/:slug', page: 'SponsorPublicProfile', protection: 'public', description: 'Public sponsor profile', category: 'sponsor' },
  
  // Sponsor Portal (Protected)
  { path: '/sponsor', page: 'SponsorDashboard', protection: 'auth', description: 'Sponsor dashboard home', category: 'sponsor' },
  { path: '/sponsor/rewards', page: 'SponsorRewards', protection: 'auth', description: 'Reward management', category: 'sponsor' },
  { path: '/sponsor/venues', page: 'SponsorVenues', protection: 'auth', description: 'Venue management', category: 'sponsor' },
  { path: '/sponsor/listings', page: 'SponsorListings', protection: 'auth', description: 'Listing management', category: 'sponsor' },
  { path: '/sponsor/discover', page: 'SponsorDiscover', protection: 'auth', description: 'Creator/org discovery', category: 'sponsor' },
  { path: '/sponsor/browse-creators', page: 'SponsorBrowseCreators', protection: 'auth', description: 'Browse creators', category: 'sponsor' },
  { path: '/sponsor/browse-orgs', page: 'SponsorBrowseOrgs', protection: 'auth', description: 'Browse organizations', category: 'sponsor' },
  { path: '/sponsor/org-requests', page: 'SponsorOrgRequests', protection: 'auth', description: 'Organization requests', category: 'sponsor' },
  { path: '/sponsor/proposals', page: 'SponsorProposals', protection: 'auth', description: 'Creator proposals', category: 'sponsor' },
  { path: '/sponsor/analytics', page: 'SponsorAnalytics', protection: 'auth', description: 'Sponsor analytics dashboard', category: 'sponsor' },
  { path: '/sponsor/profile', page: 'SponsorProfile', protection: 'auth', description: 'Sponsor profile editor', category: 'sponsor' },
  
  // ==========================================================================
  // ADMIN PAGES
  // ==========================================================================
  { path: '/admin', page: 'Admin', protection: 'admin', description: 'Admin console with all management tabs', category: 'admin' },
  
  // ==========================================================================
  // LEGAL PAGES
  // ==========================================================================
  { path: '/privacy', page: 'Privacy', protection: 'public', description: 'Privacy policy', category: 'legal' },
  { path: '/terms', page: 'Terms', protection: 'public', description: 'Terms of service', category: 'legal' },
];

/**
 * Get routes by category
 */
export function getRoutesByCategory(category: RouteDefinition['category']): RouteDefinition[] {
  return ROUTE_MANIFEST.filter(r => r.category === category);
}

/**
 * Get routes by protection level
 */
export function getRoutesByProtection(protection: RouteDefinition['protection']): RouteDefinition[] {
  return ROUTE_MANIFEST.filter(r => r.protection === protection);
}

/**
 * Generate markdown table of routes
 */
export function generateRoutesMarkdown(): string {
  const categories = ['main', 'auth', 'creator', 'sponsor', 'admin', 'funnel', 'legal'] as const;
  
  let md = '# Route Map\n\n';
  md += `*Auto-generated from routeManifest.ts*\n\n`;
  
  for (const category of categories) {
    const routes = getRoutesByCategory(category);
    if (routes.length === 0) continue;
    
    md += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Routes\n\n`;
    md += '| Path | Page | Protection | Description |\n';
    md += '|------|------|------------|-------------|\n';
    
    for (const route of routes) {
      md += `| \`${route.path}\` | ${route.page} | ${route.protection} | ${route.description} |\n`;
    }
    
    md += '\n';
  }
  
  return md;
}
