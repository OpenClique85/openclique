/**
 * =============================================================================
 * CliquesTab - Hero squad cards for the unified Profile page
 * =============================================================================
 * 
 * Features:
 * - Rich hero cards for each active squad
 * - Squad chat preview
 * - Suggest Quest functionality
 * - Navigate to squad detail page
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
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { SuggestQuestModal } from '@/components/squads/SuggestQuestModal';

interface SquadMember {
  user_id: string;
  display_name: string;
  role: 'leader' | 'member';
}

interface Squad {
  id: string;
  name: string;
  created_at: string;
  members: SquadMember[];
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
  const [squads, setSquads] = useState<Squad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestModal, setSuggestModal] = useState<{
    open: boolean;
    squadId: string;
    squadName: string;
  }>({ open: false, squadId: '', squadName: '' });

  useEffect(() => {
    const fetchSquads = async () => {
      setIsLoading(true);
      
      // Get all squad memberships for the current user
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

      const squadIds = memberships
        .map(m => m.persistent_squad_id)
        .filter((id): id is string => id !== null);

      if (squadIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // Fetch squad details
      const { data: squadData } = await supabase
        .from('squads')
        .select('id, name, created_at')
        .in('id', squadIds);

      if (!squadData) {
        setIsLoading(false);
        return;
      }

      // For each squad, fetch members, next quest, and last message
      const squadsWithDetails: Squad[] = await Promise.all(
        squadData.map(async (squad) => {
          // Get members with profiles
          const { data: members } = await supabase
            .from('squad_members')
            .select('user_id, role')
            .eq('persistent_squad_id', squad.id)
            .eq('status', 'active');

          const memberUserIds = members?.map(m => m.user_id) || [];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', memberUserIds);

          const membersWithNames: SquadMember[] = (members || []).map(m => {
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
            .eq('squad_id', squad.id)
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
            .eq('squad_id', squad.id)
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

          return {
            id: squad.id,
            name: squad.name,
            created_at: squad.created_at,
            members: membersWithNames,
            quest_count: questCount || 0,
            next_quest: nextQuest,
            last_message: lastMessage
          };
        })
      );

      setSquads(squadsWithDetails);
      setIsLoading(false);
    };

    fetchSquads();
  }, [userId]);

  const handleSuggestQuest = (squad: Squad) => {
    setSuggestModal({
      open: true,
      squadId: squad.id,
      squadName: squad.name
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (squads.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-display font-semibold mb-2">No Cliques Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Complete your first quest to be matched with a squad. Your clique will appear here with group chat, upcoming adventures, and more.
          </p>
          <Button asChild>
            <Link to="/quests">
              <Compass className="h-4 w-4 mr-2" />
              Find Your First Quest
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {squads.map((squad) => {
        const leader = squad.members.find(m => m.role === 'leader');
        const isCurrentUserLeader = leader?.user_id === userId;

        return (
          <Card 
            key={squad.id} 
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          >
            <CardContent className="p-0">
              {/* Header with squad name */}
              <div className="p-4 pb-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold text-lg">
                          {squad.name}
                        </h3>
                        {isCurrentUserLeader && (
                          <Badge variant="outline" className="text-xs">
                            <Crown className="h-3 w-3 mr-1 text-amber-500" />
                            Leader
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {squad.members.length} members • Formed {format(new Date(squad.created_at), 'MMM yyyy')}
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
                    {squad.members.slice(0, 5).map((member) => (
                      <Avatar key={member.user_id} className="h-8 w-8 border-2 border-background">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {member.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {squad.members.length > 5 && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                        +{squad.members.length - 5}
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
              {squad.next_quest && (
                <div className="px-4 py-3 border-b bg-muted/30">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">Next:</span>
                    <span className="text-muted-foreground">
                      {squad.next_quest.icon} {squad.next_quest.title}
                    </span>
                    {squad.next_quest.start_datetime && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {format(new Date(squad.next_quest.start_datetime), 'MMM d')}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Last Message */}
              {squad.last_message && (
                <div className="px-4 py-3 border-b">
                  <div className="flex items-start gap-2 text-sm">
                    <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground truncate">
                        <span className="font-medium text-foreground">{squad.last_message.sender_name}:</span>{' '}
                        "{squad.last_message.message}"
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
                    navigate(`/squads/${squad.id}`);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  View Squad
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSuggestQuest(squad);
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
        squadId={suggestModal.squadId}
        squadName={suggestModal.squadName}
        userId={userId}
      />
    </div>
  );
}
