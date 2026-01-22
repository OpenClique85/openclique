import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2,
  Gift,
  Code,
  Link as LinkIcon,
  QrCode,
  MapPin,
  Users,
  Calendar
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Reward = Tables<'rewards'>;

interface SponsorRewardsPreviewProps {
  previewUserId: string;
}

const FULFILLMENT_ICONS = {
  code: Code,
  link: LinkIcon,
  qr: QrCode,
  on_site: MapPin,
};

export function SponsorRewardsPreview({ previewUserId }: SponsorRewardsPreviewProps) {
  // Fetch sponsor profile first
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['preview-sponsor-profile', previewUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', previewUserId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!previewUserId,
  });

  // Fetch rewards
  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['preview-sponsor-rewards', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('sponsor_id', profile!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Reward[];
    },
    enabled: !!profile?.id,
  });

  if (profileLoading || rewardsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sponsor profile found for this user
      </div>
    );
  }

  if (!rewards || rewards.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No rewards created yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Rewards ({rewards.length})</h2>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => {
          const isExpired = reward.expires_at && isPast(new Date(reward.expires_at));
          const FulfillmentIcon = FULFILLMENT_ICONS[reward.fulfillment_type as keyof typeof FULFILLMENT_ICONS] || Gift;

          return (
            <Card key={reward.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FulfillmentIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{reward.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {reward.fulfillment_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {reward.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {reward.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant={
                    isExpired ? 'secondary' : 
                    reward.status === 'active' ? 'default' : 'secondary'
                  }>
                    {isExpired ? 'Expired' : reward.status}
                  </Badge>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>
                        {reward.redemptions_count || 0}
                        {reward.max_redemptions && ` / ${reward.max_redemptions}`}
                      </span>
                    </div>
                    {reward.expires_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(reward.expires_at), 'MMM d')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
