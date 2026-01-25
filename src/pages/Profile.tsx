/**
 * =============================================================================
 * PROFILE PAGE - User profile, preferences, gamification, and quest history
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Loader2, Settings, Calendar, ChevronRight, User, Gamepad2 } from 'lucide-react';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { ProfileGamificationSection } from '@/components/profile/ProfileGamificationSection';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;
type QuestSignup = Tables<'quest_signups'>;

interface SignupWithQuest extends QuestSignup {
  quest: Quest;
}

export default function Profile() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [signups, setSignups] = useState<SignupWithQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('quest_signups')
        .select('*, quest:quests(*)')
        .eq('user_id', user.id)
        .order('signed_up_at', { ascending: false });
      
      if (data) {
        setSignups(data.filter(s => s.quest) as SignupWithQuest[]);
      }
      setIsLoading(false);
    };

    if (user) {
      fetchHistory();
    }
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedQuests = signups.filter(s => 
    s.status === 'completed' || 
    (s.quest.start_datetime && new Date(s.quest.start_datetime) < new Date() && s.status === 'confirmed')
  );
  const upcomingQuests = signups.filter(s => 
    s.quest.start_datetime && new Date(s.quest.start_datetime) >= new Date() && 
    !['dropped', 'no_show'].includes(s.status || '')
  );

  // Extract interests from preferences
  const preferences = profile?.preferences as { interest_tags?: string[] } | null;
  const interestTags = preferences?.interest_tags || [];

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-display font-bold text-primary">
                    {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h1 className="text-2xl font-display font-bold text-foreground">
                      {profile?.display_name || 'Adventurer'}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      {user?.email}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Member since {profile?.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : 'recently'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              {/* Interests */}
              {interestTags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {interestTags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag === 'culture' && '🎨 Culture & Arts'}
                        {tag === 'wellness' && '🏃 Wellness & Fitness'}
                        {tag === 'connector' && '🤝 Social & Networking'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                Progress
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">{completedQuests.length}</div>
                    <p className="text-sm text-muted-foreground">Quests Completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">{upcomingQuests.length}</div>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">
                      {new Set(completedQuests.map(s => s.quest.progression_tree)).size}
                    </div>
                    <p className="text-sm text-muted-foreground">Paths Explored</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">0</div>
                    <p className="text-sm text-muted-foreground">Squad Members</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quest History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Quest History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {signups.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">You haven't joined any quests yet</p>
                      <Button onClick={() => navigate('/quests')}>Find Your First Quest</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {signups.slice(0, 10).map((signup) => {
                        const isPast = signup.quest.start_datetime && new Date(signup.quest.start_datetime) < new Date();
                        return (
                          <div
                            key={signup.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/quests/${signup.quest.slug}`)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{signup.quest.icon}</span>
                              <div>
                                <p className="font-medium text-foreground">{signup.quest.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {signup.quest.start_datetime ? format(new Date(signup.quest.start_datetime), 'MMM d, yyyy') : 'Date TBD'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={isPast ? 'secondary' : 'default'}>
                                {isPast ? (signup.status === 'completed' ? 'Completed' : 'Past') : 'Upcoming'}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Progress Tab (Gamification) */}
            <TabsContent value="progress" className="mt-6">
              <ProfileGamificationSection />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Edit Profile Modal */}
      <ProfileEditModal 
        open={showEditModal} 
        onClose={() => setShowEditModal(false)} 
      />
    </div>
  );
}
