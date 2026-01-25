/**
 * =============================================================================
 * YourAlgorithmDashboard - Main container for the "Your Algorithm" tab
 * =============================================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useYourAlgorithm, CATEGORY_LABELS } from '@/hooks/useYourAlgorithm';
import { AlgorithmHeroCard } from './AlgorithmHeroCard';
import { PendingSuggestionsSection } from './PendingSuggestionsSection';
import { TraitCard } from './TraitCard';
import { AlgorithmStoryModal } from './AlgorithmStoryModal';
import { ShareAlgorithmCard } from './ShareAlgorithmCard';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { SocialEnergyMap } from './SocialEnergyMap';
import { GroupRoleMap } from './GroupRoleMap';
import { WrappedGallery } from './WrappedGallery';

export function YourAlgorithmDashboard() {
  const { profile } = useAuth();
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  
  const {
    acceptedTraits,
    pendingDrafts,
    traitsByCategory,
    topTraits,
    totalAccepted,
    totalPending,
    acceptDraft,
    rejectDraft,
    updateImportance,
    updateVisibility,
    removeTrait,
    isLoading,
    isUpdating,
  } = useYourAlgorithm();

  const displayName = profile?.display_name || 'Adventurer';
  const isEmpty = totalAccepted === 0 && totalPending === 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <AlgorithmHeroCard
        displayName={displayName}
        topTraits={topTraits}
        totalAccepted={totalAccepted}
        totalPending={totalPending}
        onSeeStory={() => setShowStoryModal(true)}
        onShare={() => setShowShareModal(true)}
        isEmpty={isEmpty}
        onStartDiscovering={() => setShowPreferencesModal(true)}
      />

      {/* Social Energy Map */}
      <SocialEnergyMap />

      {/* Group Role Map */}
      <GroupRoleMap />

      {/* Wrapped Cards Gallery */}
      <WrappedGallery />

      {/* Pending Suggestions */}
      <PendingSuggestionsSection
        drafts={pendingDrafts}
        onAccept={acceptDraft}
        onReject={rejectDraft}
        isUpdating={isUpdating}
      />

      {/* Accepted Traits by Category */}
      {Object.entries(traitsByCategory).map(([category, traits]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {CATEGORY_LABELS[category] || category.replace('_', ' ')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {traits.map((trait) => (
              <TraitCard
                key={trait.id}
                trait={trait}
                onUpdateImportance={updateImportance}
                onUpdateVisibility={updateVisibility}
                onRemove={removeTrait}
                isUpdating={isUpdating}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Story Modal */}
      <AlgorithmStoryModal
        open={showStoryModal}
        onClose={() => setShowStoryModal(false)}
        displayName={displayName}
        traits={acceptedTraits}
      />

      {/* Share Modal */}
      <ShareAlgorithmCard
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        displayName={displayName}
        traits={topTraits}
        totalTraits={totalAccepted}
      />

      {/* Preferences Modal for empty state */}
      <ProfileEditModal
        open={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
      />
    </div>
  );
}
