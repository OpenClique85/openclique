import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileModal } from '@/components/ProfileModal';
import { CancelModal } from '@/components/CancelModal';
import { MySquadsSection } from '@/components/squads/MySquadsSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Calendar, MessageCircle, ExternalLink, Search } from 'lucide-react';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type QuestSignup = Tables<'quest_signups'>;
type Quest = Tables<'quests'>;

type SignupWithQuest = QuestSignup & {
  quest: Quest;
};

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  standby: { label: 'Standby', variant: 'outline' },
  dropped: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'destructive' },
  completed: { label: 'Completed', variant: 'default' },
};

export default function MyQuests() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [signups, setSignups] = useState<SignupWithQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    signupId: string;
    questTitle: string;
  }>({ open: false, signupId: '', questTitle: '' });

  useEffect(() => {
    if (user && !profile && !authLoading) {
      setShowProfileModal(true);
    }
  }, [user, profile, authLoading]);

  const fetchSignups = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('quest_signups')
      .select(`
        *,
        quest:quests(*)
      `)
      .eq('user_id', user.id)
      .order('signed_up_at', { ascending: false });
    
    if (!error && data) {
      setSignups(data as SignupWithQuest[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchSignups();
    }
  }, [user]);

  const now = new Date();
  const upcomingSignups = signups.filter(s => {
    if (!s.quest.start_datetime) return false;
    if (s.status === 'dropped' || s.status === 'no_show') return false;
    return new Date(s.quest.start_datetime) >= now;
  });
  
  const pastSignups = signups.filter(s => {
    if (!s.quest.start_datetime) return true;
    return new Date(s.quest.start_datetime) < now || s.status === 'completed';
  });

  const handleCancelClick = (signup: SignupWithQuest) => {
    setCancelModal({
      open: true,
      signupId: signup.id,
      questTitle: signup.quest.title
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">My Quests</h1>
            {profile && (
              <p className="text-muted-foreground mt-1">
                Welcome back, {profile.display_name}!
              </p>
            )}
          </div>
          <Button asChild>
            <Link to="/quests">
              <Search className="mr-2 h-4 w-4" />
              Browse Quests
            </Link>
          </Button>
        </div>
        
        {/* My Squads Section */}
        {user && <MySquadsSection userId={user.id} />}
        
        {/* Upcoming Quests */}
        <section className="mb-12">
          <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming ({upcomingSignups.length})
          </h2>
          
          {upcomingSignups.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't joined any upcoming quests yet.
                </p>
                <Button asChild>
                  <Link to="/quests">Find Your First Quest</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingSignups.map((signup) => (
                <Card key={signup.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{signup.quest.icon || '🎯'}</span>
                        <div>
                          <CardTitle className="font-display text-lg">
                            {signup.quest.title}
                          </CardTitle>
                          {signup.quest.start_datetime && (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(signup.quest.start_datetime), 'EEEE, MMMM d @ h:mm a')}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={STATUS_BADGES[signup.status || 'pending'].variant}>
                        {STATUS_BADGES[signup.status || 'pending'].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {signup.status === 'confirmed' && (
                      <>
                        {signup.quest.meeting_location_name && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <MapPin className="h-4 w-4" />
                            <span>{signup.quest.meeting_location_name}</span>
                            {signup.quest.meeting_address && (
                              <span className="text-muted-foreground/60">
                                • {signup.quest.meeting_address}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {signup.quest.whatsapp_invite_link && (
                          <a
                            href={signup.quest.whatsapp_invite_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 mb-4"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Join WhatsApp Group
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </>
                    )}
                    
                    {signup.status === 'pending' && (
                      <p className="text-sm text-muted-foreground mb-3">
                        Your signup is being reviewed. You'll be notified once confirmed!
                      </p>
                    )}
                    
                    {signup.status === 'standby' && (
                      <p className="text-sm text-amber-600 mb-3">
                        You're on the waitlist. We'll notify you if a spot opens up!
                      </p>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/quests`}>View Details</Link>
                      </Button>
                      {(signup.status === 'pending' || signup.status === 'confirmed' || signup.status === 'standby') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleCancelClick(signup)}
                        >
                          I Can't Go
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
        
        {/* Past Quests */}
        {pastSignups.length > 0 && (
          <section>
            <h2 className="text-xl font-display font-semibold mb-4 text-muted-foreground">
              Past Quests ({pastSignups.length})
            </h2>
            
            <div className="space-y-3">
              {pastSignups.map((signup) => (
                <Card key={signup.id} className="bg-muted/30">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl opacity-60">{signup.quest.icon || '🎯'}</span>
                        <div>
                          <p className="font-medium">{signup.quest.title}</p>
                          {signup.quest.start_datetime && (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(signup.quest.start_datetime), 'MMMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant={STATUS_BADGES[signup.status || 'pending'].variant}>
                          {STATUS_BADGES[signup.status || 'pending'].label}
                        </Badge>
                        
                        {signup.status === 'completed' && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/feedback/${signup.quest.id}`}>
                              Leave Feedback
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
      
      <Footer />
      
      {/* Profile Modal */}
      <ProfileModal
        open={showProfileModal}
        onComplete={() => setShowProfileModal(false)}
      />
      
      {/* Cancel Modal */}
      <CancelModal
        open={cancelModal.open}
        onOpenChange={(open) => setCancelModal(prev => ({ ...prev, open }))}
        signupId={cancelModal.signupId}
        questTitle={cancelModal.questTitle}
        onCancelled={fetchSignups}
      />
    </div>
  );
}
