/**
 * =============================================================================
 * COMPONENT MANIFEST
 * =============================================================================
 * 
 * Inventory of key application components for documentation generation.
 * Used by the CTO Handoff Pack export to auto-generate component documentation.
 * 
 * This is a curated list of the most important components, not an exhaustive list.
 * =============================================================================
 */

export interface ComponentDefinition {
  path: string;
  name: string;
  category: 'layout' | 'quest' | 'gamification' | 'profile' | 'admin' | 'forms' | 'feedback' | 'support' | 'creator' | 'sponsor' | 'collaboration' | 'ui';
  description: string;
  props?: string[];
  dependencies?: string[];
}

export const COMPONENT_MANIFEST: ComponentDefinition[] = [
  // ==========================================================================
  // LAYOUT COMPONENTS
  // ==========================================================================
  { path: 'src/components/Navbar.tsx', name: 'Navbar', category: 'layout', description: 'Main navigation bar with auth state', props: [], dependencies: ['useAuth', 'NavLink'] },
  { path: 'src/components/Footer.tsx', name: 'Footer', category: 'layout', description: 'Site footer with links and branding', props: [], dependencies: [] },
  { path: 'src/components/ProtectedRoute.tsx', name: 'ProtectedRoute', category: 'layout', description: 'Route wrapper for auth protection', props: ['children', 'requireAdmin'], dependencies: ['useAuth'] },
  
  // ==========================================================================
  // QUEST COMPONENTS
  // ==========================================================================
  { path: 'src/components/QuestCard.tsx', name: 'QuestCard', category: 'quest', description: 'Quest display card with image and details', props: ['quest', 'onClick'], dependencies: [] },
  { path: 'src/components/QuestModal.tsx', name: 'QuestModal', category: 'quest', description: 'Quest detail modal with signup', props: ['quest', 'open', 'onClose'], dependencies: ['useAuth', 'supabase'] },
  { path: 'src/components/QuestFilterBar.tsx', name: 'QuestFilterBar', category: 'quest', description: 'Quest catalog filter controls', props: ['filters', 'onChange'], dependencies: [] },
  { path: 'src/components/QuestRow.tsx', name: 'QuestRow', category: 'quest', description: 'Compact quest row for lists', props: ['quest', 'status'], dependencies: [] },
  
  // ==========================================================================
  // GAMIFICATION COMPONENTS
  // ==========================================================================
  { path: 'src/components/XPBadge.tsx', name: 'XPBadge', category: 'gamification', description: 'XP display badge with level', props: ['userId'], dependencies: ['useUserLevel'] },
  { path: 'src/components/XPAwardToast.tsx', name: 'XPAwardToast', category: 'gamification', description: 'Toast notification for XP awards', props: ['amount', 'source'], dependencies: [] },
  { path: 'src/components/AchievementUnlockToast.tsx', name: 'AchievementUnlockToast', category: 'gamification', description: 'Toast for achievement unlocks', props: ['achievement'], dependencies: [] },
  { path: 'src/components/profile/ProfileGamificationSection.tsx', name: 'ProfileGamificationSection', category: 'gamification', description: 'Profile page gamification display', props: ['userId'], dependencies: ['useUserLevel', 'useUserAchievements', 'useUserStreaks'] },
  { path: 'src/components/DisplayNameWithBadges.tsx', name: 'DisplayNameWithBadges', category: 'gamification', description: 'User name with earned badges', props: ['userId', 'name'], dependencies: [] },
  
  // ==========================================================================
  // PROGRESSION COMPONENTS
  // ==========================================================================
  { path: 'src/components/progression/BranchingTreeView.tsx', name: 'BranchingTreeView', category: 'gamification', description: 'Visual progression tree display', props: ['treeId', 'userId'], dependencies: ['useUserTreeXP'] },
  { path: 'src/components/progression/HexBadge.tsx', name: 'HexBadge', category: 'gamification', description: 'Hexagonal badge display', props: ['badge', 'earned'], dependencies: [] },
  { path: 'src/components/progression/LockedQuestCard.tsx', name: 'LockedQuestCard', category: 'gamification', description: 'Locked quest preview', props: ['quest', 'requirement'], dependencies: [] },
  { path: 'src/components/progression/PathCarousel.tsx', name: 'PathCarousel', category: 'gamification', description: 'Horizontal path scroll view', props: ['paths'], dependencies: [] },
  
  // ==========================================================================
  // PROFILE COMPONENTS
  // ==========================================================================
  { path: 'src/components/ProfileModal.tsx', name: 'ProfileModal', category: 'profile', description: 'Quick profile view modal', props: ['userId', 'open', 'onClose'], dependencies: [] },
  { path: 'src/components/ProfileEditModal.tsx', name: 'ProfileEditModal', category: 'profile', description: 'Profile edit form modal', props: ['profile', 'open', 'onSave'], dependencies: [] },
  
  // ==========================================================================
  // SQUAD COMPONENTS
  // ==========================================================================
  { path: 'src/components/squads/SquadCard.tsx', name: 'SquadCard', category: 'quest', description: 'Squad display card', props: ['squad'], dependencies: [] },
  { path: 'src/components/squads/MySquadsSection.tsx', name: 'MySquadsSection', category: 'quest', description: 'User squads list section', props: ['userId'], dependencies: [] },
  { path: 'src/components/squads/ReenlistPrompt.tsx', name: 'ReenlistPrompt', category: 'quest', description: 'Prompt to rejoin squad', props: ['squad'], dependencies: [] },
  
  // ==========================================================================
  // FEEDBACK COMPONENTS
  // ==========================================================================
  { path: 'src/components/feedback/FeedbackStep1.tsx', name: 'FeedbackStep1', category: 'feedback', description: 'Attendance confirmation step', props: ['onNext'], dependencies: [] },
  { path: 'src/components/feedback/FeedbackStep2.tsx', name: 'FeedbackStep2', category: 'feedback', description: 'Rating step', props: ['onNext', 'onBack'], dependencies: [] },
  { path: 'src/components/feedback/FeedbackStep3.tsx', name: 'FeedbackStep3', category: 'feedback', description: 'Comments step', props: ['onNext', 'onBack'], dependencies: [] },
  { path: 'src/components/feedback/FeedbackStep4.tsx', name: 'FeedbackStep4', category: 'feedback', description: 'Squad feedback step', props: ['onSubmit', 'onBack'], dependencies: [] },
  { path: 'src/components/feedback/FeedbackProgress.tsx', name: 'FeedbackProgress', category: 'feedback', description: 'Wizard progress indicator', props: ['currentStep', 'totalSteps'], dependencies: [] },
  
  // ==========================================================================
  // SUPPORT COMPONENTS
  // ==========================================================================
  { path: 'src/components/support/GetHelpButton.tsx', name: 'GetHelpButton', category: 'support', description: 'Floating help button', props: [], dependencies: [] },
  { path: 'src/components/support/SupportTicketModal.tsx', name: 'SupportTicketModal', category: 'support', description: 'New ticket creation modal', props: ['open', 'onClose'], dependencies: [] },
  { path: 'src/components/support/TicketThread.tsx', name: 'TicketThread', category: 'support', description: 'Ticket message thread', props: ['ticketId'], dependencies: [] },
  { path: 'src/components/support/TicketSatisfactionSurvey.tsx', name: 'TicketSatisfactionSurvey', category: 'support', description: 'Post-resolution survey', props: ['ticketId'], dependencies: [] },
  { path: 'src/components/support/FeedbackPulse.tsx', name: 'FeedbackPulse', category: 'support', description: 'Quick feedback widget', props: [], dependencies: [] },
  
  // ==========================================================================
  // CREATOR COMPONENTS
  // ==========================================================================
  { path: 'src/components/creators/CreatorPortalNav.tsx', name: 'CreatorPortalNav', category: 'creator', description: 'Creator portal navigation', props: [], dependencies: [] },
  { path: 'src/components/creators/CreatorAnalytics.tsx', name: 'CreatorAnalytics', category: 'creator', description: 'Creator analytics charts', props: ['creatorId'], dependencies: ['useCreatorAnalytics'] },
  { path: 'src/components/creators/CreatorUnifiedInbox.tsx', name: 'CreatorUnifiedInbox', category: 'creator', description: 'Combined inbox for proposals/requests', props: [], dependencies: [] },
  { path: 'src/components/creators/ListingApplicationModal.tsx', name: 'ListingApplicationModal', category: 'creator', description: 'Apply to sponsor listing', props: ['listing', 'open', 'onClose'], dependencies: [] },
  
  // ==========================================================================
  // SPONSOR COMPONENTS
  // ==========================================================================
  { path: 'src/components/sponsors/SponsorPortalNav.tsx', name: 'SponsorPortalNav', category: 'sponsor', description: 'Sponsor portal navigation', props: [], dependencies: [] },
  { path: 'src/components/sponsors/VenueCard.tsx', name: 'VenueCard', category: 'sponsor', description: 'Venue display card', props: ['venue'], dependencies: [] },
  { path: 'src/components/sponsors/RewardCard.tsx', name: 'RewardCard', category: 'sponsor', description: 'Reward display card', props: ['reward'], dependencies: [] },
  { path: 'src/components/sponsors/SponsorListingFormModal.tsx', name: 'SponsorListingFormModal', category: 'sponsor', description: 'Listing creation/edit form', props: ['listing', 'open', 'onSave'], dependencies: [] },
  { path: 'src/components/sponsors/SponsorshipProposalModal.tsx', name: 'SponsorshipProposalModal', category: 'sponsor', description: 'Send proposal to creator', props: ['creator', 'open', 'onClose'], dependencies: [] },
  
  // ==========================================================================
  // COLLABORATION COMPONENTS
  // ==========================================================================
  { path: 'src/components/collaboration/CollaborationChat.tsx', name: 'CollaborationChat', category: 'collaboration', description: 'Threaded collaboration chat', props: ['collaborationId'], dependencies: [] },
  { path: 'src/components/collaboration/OrgSponsorRequestModal.tsx', name: 'OrgSponsorRequestModal', category: 'collaboration', description: 'Org to sponsor request', props: ['sponsor', 'open', 'onClose'], dependencies: [] },
  { path: 'src/components/collaboration/SponsorOrgProposalModal.tsx', name: 'SponsorOrgProposalModal', category: 'collaboration', description: 'Sponsor to org proposal', props: ['org', 'open', 'onClose'], dependencies: [] },
  
  // ==========================================================================
  // FORM COMPONENTS
  // ==========================================================================
  { path: 'src/components/forms/CreatorApplicationForm.tsx', name: 'CreatorApplicationForm', category: 'forms', description: 'Creator application form', props: ['onSubmit'], dependencies: [] },
  { path: 'src/components/forms/SponsorApplicationForm.tsx', name: 'SponsorApplicationForm', category: 'forms', description: 'Sponsor application form', props: ['onSubmit'], dependencies: [] },
  { path: 'src/components/forms/PartnerApplicationForm.tsx', name: 'PartnerApplicationForm', category: 'forms', description: 'Partner application form', props: ['onSubmit'], dependencies: [] },
  { path: 'src/components/forms/VolunteerApplicationForm.tsx', name: 'VolunteerApplicationForm', category: 'forms', description: 'Volunteer application form', props: ['onSubmit'], dependencies: [] },
  
  // ==========================================================================
  // QUEST BUILDER COMPONENTS
  // ==========================================================================
  { path: 'src/components/quest-builder/WizardProgress.tsx', name: 'WizardProgress', category: 'creator', description: 'Quest wizard step indicator', props: ['currentStep', 'steps'], dependencies: [] },
  { path: 'src/components/quest-builder/steps/BasicsStep.tsx', name: 'BasicsStep', category: 'creator', description: 'Quest title/description step', props: ['data', 'onChange'], dependencies: [] },
  { path: 'src/components/quest-builder/steps/TimingStep.tsx', name: 'TimingStep', category: 'creator', description: 'Quest date/time step', props: ['data', 'onChange'], dependencies: [] },
  { path: 'src/components/quest-builder/steps/CapacityStep.tsx', name: 'CapacityStep', category: 'creator', description: 'Quest capacity settings', props: ['data', 'onChange'], dependencies: [] },
  
  // ==========================================================================
  // REWARDS COMPONENTS
  // ==========================================================================
  { path: 'src/components/rewards/RewardClaimCard.tsx', name: 'RewardClaimCard', category: 'sponsor', description: 'Claimable reward card', props: ['reward', 'onClaim'], dependencies: [] },
  { path: 'src/components/rewards/RewardClaimModal.tsx', name: 'RewardClaimModal', category: 'sponsor', description: 'Reward claim confirmation', props: ['reward', 'open', 'onClose'], dependencies: [] },
];

/**
 * Get components by category
 */
export function getComponentsByCategory(category: ComponentDefinition['category']): ComponentDefinition[] {
  return COMPONENT_MANIFEST.filter(c => c.category === category);
}

/**
 * Generate markdown table of components
 */
export function generateComponentsMarkdown(): string {
  const categories = ['layout', 'quest', 'gamification', 'profile', 'feedback', 'support', 'creator', 'sponsor', 'collaboration', 'forms'] as const;
  
  let md = '# Component Inventory\n\n';
  md += `*Curated list of key components from componentManifest.ts*\n\n`;
  md += `**Total Components:** ${COMPONENT_MANIFEST.length}\n\n`;
  
  for (const category of categories) {
    const components = getComponentsByCategory(category);
    if (components.length === 0) continue;
    
    md += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Components\n\n`;
    md += '| Component | Description | Key Props |\n';
    md += '|-----------|-------------|----------|\n';
    
    for (const comp of components) {
      const props = comp.props?.length ? comp.props.join(', ') : '-';
      md += `| \`${comp.name}\` | ${comp.description} | ${props} |\n`;
    }
    
    md += '\n';
  }
  
  return md;
}
