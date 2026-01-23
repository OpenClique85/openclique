import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileModal } from '@/components/ProfileModal';
import { CancelModal } from '@/components/CancelModal';
import { MySquadsSection } from '@/components/squads/MySquadsSection';
import { RewardClaimCard, RewardClaimModal } from '@/components/rewards';
import { QuestJourneyTimeline } from '@/components/quests';
import { ContinueYourJourney } from '@/components/progression/ContinueYourJourney';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Calendar, MessageCircle, ExternalLink, Search, Star, CheckCircle, Gift, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type QuestSignup = Tables<'quest_signups'>;
type Quest = Tables<'quests'>;
type Reward = Tables<'rewards'>;

type SignupWithQuest = QuestSignup & {
  quest: Quest & {
    sponsor_profiles?: { id: string; name: string } | null;
  };
};

// Extended type with squad journey data
type SignupWithJourney = SignupWithQuest & {
  squadId?: string | null;
  squadStatus?: string | null;
  squadName?: string | null;
  questCardToken?: string | null;
};

type RewardWithSponsor = Reward & {
  sponsorName?: string;
  questId?: string;
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
  const { user, profile, isLoading: authLoading, isProfileLoaded } = useAuth();
  const [signups, setSignups] = useState<SignupWithJourney[]>([]);
  const [availableRewards, setAvailableRewards] = useState<RewardWithSponsor[]>([]);
  const [claimedRewardIds, setClaimedRewardIds] = useState<Set<string>>(new Set());
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    signupId: string;
    questTitle: string;
  }>({ open: false, signupId: '', questTitle: '' });
  const [claimModal, setClaimModal] = useState<{
    open: boolean;
    reward: RewardWithSponsor | null;
  }>({ open: false, reward: null });

  // Only show profile modal after profile fetch completes AND there's no profile
  useEffect(() => {
    if (user && !profile && !authLoading && isProfileLoaded) {
      setShowProfileModal(true);
    }
  }, [user, profile, authLoading, isProfileLoaded]);

  const fetchSignups = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    // Fetch signups with quest and sponsor info
    const { data, error } = await supabase
      .from('quest_signups')
      .select(`
        *,
        quest:quests(
          *,
          sponsor_profiles(id, name)
        )
      `)
      .eq('user_id', user.id)
      .order('signed_up_at', { ascending: false });
    
    if (!error && data) {
      const signupData = data as SignupWithQuest[];
      
      // Fetch squad memberships for these signups
      const signupIds = signupData.map(s => s.id);
      const { data: squadMemberships } = await supabase
        .from('squad_members')
        .select(`
          signup_id,
          squad_id,
          quest_squads(
            id,
            status,
            squad_name,
            quest_instances(quest_card_token)
          )
        `)
        .eq('user_id', user.id)
        .in('signup_id', signupIds)
        .neq('status', 'dropped');
      
      // Create lookup map for enriching signups with squad data
      const squadBySignup = new Map<string, {
        squadId: string;
        squadStatus: string;
        squadName: string | null;
        questCardToken: string | null;
      }>();
      
      squadMemberships?.forEach(m => {
        if (m.quest_squads) {
          const squad = m.quest_squads as unknown as {
            id: string;
            status: string;
            squad_name: string | null;
            quest_instances: { quest_card_token: string | null } | null;
          };
          squadBySignup.set(m.signup_id, {
            squadId: squad.id,
            squadStatus: squad.status,
            squadName: squad.squad_name,
            questCardToken: squad.quest_instances?.quest_card_token || null,
          });
        }
      });
      
      // Enrich signups with squad data
      const enrichedSignups: SignupWithJourney[] = signupData.map(signup => {
        const squadInfo = squadBySignup.get(signup.id);
        return {
          ...signup,
          squadId: squadInfo?.squadId || null,
          squadStatus: squadInfo?.squadStatus || null,
          squadName: squadInfo?.squadName || null,
          questCardToken: squadInfo?.questCardToken || null,
        };
      });
      
      setSignups(enrichedSignups);
      
      // Check which quests already have feedback
      const questIds = signupData.map(s => s.quest_id);
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('quest_id')
        .eq('user_id', user.id)
        .in('quest_id', questIds);
      
      if (feedbackData) {
        setFeedbackSubmitted(new Set(feedbackData.map(f => f.quest_id)));
      }

      // Fetch rewards for sponsored quests where user is confirmed
      const sponsoredSignups = data.filter(
        s => s.quest.is_sponsored && 
        s.quest.sponsor_id && 
        ['confirmed', 'completed'].includes(s.status || '')
      );

      if (sponsoredSignups.length > 0) {
        const sponsorIds = [...new Set(sponsoredSignups.map(s => s.quest.sponsor_id).filter(Boolean))];
        
        // Fetch rewards for these sponsors
        const { data: rewardsData } = await supabase
          .from('rewards')
          .select('*')
          .in('sponsor_id', sponsorIds as string[])
          .eq('status', 'active');

        if (rewardsData) {
          // Filter out expired and maxed out rewards
          const now = new Date().toISOString();
          const validRewards = rewardsData.filter(r => {
            if (r.expires_at && r.expires_at < now) return false;
            if (r.max_redemptions && (r.redemptions_count || 0) >= r.max_redemptions) return false;
            return true;
          });

          // Enrich with sponsor names
          const enrichedRewards: RewardWithSponsor[] = validRewards.map(reward => {
            const signup = sponsoredSignups.find(s => s.quest.sponsor_id === reward.sponsor_id);
            return {
              ...reward,
              sponsorName: signup?.quest.sponsor_profiles?.name,
              questId: signup?.quest_id,
            };
          });

          setAvailableRewards(enrichedRewards);
        }

        // Fetch user's existing redemptions
        const { data: redemptions } = await supabase
          .from('reward_redemptions')
          .select('reward_id')
          .eq('user_id', user.id);

        if (redemptions) {
          setClaimedRewardIds(new Set(redemptions.map(r => r.reward_id)));
        }
      }
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

  const handleClaimReward = (reward: RewardWithSponsor) => {
    setClaimModal({ open: true, reward });
  };

  const handleRewardClaimed = () => {
    if (claimModal.reward) {
      setClaimedRewardIds(prev => new Set([...prev, claimModal.reward!.id]));
    }
  };

  // Filter rewards to show unclaimed ones first
  const unclaimedRewards = availableRewards.filter(r => !claimedRewardIds.has(r.id));
  const claimedRewards = availableRewards.filter(r => claimedRewardIds.has(r.id));

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

        {/* Your Rewards Section */}
        {availableRewards.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5 text-sunset" />
              Your Rewards ({unclaimedRewards.length} available)
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              {unclaimedRewards.map(reward => (
                <RewardClaimCard
                  key={reward.id}
                  reward={reward}
                  sponsorName={reward.sponsorName}
                  isClaimed={false}
                  onClaim={() => handleClaimReward(reward)}
                />
              ))}
              {claimedRewards.map(reward => (
                <RewardClaimCard
                  key={reward.id}
                  reward={reward}
                  sponsorName={reward.sponsorName}
                  isClaimed={true}
                  onClaim={() => {}}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* Continue Your Journey - Progression Trees */}
        {user && <ContinueYourJourney userId={user.id} />}
        
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
                          <div className="flex items-center gap-2">
                            <CardTitle className="font-display text-lg">
                              {signup.quest.title}
                            </CardTitle>
                            {signup.quest.is_sponsored && (
                              <Badge variant="outline" className="text-sunset border-sunset text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Sponsored
                              </Badge>
                            )}
                          </div>
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
                  
                  {/* Journey Timeline */}
                  <CardContent className="py-4 border-t bg-muted/20">
                    <QuestJourneyTimeline
                      signupStatus={signup.status as 'pending' | 'confirmed' | 'standby' | 'dropped' | 'no_show' | 'completed'}
                      squadId={signup.squadId}
                      squadStatus={signup.squadStatus}
                      questCardToken={signup.questCardToken}
                      questStartDate={signup.quest.start_datetime ? new Date(signup.quest.start_datetime) : null}
                    />
                  </CardContent>
                  
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

                        {/* Rewards indicator for sponsored quests */}
                        {signup.quest.is_sponsored && unclaimedRewards.some(r => r.questId === signup.quest_id) && (
                          <div className="flex items-center gap-2 text-sm text-sunset mb-3">
                            <Gift className="h-4 w-4" />
                            <span>Rewards available! Check the Rewards section above.</span>
                          </div>
                        )}
                      </>
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
              {pastSignups.map((signup) => {
                const isPast = signup.quest.start_datetime && new Date(signup.quest.start_datetime) < now;
                const wasAttending = ['confirmed', 'completed'].includes(signup.status || '');
                const canLeaveFeedback = isPast && wasAttending;
                const hasFeedback = feedbackSubmitted.has(signup.quest_id);
                
                return (
                  <Card key={signup.id} className="bg-muted/30">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl opacity-60">{signup.quest.icon || '🎯'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{signup.quest.title}</p>
                              {signup.quest.is_sponsored && (
                                <Badge variant="outline" className="text-sunset/60 border-sunset/40 text-xs">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Sponsored
                                </Badge>
                              )}
                            </div>
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
                          
                          {canLeaveFeedback && (
                            hasFeedback ? (
                              <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Feedback Sent
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/feedback/${signup.quest.id}`}>
                                  <Star className="h-4 w-4 mr-1" />
                                  Leave Feedback
                                </Link>
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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

      {/* Reward Claim Modal */}
      {user && (
        <RewardClaimModal
          isOpen={claimModal.open}
          onClose={() => setClaimModal({ open: false, reward: null })}
          reward={claimModal.reward}
          sponsorName={claimModal.reward?.sponsorName}
          questId={claimModal.reward?.questId}
          userId={user.id}
          onClaimed={handleRewardClaimed}
        />
      )}
    </div>
  );
}
