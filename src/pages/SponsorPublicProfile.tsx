/**
 * SponsorPublicProfile - Public-facing sponsor profile page
 * Displays brand info, rewards, venues, and open listings
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowButton } from '@/components/social/FollowButton';
import { FollowerCountBadge } from '@/components/social/FollowerCountBadge';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Gift, 
  Users, 
  Sparkles,
  ExternalLink,
  Trophy,
  Calendar,
  Target
} from 'lucide-react';

type SponsorProfile = Tables<'sponsor_profiles'>;
type Reward = Tables<'rewards'>;
type VenueOffering = Tables<'venue_offerings'>;

interface TargetAudience {
  age_ranges?: string[];
  interests?: string[];
}

export default function SponsorPublicProfile() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch sponsor profile
  const { data: sponsor, isLoading: loadingSponsor, error } = useQuery({
    queryKey: ['sponsor-public-profile', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();
      
      if (error) throw error;
      return data as SponsorProfile;
    },
    enabled: !!slug,
  });

  // Fetch rewards
  const { data: rewards = [] } = useQuery({
    queryKey: ['sponsor-public-rewards', sponsor?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards')
        .select('*')
        .eq('sponsor_id', sponsor!.id)
        .eq('status', 'active');
      return (data || []) as Reward[];
    },
    enabled: !!sponsor?.id,
  });

  // Fetch venues
  const { data: venues = [] } = useQuery({
    queryKey: ['sponsor-public-venues', sponsor?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('venue_offerings')
        .select('*')
        .eq('sponsor_id', sponsor!.id)
        .eq('status', 'available');
      return (data || []) as VenueOffering[];
    },
    enabled: !!sponsor?.id,
  });

  // Fetch sponsored quests
  const { data: sponsoredQuests = [] } = useQuery({
    queryKey: ['sponsor-public-quests', sponsor?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('quests')
        .select('id, title, slug, icon, status')
        .eq('sponsor_id', sponsor!.id)
        .in('status', ['open', 'closed', 'completed']);
      return data || [];
    },
    enabled: !!sponsor?.id,
  });

  // Fetch open listings
  const { data: openListings = [] } = useQuery({
    queryKey: ['sponsor-public-listings', sponsor?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('sponsor_listings')
        .select('*')
        .eq('sponsor_id', sponsor!.id)
        .eq('status', 'open');
      return data || [];
    },
    enabled: !!sponsor?.id,
  });

  if (loadingSponsor) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-12">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !sponsor) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-12">
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sponsor Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This sponsor profile doesn't exist or isn't public yet.
              </p>
              <Button asChild>
                <Link to="/partners">Become a Sponsor</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const targetAudience = sponsor.target_audience as TargetAudience | null;
  const sponsorType = sponsor.sponsor_type || 'brand';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={sponsor.logo_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {sponsor.name?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-3xl font-display font-bold">{sponsor.name}</h1>
                  <Badge variant="secondary" className="capitalize">
                    {sponsorType === 'both' ? 'Brand & Venue' : sponsorType}
                  </Badge>
                </div>
                
                {sponsor.city && (
                  <p className="text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="h-4 w-4" />
                    {sponsor.city}
                  </p>
                )}

                {/* Follower Count & Follow Button */}
                <div className="flex items-center gap-4 mb-4">
                  <FollowerCountBadge type="sponsor" targetId={sponsor.id} />
                  <FollowButton type="sponsor" targetId={sponsor.id} />
                </div>
                
                {sponsor.description && (
                  <p className="text-foreground/80 mb-4">{sponsor.description}</p>
                )}
                
                {sponsor.website && (
                  <a 
                    href={sponsor.website.startsWith('http') ? sponsor.website : `https://${sponsor.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Visit Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-8 border-b">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{sponsoredQuests.length}</p>
                <p className="text-sm text-muted-foreground">Sponsored Quests</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{rewards.length}</p>
                <p className="text-sm text-muted-foreground">Active Rewards</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{openListings.length}</p>
                <p className="text-sm text-muted-foreground">Open Listings</p>
              </div>
            </div>
          </div>
        </section>

        <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Target Audience */}
          {targetAudience && (targetAudience.age_ranges?.length || targetAudience.interests?.length) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {targetAudience.age_ranges && targetAudience.age_ranges.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Age Groups</p>
                    <div className="flex flex-wrap gap-1">
                      {targetAudience.age_ranges.map((age) => (
                        <Badge key={age} variant="outline">{age}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {targetAudience.interests && targetAudience.interests.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Interests</p>
                    <div className="flex flex-wrap gap-1">
                      {targetAudience.interests.map((interest) => (
                        <Badge key={interest} variant="secondary">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Open Listings */}
          {openListings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Seeking Creators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {openListings.map((listing: any) => (
                  <Link 
                    key={listing.id}
                    to={`/creator/browse-listings?listing=${listing.id}`}
                    className="block p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-medium">{listing.title}</h4>
                        {listing.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {listing.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {listing.quest_type && (
                            <Badge variant="outline">{listing.quest_type}</Badge>
                          )}
                          {listing.budget_range && (
                            <Badge variant="secondary">{listing.budget_range}</Badge>
                          )}
                        </div>
                      </div>
                      <Badge className="shrink-0">
                        {listing.applications_count} applied
                      </Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Rewards */}
          {rewards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Available Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <Trophy className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{reward.name}</p>
                        {reward.description && (
                          <p className="text-sm text-muted-foreground">{reward.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Venues */}
          {venues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Available Venues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {venues.map((venue) => (
                    <div key={venue.id} className="p-3 rounded-lg border">
                      <p className="font-medium">{venue.venue_name}</p>
                      {venue.address && (
                        <p className="text-sm text-muted-foreground">{venue.address}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {venue.capacity && (
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            Up to {venue.capacity}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sponsored Quests */}
          {sponsoredQuests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Sponsored Quests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {sponsoredQuests.map((quest) => (
                    <Link 
                      key={quest.id}
                      to={`/quests/${quest.slug}`}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-xl">{quest.icon || '🎯'}</span>
                      <span className="font-medium">{quest.title}</span>
                      <Badge variant="outline" className="ml-auto capitalize">{quest.status}</Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
