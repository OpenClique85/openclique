import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, ExternalLink, Loader2, Check, Gift, QrCode, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/integrations/supabase/types';

type Reward = Tables<'rewards'>;

interface RewardClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward | null;
  sponsorName?: string;
  questId?: string;
  userId: string;
  onClaimed: () => void;
}

export function RewardClaimModal({
  isOpen,
  onClose,
  reward,
  sponsorName,
  questId,
  userId,
  onClaimed,
}: RewardClaimModalProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);

  if (!reward) return null;

  const handleCopyCode = async () => {
    if (reward.fulfillment_data) {
      await navigator.clipboard.writeText(reward.fulfillment_data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Code copied to clipboard!');
    }
  };

  const handleOpenLink = () => {
    if (reward.fulfillment_data) {
      window.open(reward.fulfillment_data, '_blank');
      setHasViewed(true);
    }
  };

  const handleMarkAsClaimed = async () => {
    setIsClaiming(true);
    try {
      // Insert redemption record
      const { error: insertError } = await supabase
        .from('reward_redemptions')
        .insert({
          reward_id: reward.id,
          user_id: userId,
          quest_id: questId || null,
        });

      if (insertError) throw insertError;

      // Increment redemption count
      const { error: rpcError } = await supabase.rpc('increment_reward_redemptions', {
        p_reward_id: reward.id,
      });

      if (rpcError) {
        console.warn('Failed to increment redemption count:', rpcError);
      }

      toast.success('Reward claimed!');
      onClaimed();
      onClose();
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward');
    } finally {
      setIsClaiming(false);
    }
  };

  const renderFulfillmentContent = () => {
    switch (reward.fulfillment_type) {
      case 'code':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use this promo code to redeem your reward:
            </p>
            <div className="bg-muted rounded-lg p-4 flex items-center justify-between gap-3">
              <code className="text-lg font-mono font-bold text-foreground tracking-wider">
                {reward.fulfillment_data || 'CODE_HERE'}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'link':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click below to redeem your reward online:
            </p>
            <Button
              className="w-full bg-sunset hover:bg-sunset/90"
              onClick={handleOpenLink}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Reward Link
            </Button>
            {hasViewed && (
              <p className="text-xs text-muted-foreground text-center">
                ✓ Link opened in new tab
              </p>
            )}
          </div>
        );

      case 'qr':
        return (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Show this QR code to redeem your reward:
            </p>
            {reward.fulfillment_data ? (
              <div className="bg-white p-4 rounded-lg inline-block mx-auto">
                <img
                  src={reward.fulfillment_data}
                  alt="QR Code"
                  className="w-48 h-48 object-contain"
                />
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-8 flex items-center justify-center">
                <QrCode className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>
        );

      case 'on_site':
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    Redeem On-Site
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Show this screen to staff at the location to claim your reward.
                  </p>
                </div>
              </div>
            </div>
            {reward.fulfillment_data && (
              <p className="text-sm text-muted-foreground">
                <strong>Instructions:</strong> {reward.fulfillment_data}
              </p>
            )}
            <div className="bg-muted rounded-lg p-4 text-center">
              <Gift className="h-12 w-12 text-sunset mx-auto mb-2" />
              <p className="font-semibold">{reward.name}</p>
              {sponsorName && <p className="text-sm text-muted-foreground">from {sponsorName}</p>}
            </div>
          </div>
        );

      default:
        return (
          <p className="text-muted-foreground">
            Contact the sponsor to redeem this reward.
          </p>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{reward.name}</DialogTitle>
            <Badge variant="secondary" className="text-xs">
              {reward.fulfillment_type === 'code' && 'Promo Code'}
              {reward.fulfillment_type === 'link' && 'Online'}
              {reward.fulfillment_type === 'qr' && 'QR Code'}
              {reward.fulfillment_type === 'on_site' && 'On-Site'}
            </Badge>
          </div>
          {sponsorName && (
            <DialogDescription>
              Reward from {sponsorName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">
          {renderFulfillmentContent()}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleMarkAsClaimed} disabled={isClaiming}>
            {isClaiming ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Mark as Claimed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
