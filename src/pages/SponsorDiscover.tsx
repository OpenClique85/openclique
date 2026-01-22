import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SponsorPortalNav } from '@/components/sponsors/SponsorPortalNav';
import { SponsorshipProposalModal } from '@/components/sponsors/SponsorshipProposalModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Loader2, 
  Search,
  MapPin,
  Calendar,
  Users,
  Star,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

export default function SponsorDiscover() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'quests';
  
  const [questSearch, setQuestSearch] = useState('');
  const [creatorSearch, setCreatorSearch] = useState('');
  const [selectedQuest, setSelectedQuest] = useState<any>(null);
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  // Fetch sponsor profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['sponsor-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch sponsorable quests (open, not already sponsored)
  const { data: quests, isLoading: questsLoading } = useQuery({
    queryKey: ['sponsorable-quests', questSearch],
    queryFn: async () => {
      let query = supabase
        .from('quests')
        .select('*')
        .eq('status', 'open')
        .eq('is_sponsored', false)
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime', { ascending: true });
      
      if (questSearch) {
        query = query.or(`title.ilike.%${questSearch}%,short_description.ilike.%${questSearch}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Fetch active creators
  const { data: creators, isLoading: creatorsLoading } = useQuery({
    queryKey: ['active-creators', creatorSearch],
    queryFn: async () => {
      let query = supabase
        .from('creator_profiles')
        .select('*')
        .eq('status', 'active')
        .order('display_name');
      
      if (creatorSearch) {
        query = query.or(`display_name.ilike.%${creatorSearch}%,bio.ilike.%${creatorSearch}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const handleSponsorQuest = (quest: any) => {
    setSelectedQuest(quest);
    setSelectedCreator(null);
    setIsProposalModalOpen(true);
  };

  const handleRequestFromCreator = (creator: any) => {
    setSelectedCreator(creator);
    setSelectedQuest(null);
    setIsProposalModalOpen(true);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Please complete sponsor onboarding first.</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <SponsorPortalNav />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Discover</h1>
            <p className="text-muted-foreground">
              Find quests to sponsor or creators to work with
            </p>
          </div>

          <Tabs defaultValue={initialTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="quests">Browse Quests</TabsTrigger>
              <TabsTrigger value="creators">Find Creators</TabsTrigger>
            </TabsList>

            {/* Quests Tab */}
            <TabsContent value="quests" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quests..."
                  value={questSearch}
                  onChange={(e) => setQuestSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {questsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : quests?.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No Quests Found</h3>
                    <p className="text-muted-foreground">
                      {questSearch ? 'Try a different search term' : 'No sponsorable quests available right now'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quests?.map((quest) => (
                    <Card key={quest.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          {quest.image_url ? (
                            <img 
                              src={quest.image_url} 
                              alt={quest.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                              {quest.icon || '🎯'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-1">{quest.title}</CardTitle>
                            <CardDescription className="line-clamp-2 text-xs mt-1">
                              {quest.short_description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {quest.start_datetime && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(quest.start_datetime), 'MMM d')}
                            </div>
                          )}
                          {quest.meeting_location_name && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[100px]">{quest.meeting_location_name}</span>
                            </div>
                          )}
                          {quest.capacity_total && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {quest.capacity_total}
                            </div>
                          )}
                        </div>

                        {quest.tags && quest.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {quest.tags.slice(0, 2).map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleSponsorQuest(quest)}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Sponsor This Quest
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Creators Tab */}
            <TabsContent value="creators" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search creators..."
                  value={creatorSearch}
                  onChange={(e) => setCreatorSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {creatorsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : creators?.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No Creators Found</h3>
                    <p className="text-muted-foreground">
                      {creatorSearch ? 'Try a different search term' : 'No active creators available'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {creators?.map((creator) => (
                    <Card key={creator.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={creator.photo_url || undefined} />
                            <AvatarFallback>{creator.display_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base">{creator.display_name}</CardTitle>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              {creator.city || 'Austin'}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {creator.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {creator.bio}
                          </p>
                        )}

                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full"
                          onClick={() => handleRequestFromCreator(creator)}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Request Custom Quest
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {profile && (
        <SponsorshipProposalModal
          isOpen={isProposalModalOpen}
          onClose={() => {
            setIsProposalModalOpen(false);
            setSelectedQuest(null);
            setSelectedCreator(null);
          }}
          sponsorId={profile.id}
          quest={selectedQuest}
          creator={selectedCreator}
        />
      )}
    </div>
  );
}
