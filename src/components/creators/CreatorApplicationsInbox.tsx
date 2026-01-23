/**
 * CreatorApplicationsInbox - Shows creator's applications to sponsor listings
 */

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Building2, 
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Application {
  id: string;
  listing_id: string;
  pitch_message: string;
  proposed_concept: string | null;
  status: string;
  created_at: string;
  response_at: string | null;
  sponsor_notes: string | null;
}

interface Listing {
  id: string;
  title: string;
  quest_type: string | null;
  budget_range: string | null;
  sponsor_id: string;
}

interface SponsorProfile {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string | null;
}

const BUDGET_LABELS: Record<string, string> = {
  under_500: 'Under $500',
  '500_1000': '$500 - $1,000',
  '1000_2500': '$1,000 - $2,500',
  '2500_5000': '$2,500 - $5,000',
  over_5000: '$5,000+',
  negotiable: 'Negotiable',
};

export function CreatorApplicationsInbox() {
  const { user } = useAuth();

  // Fetch applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['my-listing-applications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_applications')
        .select('*')
        .eq('creator_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Application[];
    },
    enabled: !!user,
  });

  // Fetch listings for applications
  const listingIds = [...new Set(applications.map(a => a.listing_id))];
  const { data: listings = {} } = useQuery({
    queryKey: ['listings-for-applications', listingIds],
    queryFn: async () => {
      if (listingIds.length === 0) return {};
      const { data } = await supabase
        .from('sponsor_listings')
        .select('id, title, quest_type, budget_range, sponsor_id')
        .in('id', listingIds);
      
      const map: Record<string, Listing> = {};
      data?.forEach(l => { map[l.id] = l; });
      return map;
    },
    enabled: listingIds.length > 0,
  });

  // Fetch sponsors
  const sponsorIds = [...new Set(Object.values(listings).map(l => l.sponsor_id))];
  const { data: sponsors = {} } = useQuery({
    queryKey: ['sponsors-for-applications', sponsorIds],
    queryFn: async () => {
      if (sponsorIds.length === 0) return {};
      const { data } = await supabase
        .from('sponsor_profiles')
        .select('id, name, logo_url, slug')
        .in('id', sponsorIds);
      
      const map: Record<string, SponsorProfile> = {};
      data?.forEach(s => { map[s.id] = s; });
      return map;
    },
    enabled: sponsorIds.length > 0,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'reviewing':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
            <AlertCircle className="h-3 w-3" />
            Reviewing
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case 'declined':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Declined
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No applications yet</h3>
          <p className="text-muted-foreground mb-4">
            Browse sponsor listings to find opportunities
          </p>
          <Button asChild>
            <Link to="/creator/browse-listings">Browse Opportunities</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => {
        const listing = listings[app.listing_id];
        const sponsor = listing ? sponsors[listing.sponsor_id] : null;

        return (
          <Card key={app.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Sponsor info */}
                <div className="flex items-center gap-3 md:w-48 shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={sponsor?.logo_url || undefined} />
                    <AvatarFallback>
                      <Building2 className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    {sponsor?.slug ? (
                      <Link 
                        to={`/sponsors/${sponsor.slug}`}
                        className="font-medium hover:text-primary flex items-center gap-1"
                      >
                        {sponsor?.name || 'Sponsor'}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <p className="font-medium">{sponsor?.name || 'Sponsor'}</p>
                    )}
                  </div>
                </div>

                {/* Application details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold">{listing?.title || 'Listing'}</h3>
                    {getStatusBadge(app.status)}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {listing?.quest_type && (
                      <Badge variant="outline">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {listing.quest_type}
                      </Badge>
                    )}
                    {listing?.budget_range && (
                      <Badge variant="secondary">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {BUDGET_LABELS[listing.budget_range] || listing.budget_range}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    <span className="font-medium">Your pitch:</span> {app.pitch_message}
                  </p>

                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Applied {new Date(app.created_at).toLocaleDateString()}
                    {app.response_at && (
                      <span className="ml-2">
                        • Responded {new Date(app.response_at).toLocaleDateString()}
                      </span>
                    )}
                  </p>

                  {/* Sponsor notes for declined */}
                  {app.status === 'declined' && app.sponsor_notes && (
                    <div className="mt-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                      <p className="text-sm font-medium text-destructive mb-1">Feedback</p>
                      <p className="text-sm text-muted-foreground">{app.sponsor_notes}</p>
                    </div>
                  )}

                  {/* Success message for accepted */}
                  {app.status === 'accepted' && (
                    <div className="mt-3 p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                      <p className="text-sm font-medium text-green-600">
                        🎉 Congratulations! The sponsor will reach out to discuss next steps.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
