import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { SponsorPortalNav } from '@/components/sponsors/SponsorPortalNav';
import { SponsorshipProposalModal } from '@/components/sponsors/SponsorshipProposalModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Search, 
  MapPin, 
  Star, 
  Sparkles,
  Users,
  Handshake,
  Gift,
  Calendar,
  ArrowUpDown,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface CreatorWithStats {
  user_id: string;
  display_name: string;
  slug: string | null;
  photo_url: string | null;
  city: string | null;
  bio: string | null;
  seeking: string[] | null;
  quest_count: number;
  avg_rating: number | null;
  status: string;
}

type SortOption = 'quests' | 'rating' | 'name';

const SEEKING_OPTIONS = [
  { id: 'sponsorships', label: 'Sponsorships', icon: Gift, color: 'bg-primary/10 text-primary' },
  { id: 'org_partnerships', label: 'Org Partnerships', icon: Users, color: 'bg-creator/10 text-creator' },
  { id: 'custom_quests', label: 'Custom Quests', icon: Calendar, color: 'bg-sunset/10 text-sunset' },
];

export default function SponsorBrowseCreators() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [seekingFilter, setSeekingFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('quests');
  const [selectedCreator, setSelectedCreator] = useState<CreatorWithStats | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  // Fetch sponsor profile
  const { data: sponsorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['sponsor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('id, name')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch creators with stats
  const { data: creators = [], isLoading: creatorsLoading } = useQuery({
    queryKey: ['browse-creators-for-sponsors'],
    queryFn: async () => {
      const { data: profiles, error: profileError } = await supabase
        .from('creator_profiles')
        .select('user_id, display_name, slug, photo_url, city, bio, seeking, status')
        .eq('status', 'active');

      if (profileError) {
        console.error('Error fetching creators:', profileError);
        return [];
      }

      // Enrich with quest stats
      const creatorsWithStats: CreatorWithStats[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get quest count
          const { count: questCount } = await supabase
            .from('quests')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', profile.user_id)
            .in('status', ['open', 'closed', 'completed']);

          // Get average rating
          const { data: questIds } = await supabase
            .from('quests')
            .select('id')
            .eq('creator_id', profile.user_id)
            .in('status', ['open', 'closed', 'completed']);

          let avgRating: number | null = null;
          if (questIds && questIds.length > 0) {
            const { data: ratings } = await supabase
              .from('quest_ratings')
              .select('avg_rating, review_count')
              .in('quest_id', questIds.map(q => q.id));

            if (ratings && ratings.length > 0) {
              const totalReviews = ratings.reduce((sum, r) => sum + (r.review_count || 0), 0);
              const weightedSum = ratings.reduce(
                (sum, r) => sum + (r.avg_rating || 0) * (r.review_count || 0),
                0
              );
              if (totalReviews > 0) {
                avgRating = weightedSum / totalReviews;
              }
            }
          }

          return {
            user_id: profile.user_id,
            display_name: profile.display_name,
            slug: profile.slug,
            photo_url: profile.photo_url,
            city: profile.city,
            bio: profile.bio,
            seeking: profile.seeking,
            status: profile.status,
            quest_count: questCount || 0,
            avg_rating: avgRating,
          };
        })
      );

      return creatorsWithStats;
    },
    enabled: !!sponsorProfile,
  });

  // Get unique cities for filter
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(creators.map(c => c.city).filter(Boolean))];
    return uniqueCities.sort();
  }, [creators]);

  // Filter and sort creators
  const filteredCreators = useMemo(() => {
    let result = creators;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.display_name.toLowerCase().includes(query) ||
        c.bio?.toLowerCase().includes(query)
      );
    }

    // City filter
    if (cityFilter) {
      result = result.filter(c => c.city === cityFilter);
    }

    // Seeking filter
    if (seekingFilter) {
      result = result.filter(c => c.seeking?.includes(seekingFilter));
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'quests':
          return b.quest_count - a.quest_count;
        case 'rating':
          const ratingA = a.avg_rating ?? 0;
          const ratingB = b.avg_rating ?? 0;
          return ratingB - ratingA;
        case 'name':
          return a.display_name.localeCompare(b.display_name);
        default:
          return 0;
      }
    });

    return result;
  }, [creators, searchQuery, cityFilter, seekingFilter, sortBy]);

  const handleProposePartnership = (creator: CreatorWithStats) => {
    setSelectedCreator(creator);
    setIsProposalModalOpen(true);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!sponsorProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Handshake className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Become a Sponsor</h1>
          <p className="text-muted-foreground mb-6">
            Complete your sponsor profile to browse and partner with quest creators.
          </p>
          <Button asChild>
            <Link to="/sponsors/onboard">Get Started</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SponsorPortalNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Browse Creators
          </h1>
          <p className="text-muted-foreground">
            Discover talented quest creators and propose partnerships for custom experiences.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search creators by name or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* City Filter */}
            {cities.length > 0 && (
              <Select
                value={cityFilter || 'all'}
                onValueChange={(v) => setCityFilter(v === 'all' ? null : v)}
              >
                <SelectTrigger className="w-full lg:w-40">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city!}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Seeking Filter */}
            <Select
              value={seekingFilter || 'all'}
              onValueChange={(v) => setSeekingFilter(v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-full lg:w-48">
                <Sparkles className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Looking For" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Availability</SelectItem>
                {SEEKING_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full lg:w-40">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quests">Most Quests</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading */}
        {creatorsLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading creators...</p>
          </div>
        )}

        {/* Results */}
        {!creatorsLoading && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''} found
            </p>

            {filteredCreators.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCreators.map((creator) => (
                  <Card key={creator.user_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={creator.photo_url || undefined} />
                          <AvatarFallback className="text-lg bg-creator/20 text-creator">
                            {creator.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {creator.display_name}
                          </CardTitle>
                          {creator.city && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {creator.city}
                            </p>
                          )}
                          {/* Stats */}
                          <div className="flex items-center gap-3 mt-2 text-sm">
                            {creator.avg_rating !== null && creator.avg_rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <span className="font-medium">{creator.avg_rating.toFixed(1)}</span>
                              </div>
                            )}
                            <span className="text-muted-foreground">
                              {creator.quest_count} quest{creator.quest_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Bio */}
                      {creator.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {creator.bio}
                        </p>
                      )}

                      {/* Seeking Badges */}
                      {creator.seeking && creator.seeking.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {creator.seeking.map((item) => {
                            const opt = SEEKING_OPTIONS.find(o => o.id === item);
                            if (!opt) return null;
                            const Icon = opt.icon;
                            return (
                              <Badge 
                                key={item} 
                                variant="secondary" 
                                className={`text-xs ${opt.color}`}
                              >
                                <Icon className="h-3 w-3 mr-1" />
                                {opt.label}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleProposePartnership(creator)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Propose Partnership
                        </Button>
                        {creator.slug && (
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/creators/${creator.slug}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No creators found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setCityFilter(null);
                    setSeekingFilter(null);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Proposal Modal */}
      {sponsorProfile && selectedCreator && (
        <SponsorshipProposalModal
          isOpen={isProposalModalOpen}
          onClose={() => {
            setIsProposalModalOpen(false);
            setSelectedCreator(null);
          }}
          sponsorId={sponsorProfile.id}
          creator={selectedCreator}
        />
      )}
    </div>
  );
}
