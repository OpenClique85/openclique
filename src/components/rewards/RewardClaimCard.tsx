import { Gift, Clock, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Reward = Tables<'rewards'>;

interface RewardClaimCardProps {
  reward: Reward;
  sponsorName?: string;
  isClaimed: boolean;
  onClaim: () => void;
}

const FULFILLMENT_LABELS: Record<string, { label: string; color: string }> = {
  code: { label: 'Promo Code', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  link: { label: 'Online Link', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  qr: { label: 'QR Code', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  on_site: { label: 'On-Site', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

export function RewardClaimCard({ reward, sponsorName, isClaimed, onClaim }: RewardClaimCardProps) {
  const fulfillment = FULFILLMENT_LABELS[reward.fulfillment_type] || FULFILLMENT_LABELS.code;
  const isExpired = reward.expires_at && new Date(reward.expires_at) < new Date();
  const isMaxedOut = reward.max_redemptions && (reward.redemptions_count || 0) >= reward.max_redemptions;
  const isUnavailable = isExpired || isMaxedOut;

  return (
    <Card className={`transition-all ${isClaimed ? 'bg-muted/40 opacity-75' : 'hover:shadow-md'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isClaimed ? 'bg-muted' : 'bg-sunset/10'}`}>
            <Gift className={`h-5 w-5 ${isClaimed ? 'text-muted-foreground' : 'text-sunset'}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">{reward.name}</h3>
                {sponsorName && (
                  <p className="text-xs text-muted-foreground">from {sponsorName}</p>
                )}
              </div>
              <Badge className={fulfillment.color} variant="secondary">
                {fulfillment.label}
              </Badge>
            </div>
            
            {reward.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {reward.description}
              </p>
            )}
            
            <div className="flex items-center gap-3 mt-3">
              {reward.expires_at && !isExpired && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Expires {format(new Date(reward.expires_at), 'MMM d')}</span>
                </div>
              )}
              
              {isExpired && (
                <Badge variant="destructive" className="text-xs">Expired</Badge>
              )}
              
              {isMaxedOut && !isExpired && (
                <Badge variant="secondary" className="text-xs">Sold Out</Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          {isClaimed ? (
            <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
              <Check className="h-4 w-4 mr-1" />
              Claimed
            </Button>
          ) : isUnavailable ? (
            <Button variant="ghost" size="sm" disabled>
              Unavailable
            </Button>
          ) : (
            <Button size="sm" onClick={onClaim} className="bg-sunset hover:bg-sunset/90">
              <Gift className="h-4 w-4 mr-1" />
              Claim Reward
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
