import { Link, useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import QuestCard from '@/components/QuestCard';
import { transformQuest, type Quest } from '@/hooks/useQuests';
import { Loader2, MapPin, Instagram, Twitter, Globe, Sparkles, ClipboardList, Users, Star } from 'lucide-react';
import { FollowButton } from '@/components/social/FollowButton';
import { FollowerCountBadge } from '@/components/social/FollowerCountBadge';

type CreatorProfile = Tables<'creator_profiles'>;
type DbQuest = Tables<'quests'>;

interface Socials {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
}

function getSocialUrl(platform: string, value: string): string {
  if (value.startsWith('http')) return value;
  const cleanHandle = value.replace('@', '');
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${cleanHandle}`;
    case 'twitter':
      return `https://twitter.com/${cleanHandle}`;
    case 'tiktok':
      return `https://tiktok.com/@${cleanHandle}`;
    default:
      return value;
  }
}

export default function CreatorPublicProfile() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch creator profile
  const { data: creator, isLoading: creatorLoading, error: creatorError } = useQuery({
    queryKey: ['public-creator', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();
      
      if (error) throw error;
      return data as CreatorProfile;
    },
    enabled: !!slug,
  });

  // Fetch creator's published quests
  const { data: quests, isLoading: questsLoading } = useQuery<Quest[]>({
    queryKey: ['creator-public-quests', creator?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('creator_id', creator!.user_id)
        .in('status', ['open', 'closed', 'completed'])
        .order('start_datetime', { ascending: false });
      
      if (error) throw error;
      return (data as DbQuest[]).map(transformQuest);
    },
    enabled: !!creator?.user_id,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['creator-public-stats', creator?.user_id],
    queryFn: async () => {
      // Get all quest IDs
      const { data: creatorQuests } = await supabase
        .from('quests')
        .select('id')
        .eq('creator_id', creator!.user_id)
        .in('status', ['open', 'closed', 'completed']);

      const questIds = creatorQuests?.map(q => q.id) || [];
      
      if (questIds.length === 0) {
        return { totalQuests: 0, totalParticipants: 0, avgRating: null };
      }

      // Get signup count
      const { count: signupCount } = await supabase
        .from('quest_signups')
        .select('*', { count: 'exact', head: true })
        .in('quest_id', questIds)
        .in('status', ['confirmed', 'completed']);

      // Get average rating from quest_ratings view
      const { data: ratings } = await supabase
        .from('quest_ratings')
        .select('avg_rating, review_count')
        .in('quest_id', questIds);

      let avgRating = null;
      let totalReviews = 0;
      if (ratings && ratings.length > 0) {
        const validRatings = ratings.filter(r => r.avg_rating !== null);
        if (validRatings.length > 0) {
          const weightedSum = validRatings.reduce((sum, r) => sum + (Number(r.avg_rating) * Number(r.review_count || 0)), 0);
          totalReviews = validRatings.reduce((sum, r) => sum + Number(r.review_count || 0), 0);
          avgRating = totalReviews > 0 ? weightedSum / totalReviews : null;
        }
      }

      return {
        totalQuests: questIds.length,
        totalParticipants: signupCount || 0,
        avgRating,
      };
    },
    enabled: !!creator?.user_id,
  });

  const socials = (creator?.socials as Socials) || {};

  if (creatorLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (creatorError || !creator) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-4">Creator Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This creator profile doesn't exist or isn't active.
          </p>
          <Button asChild>
            <Link to="/quests">Browse Quests</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-creator/10 to-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-lg">
                <AvatarImage src={creator.photo_url || undefined} />
                <AvatarFallback className="text-4xl bg-creator/20 text-creator">
                  {creator.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  {creator.display_name}
                </h1>
                {creator.city && (
                  <p className="flex items-center justify-center md:justify-start gap-1 text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4" />
                    {creator.city}
                  </p>
                )}

                {/* Follower Count & Follow Button */}
                <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                  <FollowerCountBadge type="creator" targetId={creator.id} />
                  <FollowButton type="creator" targetId={creator.id} />
                </div>
                
                {creator.bio && (
                  <p className="text-muted-foreground mt-4 max-w-2xl">
                    {creator.bio}
                  </p>
                )}

                {/* Social Links */}
                {(socials.instagram || socials.twitter || socials.tiktok || socials.website) && (
                  <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                    {socials.instagram && (
                      <a
                        href={getSocialUrl('instagram', socials.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {socials.twitter && (
                      <a
                        href={getSocialUrl('twitter', socials.twitter)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {socials.tiktok && (
                      <a
                        href={getSocialUrl('tiktok', socials.tiktok)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <span className="text-base">🎵</span>
                      </a>
                    )}
                    {socials.website && (
                      <a
                        href={socials.website.startsWith('http') ? socials.website : `https://${socials.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg mx-auto md:mx-0">
              <Card className="text-center">
                <CardContent className="pt-4 pb-3">
                  <ClipboardList className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-2xl font-bold">{stats?.totalQuests || 0}</p>
                  <p className="text-xs text-muted-foreground">Quests</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-4 pb-3">
                  <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-2xl font-bold">{stats?.totalParticipants || 0}</p>
                  <p className="text-xs text-muted-foreground">Participants</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-4 pb-3">
                  <Star className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                  <p className="text-2xl font-bold">
                    {stats?.avgRating !== null ? stats.avgRating.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Quests Section */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-display font-bold mb-6">
            Quests by {creator.display_name}
          </h2>
          
          {questsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : quests && quests.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {quests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onClick={() => window.location.href = `/quests/${quest.slug}`}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No quests yet</h3>
                <p className="text-muted-foreground">
                  This creator hasn't published any quests yet. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* CTA Section */}
        <section className="bg-muted/50 py-12">
          <div className="container mx-auto px-4 text-center">
            <Sparkles className="h-8 w-8 text-creator mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold mb-2">
              Want to create quests like {creator.display_name}?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join our community of Quest Creators and design unique experiences that bring people together.
            </p>
            <Button asChild size="lg">
              <Link to="/creators/quest-creators">Become a Creator</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
