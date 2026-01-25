/**
 * =============================================================================
 * WrappedGallery - View and share Wrapped-style identity cards
 * =============================================================================
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Zap,
  Compass,
  Star,
  PartyPopper,
  Heart,
  Sparkle,
} from 'lucide-react';
import { useWrappedCards, CARD_METADATA, type CardType, type WrappedCard } from '@/hooks/useWrappedCards';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface WrappedGalleryProps {
  userId?: string;
}

const CARD_ICONS: Record<CardType, typeof Zap> = {
  social_energy: Zap,
  quest_affinity: Compass,
  group_role: Star,
  party_metaphor: PartyPopper,
  people_magnet: Heart,
  evolution: Sparkle,
};

const COLOR_THEMES = [
  { name: 'Sunset', gradient: 'from-amber-500 via-orange-500 to-rose-500' },
  { name: 'Ocean', gradient: 'from-cyan-500 via-blue-500 to-indigo-500' },
  { name: 'Forest', gradient: 'from-emerald-500 via-green-500 to-teal-500' },
  { name: 'Galaxy', gradient: 'from-violet-500 via-purple-500 to-pink-500' },
  { name: 'Midnight', gradient: 'from-slate-700 via-slate-800 to-slate-900' },
];

function WrappedCardPreview({ card, theme }: { card: WrappedCard; theme: typeof COLOR_THEMES[0] }) {
  const meta = CARD_METADATA[card.card_type as CardType];
  const Icon = CARD_ICONS[card.card_type as CardType] || Sparkles;

  return (
    <div
      className={cn(
        'relative w-full aspect-[9/16] rounded-2xl overflow-hidden',
        'bg-gradient-to-br',
        theme.gradient
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,white_0%,transparent_50%)]" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-white">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
          <Icon className="w-8 h-8" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-center mb-2">{meta.title}</h3>
        <p className="text-sm text-white/80 text-center mb-6">{meta.description}</p>

        {/* Narrative */}
        {card.card_narrative && (
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 w-full max-w-[280px]">
            <p className="text-center text-sm font-medium">"{card.card_narrative}"</p>
          </div>
        )}

        {/* Branding */}
        <div className="absolute bottom-6 flex items-center gap-2">
          <span className="text-xs text-white/60">OpenClique</span>
        </div>
      </div>
    </div>
  );
}

export function WrappedGallery({ userId }: WrappedGalleryProps) {
  const {
    cards,
    latestByType,
    shareableCards,
    availableCardTypes,
    isLoading,
    isOwner,
    toggleShare,
    generateCard,
    isUpdating,
  } = useWrappedCards(userId);

  const [selectedCard, setSelectedCard] = useState<WrappedCard | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(COLOR_THEMES[0]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current || !selectedCard) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `openclique-${selectedCard.card_type}-wrapped.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Card downloaded!');
    } catch (error) {
      toast.error('Failed to download card');
    }
  };

  const handleCopy = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success('Copied to clipboard!');
        }
      });
    } catch (error) {
      toast.error('Failed to copy card');
    }
  };

  const handleShare = async () => {
    if (!cardRef.current || !selectedCard) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (blob && navigator.share) {
          const file = new File([blob], `openclique-${selectedCard.card_type}.png`, {
            type: 'image/png',
          });

          await navigator.share({
            files: [file],
            title: 'My OpenClique Wrapped',
            text: 'Check out my social identity from OpenClique!',
          });
        } else {
          handleCopy();
        }
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasCards = Object.keys(latestByType).length > 0;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Wrapped Cards</CardTitle>
              <p className="text-sm text-muted-foreground">
                Shareable snapshots of your social identity
              </p>
            </div>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => generateCard('party_metaphor')}
                disabled={isUpdating}
              >
                <RefreshCw className={cn('h-4 w-4', isUpdating && 'animate-spin')} />
                Generate
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasCards ? (
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {(Object.entries(latestByType) as [CardType, WrappedCard][]).map(
                  ([type, card]) => {
                    const meta = CARD_METADATA[type];
                    const Icon = CARD_ICONS[type] || Sparkles;

                    return (
                      <button
                        key={card.id}
                        className={cn(
                          'flex-shrink-0 w-40 rounded-xl overflow-hidden',
                          'bg-gradient-to-br p-4 text-white text-left',
                          'transition-transform hover:scale-105',
                          meta.gradient
                        )}
                        onClick={() => {
                          setSelectedCard(card);
                          setShowShareModal(true);
                        }}
                      >
                        <Icon className="h-6 w-6 mb-3" />
                        <p className="font-semibold text-sm">{meta.title}</p>
                        <p className="text-xs text-white/70 mt-1 line-clamp-2">
                          {card.card_narrative || meta.description}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium mb-2">No Wrapped cards yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Complete more quests to unlock your identity cards
              </p>
              {isOwner && (
                <Button
                  variant="outline"
                  onClick={() => generateCard('social_energy')}
                  disabled={isUpdating}
                >
                  Generate Preview Card
                </Button>
              )}
            </div>
          )}

          {/* Share selection */}
          {isOwner && hasCards && (
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-3">Include in share:</p>
              <div className="flex flex-wrap gap-3">
                {cards.map((card) => {
                  const meta = CARD_METADATA[card.card_type as CardType];
                  return (
                    <label
                      key={card.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={card.is_included_in_share}
                        onCheckedChange={(checked) =>
                          toggleShare(card.id, checked as boolean)
                        }
                      />
                      <span>{meta?.title || card.card_type}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Card</DialogTitle>
          </DialogHeader>

          {selectedCard && (
            <div className="space-y-4">
              {/* Card Preview */}
              <div ref={cardRef} className="mx-auto max-w-[280px]">
                <WrappedCardPreview card={selectedCard} theme={selectedTheme} />
              </div>

              {/* Theme selector */}
              <div className="flex justify-center gap-2">
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.name}
                    className={cn(
                      'w-8 h-8 rounded-full bg-gradient-to-br',
                      theme.gradient,
                      selectedTheme.name === theme.name && 'ring-2 ring-primary ring-offset-2'
                    )}
                    onClick={() => setSelectedTheme(theme)}
                    title={theme.name}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Copy
                </Button>
                {'share' in navigator && (
                  <Button size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
