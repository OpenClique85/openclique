/**
 * =============================================================================
 * CliquesTab - Unified clique management with sub-tabs
 * =============================================================================
 * 
 * Features:
 * - "My Cliques" sub-tab: Active clique hero cards
 * - "Find a Clique" sub-tab: LFC discovery (open cliques to join)
 * - "Form a Clique" CTA
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar, 
  MessageCircle, 
  ChevronRight, 
  Crown,
  Compass,
  Loader2,
  Sparkles,
  Plus,
  Search,
  UserPlus,
  MapPin,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { SuggestQuestModal } from '@/components/cliques/SuggestQuestModal';
import { toast } from 'sonner';

interface CliqueMember {
  user_id: string;
  display_name: string;
  role: 'leader' | 'member';
}

interface Clique {
  id: string;
  name: string;
  created_at: string;
  members: CliqueMember[];
  quest_count: number;
  next_quest?: {
    id: string;
    title: string;
    start_datetime: string | null;
    icon: string | null;
  } | null;
  last_message?: {
    message: string;
    sender_name: string;
    created_at: string;
  } | null;
}

interface OpenClique {
  id: string;
  name: string;
  description?: string;
  theme_tags?: string[];
  member_count: number;
  max_members: number;
  leader_name: string;
  quest_count: number;
}

interface CliquesTabProps {
  userId: string;
}

export function CliquesTab({ userId }: CliquesTabProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cliques, setCliques] = useState<Clique[]>([]);
  const [openCliques, setOpenCliques] = useState<OpenClique[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLFC, setIsLoadingLFC] = useState(false);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [suggestModal, setSuggestModal] = useState<{
    open: boolean;
    cliqueId: string;
    cliqueName: string;
  }>({ open: false, cliqueId: '', cliqueName: '' });

  // Sub-tab state
  const subTab = searchParams.get('subtab') || 'my-cliques';

  const handleSubTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'cliques');
    newParams.set('subtab', value);
    setSearchParams(newParams);
    
    if (value === 'find-clique' && openCliques.length === 0) {
      fetchOpenCliques();
    }
  };

  // Fetch user's cliques (both persistent and quest-based)
  useEffect(() => {
    const fetchCliques = async () => {
      setIsLoading(true);
      
      // 1. Fetch persistent cliques (from squads table)
      const { data: persistentMemberships } = await supabase
        .from('squad_members')
        .select('persistent_squad_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .not('persistent_squad_id', 'is', null);

      const persistentCliqueIds = persistentMemberships
        ?.map(m => m.persistent_squad_id)
        .filter((id): id is string => id !== null) || [];

      // 2. Fetch quest-based cliques (from quest_squads where user is a member)
      const { data: questMemberships } = await supabase
        .from('squad_members')
        .select('squad_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .not('squad_id', 'is', null);

      const questSquadIds = questMemberships
        ?.map(m => m.squad_id)
        .filter((id): id is string => id !== null) || [];

      // Fetch quest squads data
      let questBasedCliques: Clique[] = [];
      if (questSquadIds.length > 0) {
        const { data: questSquadsData } = await supabase
          .from('quest_squads')
          .select(`
            id, 
            squad_name, 
            status,
            instance_id,
            quest_instances(id, title, scheduled_date, start_datetime)
          `)
          .in('id', questSquadIds)
          .in('status', ['warming_up', 'ready_for_review', 'approved', 'active', 'completed']);

        if (questSquadsData) {
          questBasedCliques = await Promise.all(
            questSquadsData.map(async (squad: any) => {
              // Get members
              const { data: members } = await supabase
                .from('squad_members')
                .select('user_id, role, clique_role')
                .eq('squad_id', squad.id)
                .eq('status', 'active');

              const memberUserIds = members?.map(m => m.user_id) || [];
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, display_name')
                .in('id', memberUserIds);

              const membersWithNames: CliqueMember[] = (members || []).map(m => {
                const profile = profiles?.find(p => p.id === m.user_id);
                return {
                  user_id: m.user_id,
                  display_name: profile?.display_name || 'Unknown',
                  role: (m.role as 'leader' | 'member') || 'member'
                };
              });

              // Get last message
              const { data: lastMessageData } = await supabase
                .from('squad_chat_messages')
                .select('message, sender_id, created_at')
                .eq('squad_id', squad.id)
                .is('hidden_at', null)
                .order('created_at', { ascending: false })
                .limit(1);

              let lastMessage = null;
              if (lastMessageData && lastMessageData.length > 0) {
                const msg = lastMessageData[0];
                const senderProfile = profiles?.find(p => p.id === msg.sender_id);
                lastMessage = {
                  message: msg.message,
                  sender_name: senderProfile?.display_name || 'Unknown',
                  created_at: msg.created_at
                };
              }

              // Format the name with quest context
              const instance = squad.quest_instances as any;
              const questName = instance?.title || 'Quest';
              const displayName = squad.squad_name || `${questName} Clique`;

              return {
                id: squad.id,
                name: displayName,
                created_at: instance?.scheduled_date || new Date().toISOString(),
                members: membersWithNames,
                quest_count: 1,
                next_quest: instance ? {
                  id: instance.id,
                  title: questName,
                  start_datetime: instance.start_datetime || instance.scheduled_date,
                  icon: '🎯'
                } : null,
                last_message: lastMessage,
                // Extra metadata for quest cliques
                _isQuestClique: true,
                _status: squad.status,
              } as Clique & { _isQuestClique?: boolean; _status?: string };
            })
          );
        }
      }

      // 3. Fetch persistent cliques
      let persistentCliques: Clique[] = [];
      if (persistentCliqueIds.length > 0) {
        const { data: cliqueData } = await supabase
          .from('squads')
          .select('id, name, created_at')
          .in('id', persistentCliqueIds);

        if (cliqueData) {
          persistentCliques = await Promise.all(
            cliqueData.map(async (clique) => {
              const { data: members } = await supabase
                .from('squad_members')
                .select('user_id, role')
                .eq('persistent_squad_id', clique.id)
                .eq('status', 'active');

              const memberUserIds = members?.map(m => m.user_id) || [];
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, display_name')
                .in('id', memberUserIds);

              const membersWithNames: CliqueMember[] = (members || []).map(m => {
                const profile = profiles?.find(p => p.id === m.user_id);
                return {
                  user_id: m.user_id,
                  display_name: profile?.display_name || 'Unknown',
                  role: (m.role as 'leader' | 'member') || 'member'
                };
              });

              const { count: questCount } = await supabase
                .from('squad_quest_invites')
                .select('id', { count: 'exact', head: true })
                .eq('squad_id', clique.id)
                .eq('status', 'accepted');

              const { data: upcomingInvites } = await supabase
                .from('squad_quest_invites')
                .select(`
                  quest_instance_id,
                  quest_instances!inner(
                    id,
                    start_datetime,
                    quests(id, title, icon)
                  )
                `)
                .eq('squad_id', clique.id)
                .eq('status', 'accepted')
                .gte('quest_instances.start_datetime', new Date().toISOString())
                .order('quest_instances(start_datetime)', { ascending: true })
                .limit(1);

              let nextQuest = null;
              if (upcomingInvites && upcomingInvites.length > 0) {
                const invite = upcomingInvites[0] as any;
                if (invite.quest_instances?.quests) {
                  nextQuest = {
                    id: invite.quest_instances.quests.id,
                    title: invite.quest_instances.quests.title,
                    start_datetime: invite.quest_instances.start_datetime,
                    icon: invite.quest_instances.quests.icon
                  };
                }
              }

              const { data: lastMessageData } = await supabase
                .from('squad_chat_messages')
                .select('message, sender_id, created_at')
                .eq('squad_id', clique.id)
                .is('hidden_at', null)
                .order('created_at', { ascending: false })
                .limit(1);

              let lastMessage = null;
              if (lastMessageData && lastMessageData.length > 0) {
                const msg = lastMessageData[0];
                const senderProfile = profiles?.find(p => p.id === msg.sender_id);
                lastMessage = {
                  message: msg.message,
                  sender_name: senderProfile?.display_name || 'Unknown',
                  created_at: msg.created_at
                };
              }

              return {
                id: clique.id,
                name: clique.name,
                created_at: clique.created_at,
                members: membersWithNames,
                quest_count: questCount || 0,
                next_quest: nextQuest,
                last_message: lastMessage
              };
            })
          );
        }
      }

      // Combine and dedupe (prefer quest cliques if both exist)
      const allCliques = [...questBasedCliques, ...persistentCliques];
      const uniqueCliques = allCliques.filter((clique, index, self) => 
        index === self.findIndex(c => c.id === clique.id)
      );

      setCliques(uniqueCliques);
      setIsLoading(false);
    };

    fetchCliques();
  }, [userId]);

  // Fetch open cliques for LFC
  const fetchOpenCliques = async () => {
    setIsLoadingLFC(true);
    
    // Get cliques that are LFC-listed and have open slots
    type SquadRow = { id: string; name: string; theme_tags: string[] | null; max_members: number | null };
    
    // @ts-ignore - Deep type instantiation workaround for Supabase query chains
    const { data: rawData } = await supabase
      .from('squads')
      .select('id, name, theme_tags, max_members')
      .eq('is_persistent', true)
      .eq('lfc_listing_enabled', true)
      .is('archived_at', null);
    
    const openCliqueData = rawData as SquadRow[] | null;

    if (!openCliqueData || openCliqueData.length === 0) {
      setIsLoadingLFC(false);
      return;
    }

    // Get member counts and filter out full cliques
    const cliquesWithDetails: OpenClique[] = [];
    
    for (const clique of openCliqueData) {
      // Get member count
      const { count: memberCount } = await supabase
        .from('squad_members')
        .select('id', { count: 'exact', head: true })
        .eq('persistent_squad_id', clique.id)
        .eq('status', 'active');

      const currentCount = memberCount || 0;
      const maxMembers = clique.max_members || 6;

      // Skip if full
      if (currentCount >= maxMembers) continue;

      // Skip if user is already a member
      const { data: existingMembership } = await supabase
        .from('squad_members')
        .select('id')
        .eq('persistent_squad_id', clique.id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (existingMembership) continue;

      // Get leader name
      const { data: leaderData } = await supabase
        .from('squad_members')
        .select('user_id')
        .eq('persistent_squad_id', clique.id)
        .eq('role', 'leader')
        .maybeSingle();

      let leaderName = 'Unknown';
      if (leaderData) {
        const { data: leaderProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', leaderData.user_id)
          .maybeSingle();
        leaderName = leaderProfile?.display_name || 'Unknown';
      }

      // Get quest count
      const { count: questCount } = await supabase
        .from('squad_quest_invites')
        .select('id', { count: 'exact', head: true })
        .eq('squad_id', clique.id)
        .eq('status', 'accepted');

      cliquesWithDetails.push({
        id: clique.id,
        name: clique.name,
        theme_tags: clique.theme_tags || [],
        member_count: currentCount,
        max_members: maxMembers,
        leader_name: leaderName,
        quest_count: questCount || 0
      });
    }

    setOpenCliques(cliquesWithDetails);
    setIsLoadingLFC(false);
  };

  const handleApplyToClique = async (cliqueId: string) => {
    setApplyingTo(cliqueId);
    
    try {
      // Check if application already exists
      const { data: existing } = await supabase
        .from('clique_applications')
        .select('id, status')
        .eq('squad_id', cliqueId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'pending') {
          toast.info('You already have a pending application');
        } else if (existing.status === 'declined') {
          toast.error('Your previous application was declined');
        }
        setApplyingTo(null);
        return;
      }

      // Create application
      const { error } = await supabase
        .from('clique_applications')
        .insert({
          squad_id: cliqueId,
          user_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Application sent! The clique leader will review it.');
      
      // Remove from list
      setOpenCliques(prev => prev.filter(c => c.id !== cliqueId));
    } catch (error) {
      console.error('Failed to apply:', error);
      toast.error('Failed to send application');
    } finally {
      setApplyingTo(null);
    }
  };

  const handleSuggestQuest = (clique: Clique) => {
    setSuggestModal({
      open: true,
      cliqueId: clique.id,
      cliqueName: clique.name
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs for My Cliques / Find a Clique */}
      <Tabs value={subTab} onValueChange={handleSubTabChange}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="my-cliques" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Cliques
              {cliques.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {cliques.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="find-clique" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Find a Clique
            </TabsTrigger>
          </TabsList>
          
          <Button asChild size="sm">
            <Link to="/cliques/new">
              <Plus className="h-4 w-4 mr-2" />
              Form a Clique
            </Link>
          </Button>
        </div>

        {/* My Cliques Content */}
        <TabsContent value="my-cliques" className="mt-4 space-y-6">
          {/* Active Quest Cliques Section */}
          {(() => {
            const questCliques = cliques.filter((c: any) => c._isQuestClique);
            if (questCliques.length === 0) return null;
            
            return (
              <section>
                <h3 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Active Quest Cliques ({questCliques.length})
                </h3>
                <div className="space-y-4">
                  {questCliques.map((clique) => {
                    const leader = clique.members.find(m => m.role === 'leader');
                    const isCurrentUserLeader = leader?.user_id === userId;
                    const cliqueStatus = (clique as any)._status;

                    return (
                      <Card 
                        key={clique.id} 
                        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group border-primary/20"
                      >
                        <CardContent className="p-0">
                          {/* Header */}
                          <div className="p-4 pb-3 border-b bg-gradient-to-r from-primary/10 to-transparent">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-primary/20">
                                  <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-display font-semibold text-lg">
                                      {clique.name}
                                    </h3>
                                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                      🎯 Quest Clique
                                    </Badge>
                                    {isCurrentUserLeader && (
                                      <Badge variant="outline" className="text-xs border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                        <Crown className="h-3 w-3 mr-1" />
                                        Leader
                                      </Badge>
                                    )}
                                    {cliqueStatus && cliqueStatus === 'warming_up' && (
                                      <Badge variant="outline" className="text-xs border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300">
                                        Warming Up
                                      </Badge>
                                    )}
                                    {cliqueStatus && cliqueStatus === 'approved' && (
                                      <Badge variant="outline" className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                                        Ready
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {clique.members.length} members
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>

                          {/* Members */}
                          <div className="px-4 py-3 border-b">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {clique.members.slice(0, 5).map((member) => (
                                  <Avatar key={member.user_id} className="h-8 w-8 border-2 border-background">
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                      {member.display_name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {clique.members.length > 5 && (
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                                    +{clique.members.length - 5}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {clique.members.map(m => m.display_name).join(', ')}
                              </span>
                            </div>
                          </div>

                          {/* Quest Info */}
                          {clique.next_quest && (
                            <div className="px-4 py-3 border-b bg-muted/30">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="font-medium">Quest:</span>
                                <span className="text-muted-foreground">
                                  {clique.next_quest.icon} {clique.next_quest.title}
                                </span>
                                {clique.next_quest.start_datetime && (
                                  <Badge variant="secondary" className="ml-auto text-xs">
                                    {format(new Date(clique.next_quest.start_datetime), 'MMM d')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Last Message */}
                          {clique.last_message && (
                            <div className="px-4 py-3 border-b">
                              <div className="flex items-start gap-2 text-sm">
                                <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-muted-foreground truncate">
                                    <span className="font-medium text-foreground">{clique.last_message.sender_name}:</span>{' '}
                                    "{clique.last_message.message}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="p-4">
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/warmup/${clique.id}`);
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Open Clique Chat
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {/* Persistent Cliques Section */}
          {(() => {
            const persistentCliques = cliques.filter((c: any) => !c._isQuestClique);
            const questCliques = cliques.filter((c: any) => c._isQuestClique);
            
            if (persistentCliques.length === 0 && questCliques.length === 0) {
              return (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-display font-semibold mb-2">No Cliques Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Form your own clique with friends, or find an open clique to join.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button asChild>
                        <Link to="/cliques/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Form a Clique
                        </Link>
                      </Button>
                      <Button variant="outline" onClick={() => handleSubTabChange('find-clique')}>
                        <Search className="h-4 w-4 mr-2" />
                        Find a Clique
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            
            if (persistentCliques.length === 0) return null;
            
            return (
              <section>
                <h3 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  My Cliques ({persistentCliques.length})
                </h3>
                <div className="space-y-4">
                  {persistentCliques.map((clique) => {
                    const leader = clique.members.find(m => m.role === 'leader');
                    const isCurrentUserLeader = leader?.user_id === userId;

                    return (
                      <Card 
                        key={clique.id} 
                        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                      >
                        <CardContent className="p-0">
                          {/* Header */}
                          <div className="p-4 pb-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-primary/10">
                                  <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-display font-semibold text-lg">
                                      {clique.name}
                                    </h3>
                                    {isCurrentUserLeader && (
                                      <Badge variant="outline" className="text-xs border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                        <Crown className="h-3 w-3 mr-1" />
                                        Leader
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {clique.members.length} members • Formed {format(new Date(clique.created_at), 'MMM yyyy')}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>

                          {/* Members */}
                          <div className="px-4 py-3 border-b">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {clique.members.slice(0, 5).map((member) => (
                                  <Avatar key={member.user_id} className="h-8 w-8 border-2 border-background">
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                      {member.display_name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {clique.members.length > 5 && (
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                                    +{clique.members.length - 5}
                                  </div>
                                )}
                              </div>
                              {leader && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Crown className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                  {leader.display_name}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Next Quest */}
                          {clique.next_quest && (
                            <div className="px-4 py-3 border-b bg-muted/30">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="font-medium">Next:</span>
                                <span className="text-muted-foreground">
                                  {clique.next_quest.icon} {clique.next_quest.title}
                                </span>
                                {clique.next_quest.start_datetime && (
                                  <Badge variant="secondary" className="ml-auto text-xs">
                                    {format(new Date(clique.next_quest.start_datetime), 'MMM d')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Last Message */}
                          {clique.last_message && (
                            <div className="px-4 py-3 border-b">
                              <div className="flex items-start gap-2 text-sm">
                                <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-muted-foreground truncate">
                                    <span className="font-medium text-foreground">{clique.last_message.sender_name}:</span>{' '}
                                    "{clique.last_message.message}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="p-4 flex gap-2">
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/cliques/${clique.id}`);
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              View Clique
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSuggestQuest(clique);
                              }}
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Suggest Quest
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })()}
        </TabsContent>

        {/* Find a Clique (LFC) Content */}
        <TabsContent value="find-clique" className="mt-4">
          {isLoadingLFC ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : openCliques.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-display font-semibold mb-2">No Open Cliques</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  There are no cliques currently looking for members. 
                  Why not form your own and invite friends?
                </p>
                <Button asChild>
                  <Link to="/cliques/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Form a Clique
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                These cliques are looking for new members. Apply to join!
              </p>
              
              {openCliques.map((clique) => (
                <Card key={clique.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-full bg-primary/10 shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display font-semibold text-lg">
                            {clique.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Crown className="h-3 w-3 text-amber-500" />
                              {clique.leader_name}
                            </span>
                            <span>
                              {clique.member_count}/{clique.max_members} members
                            </span>
                            {clique.quest_count > 0 && (
                              <span>
                                {clique.quest_count} quests
                              </span>
                            )}
                          </div>
                          
                          {clique.theme_tags && clique.theme_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {clique.theme_tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        size="sm"
                        onClick={() => handleApplyToClique(clique.id)}
                        disabled={applyingTo === clique.id}
                      >
                        {applyingTo === clique.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Apply
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Suggest Quest Modal */}
      <SuggestQuestModal
        open={suggestModal.open}
        onOpenChange={(open) => setSuggestModal(prev => ({ ...prev, open }))}
        cliqueId={suggestModal.cliqueId}
        cliqueName={suggestModal.cliqueName}
        userId={userId}
      />
    </div>
  );
}