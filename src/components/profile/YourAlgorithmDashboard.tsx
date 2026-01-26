/**
 * =============================================================================
 * YourAlgorithmDashboard - Accordion-based "Your Algorithm" tab
 * =============================================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Zap, Users, Sparkles, Share2, ListChecks } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useYourAlgorithm, CATEGORY_LABELS } from '@/hooks/useYourAlgorithm';
import { useRoleRanking, ROLE_METADATA } from '@/hooks/useRoleRanking';
import { AlgorithmHeroCard } from './AlgorithmHeroCard';
import { PendingSuggestionsSection } from './PendingSuggestionsSection';
import { TraitCard } from './TraitCard';
import { AlgorithmStoryModal } from './AlgorithmStoryModal';
import { ShareAlgorithmCard } from './ShareAlgorithmCard';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { SocialEnergyMap } from './SocialEnergyMap';
import { GroupRoleRanker } from './GroupRoleRanker';
import { WrappedGallery } from './WrappedGallery';
import { TooltipInfo } from '@/components/ui/tooltip-info';

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

  const { primaryRole } = useRoleRanking();

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
      {/* Hero Card - Always visible */}
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

      {/* Main Accordion */}
      <Accordion type="single" collapsible defaultValue="energy" className="space-y-3">
        {/* How You Show Up */}
        <AccordionItem value="energy" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <span className="font-medium">How You Show Up</span>
                <p className="text-xs text-muted-foreground font-normal">
                  Energy, structure, and focus preferences
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <SocialEnergyMap compact />
          </AccordionContent>
        </AccordionItem>

        {/* Your Group Role */}
        <AccordionItem value="roles" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left flex-1">
                <span className="font-medium">Your Group Role</span>
                <p className="text-xs text-muted-foreground font-normal">
                  The energy you bring to cliques
                </p>
              </div>
              {primaryRole && (
                <Badge variant="outline" className="ml-2">
                  {ROLE_METADATA[primaryRole].icon} {ROLE_METADATA[primaryRole].label.replace(' Energy', '')}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <GroupRoleRanker />
          </AccordionContent>
        </AccordionItem>

        {/* Pending Suggestions */}
        {totalPending > 0 && (
          <AccordionItem value="pending" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-left flex-1">
                  <span className="font-medium">What Buggs Noticed</span>
                  <p className="text-xs text-muted-foreground font-normal">
                    AI-suggested traits based on your activity
                  </p>
                </div>
                <Badge variant="secondary">{totalPending} pending</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <p className="text-sm text-muted-foreground mb-4">
                Based on your activity, Buggs noticed some patterns. Accept what feels true, reject what doesn't.
              </p>
              <PendingSuggestionsSection
                drafts={pendingDrafts}
                onAccept={acceptDraft}
                onReject={rejectDraft}
                isUpdating={isUpdating}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Accepted Traits */}
        {totalAccepted > 0 && (
          <AccordionItem value="traits" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ListChecks className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <span className="font-medium">Your Accepted Traits</span>
                  <p className="text-xs text-muted-foreground font-normal">
                    Traits you've confirmed about yourself
                  </p>
                </div>
                <Badge variant="outline">{totalAccepted} traits</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              {Object.entries(traitsByCategory).map(([category, traits]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {CATEGORY_LABELS[category] || category.replace('_', ' ')}
                  </h4>
                  <div className="space-y-2">
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
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Share Your Story */}
        <AccordionItem value="share" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Share2 className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <span className="font-medium">Share Your Story</span>
                <p className="text-xs text-muted-foreground font-normal">
                  Beautiful cards to share on social media
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <WrappedGallery />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
