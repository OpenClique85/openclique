import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2,
  MapPin,
  Users,
  Calendar,
  ShieldCheck,
  ShieldOff
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type VenueOffering = Tables<'venue_offerings'>;

interface SponsorVenuesPreviewProps {
  previewUserId: string;
}

export function SponsorVenuesPreview({ previewUserId }: SponsorVenuesPreviewProps) {
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

  // Fetch venues
  const { data: venues, isLoading: venuesLoading } = useQuery({
    queryKey: ['preview-sponsor-venues', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_offerings')
        .select('*')
        .eq('sponsor_id', profile!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as VenueOffering[];
    },
    enabled: !!profile?.id,
  });

  if (profileLoading || venuesLoading) {
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

  // Check if sponsor type allows venues
  const canHaveVenues = profile.sponsor_type === 'venue' || profile.sponsor_type === 'both';

  if (!canHaveVenues) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>This sponsor is a brand-type and cannot have venues</p>
      </div>
    );
  }

  if (!venues || venues.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No venues listed yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Venues ({venues.length})</h2>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {venues.map((venue) => (
          <Card key={venue.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{venue.venue_name}</h3>
                  {venue.address && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {venue.address}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {venue.amenities && venue.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {venue.amenities.slice(0, 3).map((amenity: string) => (
                    <Badge key={amenity} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {venue.amenities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{venue.amenities.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between">
                <Badge variant={venue.status === 'available' ? 'default' : 'secondary'}>
                  {venue.status}
                </Badge>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {venue.capacity && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{venue.capacity}</span>
                    </div>
                  )}
                  {venue.available_days && venue.available_days.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{venue.available_days.length} days</span>
                    </div>
                  )}
                  <span title={venue.approval_required ? "Approval required" : "No approval needed"}>
                    {venue.approval_required ? (
                      <ShieldCheck className="h-4 w-4 text-amber-500" />
                    ) : (
                      <ShieldOff className="h-4 w-4" />
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
