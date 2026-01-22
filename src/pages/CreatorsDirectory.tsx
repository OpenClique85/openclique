import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CTASection } from '@/components/CTASection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, MapPin, Star, Sparkles, ArrowUpDown } from 'lucide-react';

interface CreatorWithStats {
  user_id: string;
  display_name: string;
  slug: string | null;
  photo_url: string | null;
  city: string | null;
  bio: string | null;
  quest_count: number;
  avg_rating: number | null;
}

type SortOption = 'newest' | 'quests' | 'rating';

const CreatorsDirectory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('quests');

  // Fetch all active creators with stats
  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['creators-directory'],
    queryFn: async () => {
      // Fetch active creator profiles
      const { data: profiles, error: profileError } = await supabase
        .from('creator_profiles')
        .select('user_id, display_name, slug, photo_url, city, bio, created_at')
        .eq('status', 'active');

      if (profileError) {
        console.error('Error fetching creators:', profileError);
        return [];
      }

      // For each creator, get quest count and avg rating
      const creatorsWithStats: CreatorWithStats[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get quest count
          const { count: questCount } = await supabase
            .from('quests')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', profile.user_id)
            .in('status', ['open', 'closed', 'completed']);

          // Get average rating from quest_ratings view
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
            quest_count: questCount || 0,
            avg_rating: avgRating,
          };
        })
      );

      return creatorsWithStats;
    },
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

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return 0; // Would need created_at in the type
        case 'quests':
          return b.quest_count - a.quest_count;
        case 'rating':
          const ratingA = a.avg_rating ?? 0;
          const ratingB = b.avg_rating ?? 0;
          return ratingB - ratingA;
        default:
          return 0;
      }
    });

    return result;
  }, [creators, searchQuery, cityFilter, sortBy]);

  const handleCreatorClick = (slug: string | null) => {
    if (slug) {
      navigate(`/creators/${slug}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-creator/5 to-transparent">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              Meet Our Quest Creators
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the local experts who design unique experiences for the Austin community.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="px-4 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search creators by name..."
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
                    <SelectTrigger className="w-full sm:w-44">
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

                {/* Sort */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-full sm:w-44">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quests">Most Quests</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <section className="px-4 py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading creators...</p>
            </div>
          </section>
        )}

        {/* Creators Grid */}
        {!isLoading && (
          <section className="px-4 pb-16">
            <div className="max-w-6xl mx-auto">
              {filteredCreators.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredCreators.map((creator) => (
                      <Card
                        key={creator.user_id}
                        className={`overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${
                          creator.slug ? 'cursor-pointer' : 'cursor-default'
                        }`}
                        onClick={() => handleCreatorClick(creator.slug)}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center text-center space-y-3">
                            <Avatar className="h-20 w-20">
                              <AvatarImage src={creator.photo_url || undefined} />
                              <AvatarFallback className="text-2xl bg-creator/20 text-creator">
                                {creator.display_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="space-y-1">
                              <h3 className="font-display font-semibold text-foreground">
                                {creator.display_name}
                              </h3>
                              {creator.city && (
                                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {creator.city}
                                </p>
                              )}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm">
                              {creator.avg_rating !== null && creator.avg_rating > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                  <span className="font-medium">{creator.avg_rating.toFixed(1)}</span>
                                </div>
                              )}
                              <div className="text-muted-foreground">
                                {creator.quest_count} quest{creator.quest_count !== 1 ? 's' : ''}
                              </div>
                            </div>

                            {creator.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {creator.bio}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : creators.length === 0 ? (
                <div className="text-center py-16">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No creators yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Be among the first to design unique experiences for Austin.
                  </p>
                  <Button asChild>
                    <Link to="/creators/quest-creators">Become a Creator</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-2">No creators match your search.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setCityFilter(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Become a Creator CTA */}
        <section className="px-4 pb-16">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-creator/10 via-primary/10 to-sunset/10 rounded-2xl p-8 md:p-12">
            <Sparkles className="h-10 w-10 text-creator mx-auto mb-4" />
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              Want to Create Quests?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Turn your passion and local expertise into unforgettable group experiences. 
              Apply to become a Quest Creator and help build community in Austin.
            </p>
            <Button asChild size="lg">
              <Link to="/creators/quest-creators">Learn More & Apply</Link>
            </Button>
          </div>
        </section>

        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default CreatorsDirectory;
