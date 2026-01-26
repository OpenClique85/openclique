/**
 * =============================================================================
 * CliquesTab - Hero clique cards for the unified Profile page
 * =============================================================================
 * 
 * Features:
 * - "Form a Clique" CTA at the top
 * - Rich hero cards for each active clique
 * - Clique chat preview
 * - Suggest Quest functionality
 * - Navigate to clique detail page
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Calendar, 
  MessageCircle, 
  ChevronRight, 
  Crown,
  Compass,
  Loader2,
  Sparkles,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { SuggestQuestModal } from '@/components/cliques/SuggestQuestModal';

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

interface CliquesTabProps {
  userId: string;
}

export function CliquesTab({ userId }: CliquesTabProps) {
  const navigate = useNavigate();
  const [cliques, setCliques] = useState<Clique[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestModal, setSuggestModal] = useState<{
    open: boolean;
    cliqueId: string;
    cliqueName: string;
  }>({ open: false, cliqueId: '', cliqueName: '' });

  useEffect(() => {
    const fetchCliques = async () => {
      setIsLoading(true);
      
      // Get all clique memberships for the current user
      const { data: memberships } = await supabase
        .from('squad_members')
        .select('persistent_squad_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .not('persistent_squad_id', 'is', null);

      if (!memberships || memberships.length === 0) {
        setIsLoading(false);
        return;
      }

      const cliqueIds = memberships
        .map(m => m.persistent_squad_id)
        .filter((id): id is string => id !== null);

      if (cliqueIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // Fetch clique details
      const { data: cliqueData } = await supabase
        .from('squads')
        .select('id, name, created_at')
        .in('id', cliqueIds);

      if (!cliqueData) {
        setIsLoading(false);
        return;
      }

      // For each clique, fetch members, next quest, and last message
      const cliquesWithDetails: Clique[] = await Promise.all(
        cliqueData.map(async (clique) => {
          // Get members with profiles
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

          // Count quests
          const { count: questCount } = await supabase
            .from('squad_quest_invites')
            .select('id', { count: 'exact', head: true })
            .eq('squad_id', clique.id)
            .eq('status', 'accepted');

          // Get next upcoming quest
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

          // Get last chat message
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

      setCliques(cliquesWithDetails);
      setIsLoading(false);
    };

    fetchCliques();
  }, [userId]);

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

  if (cliques.length === 0) {
    return (
      <div className="space-y-6">
        {/* Form a Clique CTA */}
        <div className="flex justify-end">
          <Button asChild>
            <Link to="/cliques/new">
              <Plus className="h-4 w-4 mr-2" />
              Form a Clique
            </Link>
          </Button>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-display font-semibold mb-2">No Cliques Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Form your own clique or complete a quest to be matched with one. 
              Your cliques will appear here with group chat, upcoming adventures, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to="/cliques/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Form a Clique
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/quests">
                  <Compass className="h-4 w-4 mr-2" />
                  Find a Quest
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Form a Clique CTA */}
      <div className="flex justify-end mb-2">
        <Button asChild>
          <Link to="/cliques/new">
            <Plus className="h-4 w-4 mr-2" />
            Form a Clique
          </Link>
        </Button>
      </div>
      {cliques.map((clique) => {
        const leader = clique.members.find(m => m.role === 'leader');
        const isCurrentUserLeader = leader?.user_id === userId;

        return (
          <Card 
            key={clique.id} 
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          >
            <CardContent className="p-0">
              {/* Header with clique name */}
              <div className="p-4 pb-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold text-lg">
                          {clique.name}
                        </h3>
                        {isCurrentUserLeader && (
                          <Badge variant="outline" className="text-xs">
                            <Crown className="h-3 w-3 mr-1 text-amber-500" />
                            Clique Leader
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
                  <span className="text-sm text-muted-foreground">
                    {leader && (
                      <span className="flex items-center gap-1">
                        <Crown className="h-3 w-3 text-amber-500" />
                        {leader.display_name}
                      </span>
                    )}
                  </span>
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
