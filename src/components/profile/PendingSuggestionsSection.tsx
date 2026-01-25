/**
 * =============================================================================
 * PendingSuggestionsSection - "Buggs thinks..." section with blurred trait cards
 * =============================================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import buggsFace from '@/assets/buggs-face.png';
import type { DraftTraitWithLibrary } from '@/hooks/useYourAlgorithm';

interface PendingSuggestionsSectionProps {
  drafts: DraftTraitWithLibrary[];
  onAccept: (draft: DraftTraitWithLibrary) => Promise<void>;
  onReject: (draftId: string) => Promise<void>;
  isUpdating: boolean;
}

export function PendingSuggestionsSection({
  drafts,
  onAccept,
  onReject,
  isUpdating,
}: PendingSuggestionsSectionProps) {
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (drafts.length === 0) return null;

  const handleAccept = async (draft: DraftTraitWithLibrary) => {
    setProcessingId(draft.id);
    try {
      await onAccept(draft);
    } finally {
      setProcessingId(null);
      setRevealedId(null);
    }
  };

  const handleReject = async (draftId: string) => {
    setProcessingId(draftId);
    try {
      await onReject(draftId);
    } finally {
      setProcessingId(null);
      setRevealedId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="relative">
            <img src={buggsFace} alt="Buggs" className="w-8 h-8" />
            <Lightbulb className="absolute -top-1 -right-1 w-4 h-4 text-amber-500" />
          </div>
          <span>Buggs thinks...</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({drafts.length} {drafts.length === 1 ? 'suggestion' : 'suggestions'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {drafts.map((draft) => {
          const isRevealed = revealedId === draft.id;
          const isProcessing = processingId === draft.id;

          return (
            <div
              key={draft.id}
              className={cn(
                "relative rounded-xl border border-border overflow-hidden transition-all duration-300",
                isRevealed ? "bg-card" : "bg-muted/30 cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => !isRevealed && setRevealedId(draft.id)}
            >
              {/* Blurred state */}
              {!isRevealed && (
                <div className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg blur-sm select-none">
                        {draft.trait_library?.emoji || '✨'}
                      </span>
                      <span className="font-medium blur-sm select-none text-foreground">
                        {draft.trait_library?.display_name || 'Mystery trait'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tap to reveal this suggestion
                    </p>
                  </div>
                </div>
              )}

              {/* Revealed state */}
              {isRevealed && (
                <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-2xl">
                      {draft.trait_library?.emoji || '✨'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">
                        {draft.trait_library?.display_name || draft.trait_slug}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {draft.explanation || draft.trait_library?.description || 'We noticed this pattern in your preferences'}
                      </p>
                      {draft.confidence && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Confidence: {Math.round(draft.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(draft);
                      }}
                      disabled={isProcessing || isUpdating}
                    >
                      <Check className="w-4 h-4" />
                      That's me!
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(draft.id);
                      }}
                      disabled={isProcessing || isUpdating}
                    >
                      <X className="w-4 h-4" />
                      Not quite
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
