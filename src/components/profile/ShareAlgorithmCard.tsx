/**
 * =============================================================================
 * ShareAlgorithmCard - Generates a shareable image of user's top traits
 * Spotify Wrapped-style sharing card with canvas-to-image export
 * =============================================================================
 */

import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Download, Copy, Check, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { UserTraitWithLibrary } from '@/hooks/useYourAlgorithm';
import { CATEGORY_COLORS } from '@/hooks/useYourAlgorithm';

interface ShareAlgorithmCardProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  traits: UserTraitWithLibrary[];
  totalTraits: number;
}

// Color palettes for the share card
const CARD_THEMES = [
  { name: 'Sunset', gradient: 'from-amber-500 via-orange-500 to-rose-500', text: 'text-white' },
  { name: 'Ocean', gradient: 'from-blue-500 via-cyan-500 to-teal-500', text: 'text-white' },
  { name: 'Forest', gradient: 'from-emerald-500 via-green-500 to-teal-500', text: 'text-white' },
  { name: 'Galaxy', gradient: 'from-purple-600 via-pink-500 to-rose-500', text: 'text-white' },
  { name: 'Midnight', gradient: 'from-slate-800 via-purple-900 to-slate-900', text: 'text-white' },
];

export function ShareAlgorithmCard({
  open,
  onClose,
  displayName,
  traits,
  totalTraits,
}: ShareAlgorithmCardProps) {
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const topTraits = traits.slice(0, 5);
  const theme = CARD_THEMES[selectedTheme];

  // Generate image from the card
  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;

    setIsGenerating(true);

    try {
      // Dynamic import of html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast.error('Failed to generate image');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Download the card as image
  const handleDownload = async () => {
    const blob = await generateImage();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${displayName.replace(/\s+/g, '-').toLowerCase()}-social-dna.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Image downloaded!');
  };

  // Copy image to clipboard
  const handleCopy = async () => {
    const blob = await generateImage();
    if (!blob) return;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      toast.success('Image copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy image');
    }
  };

  // Native share (mobile)
  const handleShare = async () => {
    const blob = await generateImage();
    if (!blob) return;

    const file = new File([blob], 'social-dna.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `${displayName}'s Social DNA`,
          text: 'Check out my Social DNA on OpenClique!',
          files: [file],
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      // Fallback to download
      handleDownload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Your Algorithm
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Selector */}
          <div className="flex gap-2 justify-center">
            {CARD_THEMES.map((t, index) => (
              <button
                key={t.name}
                onClick={() => setSelectedTheme(index)}
                className={cn(
                  "w-8 h-8 rounded-full bg-gradient-to-br transition-all",
                  t.gradient,
                  selectedTheme === index && "ring-2 ring-offset-2 ring-primary"
                )}
                title={t.name}
              />
            ))}
          </div>

          {/* Shareable Card Preview */}
          <div className="flex justify-center">
            <div
              ref={cardRef}
              className={cn(
                "w-[320px] aspect-[9/16] rounded-2xl overflow-hidden",
                "bg-gradient-to-br p-6 flex flex-col",
                theme.gradient,
                theme.text
              )}
            >
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>SOCIAL DNA</span>
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-2xl font-display font-bold">{displayName}</h2>
              </div>

              {/* Traits */}
              <div className="flex-1 flex flex-col justify-center py-6 space-y-3">
                {topTraits.map((trait, index) => {
                  const categoryColor = CATEGORY_COLORS[trait.trait_library?.category || ''];
                  return (
                    <div
                      key={trait.id}
                      className={cn(
                        "px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm",
                        "flex items-center gap-3",
                        index === 0 && "scale-105 bg-white/30"
                      )}
                    >
                      <span className="text-2xl">
                        {trait.trait_library?.emoji || '✨'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {trait.trait_library?.display_name || trait.trait_slug}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="text-center space-y-2 text-white/70">
                <div className="text-sm">
                  {totalTraits} traits discovered
                </div>
                <div className="flex items-center justify-center gap-1 text-xs font-medium">
                  <span>Made with</span>
                  <span className="text-white font-bold">OpenClique</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleCopy}
              disabled={isGenerating}
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleDownload}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleShare}
              disabled={isGenerating}
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
