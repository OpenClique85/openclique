/**
 * =============================================================================
 * QuestsTab - Quest management for unified Profile page
 * =============================================================================
 * 
 * Combines content from MyQuests page:
 * - Continue Your Journey (progression trees)
 * - Your Rewards
 * - Upcoming Quests
 * - Past Quests
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ContinueYourJourney } from '@/components/progression/ContinueYourJourney';
import { PendingFeedbackSection } from './PendingFeedbackSection';
import { RewardClaimCard, RewardClaimModal } from '@/components/rewards';
import { ActiveQuestCard } from './ActiveQuestCard';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';
import { CancelModal } from '@/components/CancelModal';
import { usePinnedQuests, useUnpinQuest } from '@/hooks/usePinnedQuests';
import { useQuests } from '@/hooks/useQuests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Star, CheckCircle, Gift, Sparkles, Search, Bookmark, X, Zap, History, Compass } from 'lucide-react';
import { format, isToday as checkIsToday } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type QuestSignup = Tables<'quest_signups'>;
type Quest = Tables<'quests'>;
type Reward = Tables<'rewards'>;

type SignupWithQuest = QuestSignup & {
  quest: Quest & {
    sponsor_profiles?: { id: string; name: string } | null;
  };
};

type SignupWithJourney = SignupWithQuest & {
  squadId?: string | null;
  squadStatus?: string | null;
  squadName?: string | null;
  questCardToken?: string | null;
  squadMembers?: Array<{ user_id: string; display_name: string }>;
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

interface QuestsTabProps {
  userId: string;
}

export function QuestsTab({ userId }: QuestsTabProps) {
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)');
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  
  // All hooks must be called before any conditional returns
  const { data: pinnedQuests = [], isLoading: isPinnedLoading } = usePinnedQuests();
  const { data: allQuests = [] } = useQuests();
  const unpinMutation = useUnpinQuest();
  
  const [signups, setSignups] = useState<SignupWithJourney[]>([]);
  const [availableRewards, setAvailableRewards] = useState<RewardWithSponsor[]>([]);
  const [claimedRewardIds, setClaimedRewardIds] = useState<Set<string>>(new Set());
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    signupId: string;
    questTitle: string;
  }>({ open: false, signupId: '', questTitle: '' });
  const [claimModal, setClaimModal] = useState<{
    open: boolean;
    reward: RewardWithSponsor | null;
  }>({ open: false, reward: null });

  const fetchSignups = async () => {
    setIsLoading(true);
    
    // Fetch signups with quest and sponsor info
    // Filter out quests that have been cancelled, revoked, or soft-deleted by admin
    const { data, error } = await supabase
      .from('quest_signups')
      .select(`
        *,
        quest:quests(
          *,
          sponsor_profiles(id, name)
        )
      `)
      .eq('user_id', userId)
      .order('signed_up_at', { ascending: false });
    
    if (!error && data) {
      // Filter out signups for quests that have been cancelled, revoked, or deleted by admin
      const signupData = (data as SignupWithQuest[]).filter(signup => {
        const quest = signup.quest;
        // Remove if quest is cancelled, revoked, or soft-deleted
        if (quest.status === 'cancelled') return false;
        if ('deleted_at' in quest && quest.deleted_at) return false;
        // Check for revoked status (if exists in quest status enum)
        if ((quest.status as string) === 'revoked') return false;
        return true;
      });
      
      // Fetch squad memberships for this user
      // We need to match by user_id and then link to signups via quest relationship
      // because signup_id in squad_members may be NULL when admins create cliques
      const signupIds = signupData.map(s => s.id);
      const signupQuestIds = signupData.map(s => s.quest_id);
      
      let squadBySignup = new Map<string, {
        squadId: string;
        squadStatus: string;
        squadName: string | null;
        questCardToken: string | null;
        squadMembers: Array<{ user_id: string; display_name: string }>;
      }>();
      
      // Build a map of quest_id -> signup for matching
      const signupByQuestId = new Map<string, string>();
      signupData.forEach(s => {
        signupByQuestId.set(s.quest_id, s.id);
      });
      
      if (signupIds.length > 0) {
        // First try to find memberships by signup_id
        const { data: squadMemberships } = await supabase
          .from('squad_members')
          .select(`
            signup_id,
            squad_id,
            quest_squads(
              id,
              status,
              squad_name,
              instance_id,
              quest_instances(quest_card_token, quest_id)
            )
          `)
          .eq('user_id', userId)
          .neq('status', 'dropped');
        
        // Collect all squad IDs to fetch members
        const squadIds = new Set<string>();
        squadMemberships?.forEach(m => {
          if (m.quest_squads) {
            const squad = m.quest_squads as unknown as { id: string };
            squadIds.add(squad.id);
          }
        });
        
        // Fetch all squad members for those squads
        let membersBySquad = new Map<string, Array<{ user_id: string; display_name: string }>>();
        if (squadIds.size > 0) {
          const { data: allSquadMembers } = await supabase
            .from('squad_members')
            .select('squad_id, user_id')
            .in('squad_id', Array.from(squadIds))
            .eq('status', 'active');
          
          if (allSquadMembers && allSquadMembers.length > 0) {
            const memberUserIds = allSquadMembers.map(m => m.user_id);
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, display_name')
              .in('id', memberUserIds);
            
            allSquadMembers.forEach(m => {
              const profile = profiles?.find(p => p.id === m.user_id);
              const existing = membersBySquad.get(m.squad_id) || [];
              existing.push({
                user_id: m.user_id,
                display_name: profile?.display_name || 'Unknown'
              });
              membersBySquad.set(m.squad_id, existing);
            });
          }
        }
        
        squadMemberships?.forEach(m => {
          if (m.quest_squads) {
            const squad = m.quest_squads as unknown as {
              id: string;
              status: string;
              squad_name: string | null;
              instance_id: string;
              quest_instances: { quest_card_token: string | null; quest_id: string } | null;
            };
            
            // Match to signup either by signup_id or by quest_id from the instance
            let signupId: string | null = m.signup_id;
            
            if (!signupId && squad.quest_instances?.quest_id) {
              // Find the signup for this quest
              signupId = signupByQuestId.get(squad.quest_instances.quest_id) || null;
            }
            
            if (signupId) {
              squadBySignup.set(signupId, {
                squadId: squad.id,
                squadStatus: squad.status,
                squadName: squad.squad_name,
                questCardToken: squad.quest_instances?.quest_card_token || null,
                squadMembers: membersBySquad.get(squad.id) || [],
              });
            }
          }
        });
      }
      
      const enrichedSignups: SignupWithJourney[] = signupData.map(signup => {
        const squadInfo = squadBySignup.get(signup.id);
        return {
          ...signup,
          squadId: squadInfo?.squadId || null,
          squadStatus: squadInfo?.squadStatus || null,
          squadName: squadInfo?.squadName || null,
          questCardToken: squadInfo?.questCardToken || null,
          squadMembers: squadInfo?.squadMembers || [],
        };
      });
      
      setSignups(enrichedSignups);
      
      // Check feedback
      const questIds = signupData.map(s => s.quest_id);
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('quest_id')
        .eq('user_id', userId)
        .in('quest_id', questIds);
      
      if (feedbackData) {
        setFeedbackSubmitted(new Set(feedbackData.map(f => f.quest_id)));
      }

      // Fetch rewards
      const sponsoredSignups = data.filter(
        s => s.quest.is_sponsored && 
        s.quest.sponsor_id && 
        ['confirmed', 'completed'].includes(s.status || '')
      );

      if (sponsoredSignups.length > 0) {
        const sponsorIds = [...new Set(sponsoredSignups.map(s => s.quest.sponsor_id).filter(Boolean))];
        
        const { data: rewardsData } = await supabase
          .from('rewards')
          .select('*')
          .in('sponsor_id', sponsorIds as string[])
          .eq('status', 'active');

        if (rewardsData) {
          const now = new Date().toISOString();
          const validRewards = rewardsData.filter(r => {
            if (r.expires_at && r.expires_at < now) return false;
            if (r.max_redemptions && (r.redemptions_count || 0) >= r.max_redemptions) return false;
            return true;
          });

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

        const { data: redemptions } = await supabase
          .from('reward_redemptions')
          .select('reward_id')
          .eq('user_id', userId);

        if (redemptions) {
          setClaimedRewardIds(new Set(redemptions.map(r => r.reward_id)));
        }
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSignups();
  }, [userId]);

  // Keep user view in sync with admin actions (clique creation/locking/warm-up transitions)
  // by listening for membership + squad status changes.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`quests-tab-sync:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'squad_members',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchSignups();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quest_squads',
        },
        () => {
          // Squad status updates don't always touch squad_members rows
          fetchSignups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const now = new Date();
  
  // Temporal classification helper
  const classifySignup = (signup: SignupWithJourney): 'today' | 'upcoming' | 'past' => {
    const startDate = signup.quest.start_datetime 
      ? new Date(signup.quest.start_datetime) 
      : null;
    const endDate = signup.quest.end_datetime 
      ? new Date(signup.quest.end_datetime) 
      : startDate; // Fallback to start if no end specified
    
    // Dropped/no-show always past
    if (signup.status === 'dropped' || signup.status === 'no_show') return 'past';
    
    // No date = treat as upcoming
    if (!startDate) return 'upcoming';
    
    // Quest has ended (end_datetime passed)
    if (endDate && endDate < now) return 'past';
    
    // Check if quest is "today" (starts today OR currently running)
    const startsToday = checkIsToday(startDate);
    const isOngoing = startDate <= now && endDate && endDate >= now;
    
    if (startsToday || isOngoing) return 'today';
    
    return 'upcoming';
  };

  const todaySignups = signups.filter(s => classifySignup(s) === 'today');
  const upcomingSignups = signups.filter(s => classifySignup(s) === 'upcoming');
  const pastSignups = signups.filter(s => classifySignup(s) === 'past');

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

  const unclaimedRewards = availableRewards.filter(r => !claimedRewardIds.has(r.id));
  const claimedRewards = availableRewards.filter(r => claimedRewardIds.has(r.id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get full quest data for pinned quests
  const pinnedQuestsWithData = pinnedQuests
    .map(pin => {
      const quest = allQuests.find(q => q.id === pin.quest_id);
      return quest ? { ...quest, pinnedAt: pin.pinned_at } : null;
    })
    .filter(Boolean);

  return (
    <div className="space-y-8">
      {/* Header with Browse CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold">Your Quest Journey</h2>
          <p className="text-sm text-muted-foreground">Track your adventures and progress</p>
        </div>
        <Button asChild size="sm">
          <Link to="/quests">
            <Search className="mr-2 h-4 w-4" />
            Browse Quests
          </Link>
        </Button>
      </div>

      {/* On mobile, keep the Quests surface compact: Active is primary, everything else lives inside a single dropdown. */}
      {!isMobile && pinnedQuestsWithData.length > 0 && (
        <MobileCollapsibleSection
          title="Saved for Later"
          icon={<Bookmark className="h-5 w-5 text-primary" />}
          count={pinnedQuestsWithData.length}
          defaultOpenMobile={false}
          defaultOpenDesktop={true}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {pinnedQuestsWithData.map((quest: any) => (
              <Card
                key={quest.id}
                className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate('/quests')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{quest.icon || '🎯'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{quest.title}</p>
                      <p className="text-sm text-muted-foreground">{quest.metadata?.date}</p>
                      {quest.theme && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {quest.theme}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        unpinMutation.mutate(quest.id);
                      }}
                      disabled={unpinMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </MobileCollapsibleSection>
      )}

      {/* Your Rewards */}
      {availableRewards.length > 0 && (
        <section>
          <h3 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
            <Gift className="h-5 w-5 text-sunset" />
            Your Rewards ({unclaimedRewards.length} available)
          </h3>
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
      
      {/* Continue Your Journey */}
      <ContinueYourJourney userId={userId} />
      
      {/* Active */}
      {todaySignups.length > 0 && (
        <section>
          <h3 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Active ({todaySignups.length})
          </h3>
          <div className="space-y-4">
            {todaySignups.map((signup) => (
              <ActiveQuestCard 
                key={signup.id}
                signup={signup}
                isLive
                onCancelClick={handleCancelClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Desktop: upcoming + past are separate sections. Mobile: they live under a single "Quests" dropdown. */}
      {!isMobile ? (
        <>
          <MobileCollapsibleSection
            title="Upcoming"
            icon={<Calendar className="h-5 w-5 text-primary" />}
            count={upcomingSignups.length}
            defaultOpenMobile={false}
            defaultOpenDesktop={true}
          >
            {upcomingSignups.length === 0 && todaySignups.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">You haven't joined any upcoming quests yet.</p>
                  <Button asChild size="sm">
                    <Link to="/quests">Find Your First Quest</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : upcomingSignups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming quests scheduled.</p>
            ) : (
              <div className="space-y-4">
                {upcomingSignups.map((signup) => (
                  <ActiveQuestCard key={signup.id} signup={signup} onCancelClick={handleCancelClick} />
                ))}
              </div>
            )}
          </MobileCollapsibleSection>

          {pastSignups.length > 0 && (
            <MobileCollapsibleSection
              title="Past Quests"
              icon={<History className="h-5 w-5 text-muted-foreground" />}
              count={pastSignups.length}
              variant="muted"
              defaultOpenMobile={false}
              defaultOpenDesktop={true}
            >
              <div className="space-y-3">
                {pastSignups.map((signup) => {
                  const isPast = signup.quest.start_datetime && new Date(signup.quest.start_datetime) < now;
                  const wasAttending = ['confirmed', 'completed'].includes(signup.status || '');
                  const canLeaveFeedback = isPast && wasAttending;
                  const hasFeedback = feedbackSubmitted.has(signup.quest_id);

                  return (
                    <Card key={signup.id} className="bg-muted/30">
                      <CardContent className="py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl opacity-60">{signup.quest.icon || '🎯'}</span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
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

                          <div className="flex items-center gap-2 ml-11 sm:ml-0">
                            <Badge variant={STATUS_BADGES[signup.status || 'pending'].variant}>
                              {STATUS_BADGES[signup.status || 'pending'].label}
                            </Badge>

                            {canLeaveFeedback &&
                              (hasFeedback ? (
                                <Button variant="ghost" size="sm" disabled className="text-muted-foreground text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Done
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" asChild className="text-xs">
                                  <Link to={`/feedback/${signup.quest.id}`}>
                                    <Star className="h-3 w-3 mr-1" />
                                    Feedback
                                  </Link>
                                </Button>
                              ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </MobileCollapsibleSection>
          )}
        </>
      ) : (
        <MobileCollapsibleSection
          title="Quests"
          icon={<Compass className="h-5 w-5 text-primary" />}
          count={pinnedQuestsWithData.length + upcomingSignups.length + pastSignups.length}
          defaultOpenMobile={false}
          defaultOpenDesktop={false}
        >
          <div className="space-y-6">
            {pinnedQuestsWithData.length > 0 && (
              <section>
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Bookmark className="h-4 w-4" />
                  Saved for Later ({pinnedQuestsWithData.length})
                </h4>
                <div className="grid gap-3">
                  {pinnedQuestsWithData.map((quest: any) => (
                    <Card
                      key={quest.id}
                      className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => navigate('/quests')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{quest.icon || '🎯'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{quest.title}</p>
                            <p className="text-sm text-muted-foreground">{quest.metadata?.date}</p>
                            {quest.theme && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {quest.theme}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              unpinMutation.mutate(quest.id);
                            }}
                            disabled={unpinMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Upcoming ({upcomingSignups.length})
              </h4>

              {upcomingSignups.length === 0 && todaySignups.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">You haven't joined any upcoming quests yet.</p>
                    <Button asChild size="sm">
                      <Link to="/quests">Find Your First Quest</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : upcomingSignups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming quests scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {upcomingSignups.map((signup) => (
                    <ActiveQuestCard key={signup.id} signup={signup} onCancelClick={handleCancelClick} />
                  ))}
                </div>
              )}
            </section>

            {pastSignups.length > 0 && (
              <section>
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <History className="h-4 w-4" />
                  Past ({pastSignups.length})
                </h4>
                <div className="space-y-3">
                  {pastSignups.map((signup) => {
                    const isPast = signup.quest.start_datetime && new Date(signup.quest.start_datetime) < now;
                    const wasAttending = ['confirmed', 'completed'].includes(signup.status || '');
                    const canLeaveFeedback = isPast && wasAttending;
                    const hasFeedback = feedbackSubmitted.has(signup.quest_id);

                    return (
                      <Card key={signup.id} className="bg-muted/30">
                        <CardContent className="py-4">
                          <div className="flex flex-col justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl opacity-60">{signup.quest.icon || '🎯'}</span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
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

                            <div className="flex items-center gap-2 ml-11">
                              <Badge variant={STATUS_BADGES[signup.status || 'pending'].variant}>
                                {STATUS_BADGES[signup.status || 'pending'].label}
                              </Badge>
                              {canLeaveFeedback &&
                                (hasFeedback ? (
                                  <Button variant="ghost" size="sm" disabled className="text-muted-foreground text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Done
                                  </Button>
                                ) : (
                                  <Button variant="outline" size="sm" asChild className="text-xs">
                                    <Link to={`/feedback/${signup.quest.id}`}>
                                      <Star className="h-3 w-3 mr-1" />
                                      Feedback
                                    </Link>
                                  </Button>
                                ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </MobileCollapsibleSection>
      )}
      
      {/* Cancel Modal */}
      <CancelModal
        open={cancelModal.open}
        onOpenChange={(open) => setCancelModal(prev => ({ ...prev, open }))}
        signupId={cancelModal.signupId}
        questTitle={cancelModal.questTitle}
        onCancelled={fetchSignups}
      />

      {/* Reward Claim Modal */}
      <RewardClaimModal
        isOpen={claimModal.open}
        onClose={() => setClaimModal({ open: false, reward: null })}
        reward={claimModal.reward}
        sponsorName={claimModal.reward?.sponsorName}
        questId={claimModal.reward?.questId}
        userId={userId}
        onClaimed={handleRewardClaimed}
      />
    </div>
  );
}
