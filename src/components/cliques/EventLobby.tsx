/**
 * EventLobby - Quest event lobby for clique formation and discovery
 * 
 * Features:
 * - Form a Clique CTA
 * - Browse existing LFC cliques for this event
 * - Apply to join open cliques
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Search, 
  MessageSquare, 
  Crown, 
  Loader2,
  Sparkles,
  UserPlus
} from 'lucide-react';

interface EventLobbyProps {
  questId: string;
  questTitle: string;
  instanceId?: string;
}

interface LFCClique {
  id: string;
  name: string;
  lfc_bio: string | null;
  lfc_looking_for: string[] | null;
  member_count: number;
  max_size: number;
  leader_name: string;
  leader_avatar: string | null;
  theme_tags: string[] | null;
}

export function EventLobby({ questId, questTitle, instanceId }: EventLobbyProps) {
  const { user } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedClique, setSelectedClique] = useState<LFCClique | null>(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch LFC cliques for this quest/instance
  const { data: lfcCliques, isLoading } = useQuery({
    queryKey: ['lfc-cliques', questId, instanceId],
    queryFn: async () => {
      // Query squads with LFC enabled for this quest
      const { data, error } = await supabase
        .from('squads')
        .select('id, name, lfc_bio, lfc_looking_for, max_members, theme_tags')
        .eq('lfc_listing_enabled', true)
        .limit(20);
      
      if (error) {
        console.error('Error fetching LFC cliques:', error);
        return [];
      }

      // Fetch members for each squad
      const squadIds = (data || []).map(s => s.id);
      const { data: membersData } = squadIds.length > 0
        ? await supabase
            .from('squad_members')
            .select('squad_id, user_id, role')
            .in('squad_id', squadIds)
        : { data: [] };

      // Get profile info for leaders
      const leaderIds = (membersData || []).filter(m => m.role === 'leader').map(m => m.user_id);
      const { data: profiles } = leaderIds.length > 0
        ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', leaderIds)
        : { data: [] };
      
      const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

      // Transform data
      return (data || []).map((squad) => {
        const squadMembers = (membersData || []).filter(m => m.squad_id === squad.id);
        const leader = squadMembers.find(m => m.role === 'leader');
        const leaderProfile = leader ? profilesMap.get(leader.user_id) : null;
        
        return {
          id: squad.id,
          name: squad.name,
          lfc_bio: squad.lfc_bio,
          lfc_looking_for: squad.lfc_looking_for as string[] | null,
          member_count: squadMembers.length,
          max_size: squad.max_members || 6,
          leader_name: leaderProfile?.display_name || 'Unknown',
          leader_avatar: leaderProfile?.avatar_url || null,
          theme_tags: squad.theme_tags as string[] | null,
        } as LFCClique;
      });
    },
  });

  const handleApply = async () => {
    if (!user || !selectedClique) return;
    
    setIsApplying(true);
    try {
      const { error } = await supabase
        .from('clique_applications')
        .insert({
          squad_id: selectedClique.id,
          user_id: user.id,
          intro_message: applicationMessage.trim() || null,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already applied to this clique');
        } else {
          throw error;
        }
      } else {
        toast.success('Application submitted! The clique leader will review it.');
        setShowApplyModal(false);
        setApplicationMessage('');
        setSelectedClique(null);
      }
    } catch (error) {
      console.error('Error applying to clique:', error);
      toast.error('Failed to submit application');
    } finally {
      setIsApplying(false);
    }
  };

  const filteredCliques = lfcCliques?.filter(clique => 
    !searchQuery || 
    clique.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clique.lfc_bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Event Lobby
          </h2>
          <p className="text-sm text-muted-foreground">
            Find or form a clique for {questTitle}
          </p>
        </div>
        
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Form a Clique
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cliques by name or vibe..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* LFC Cliques Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredCliques?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">No cliques looking for members yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to form a clique for this event!
            </p>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Start a Clique
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCliques?.map((clique) => (
            <Card key={clique.id} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={clique.leader_avatar || undefined} />
                      <AvatarFallback>
                        {clique.leader_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{clique.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Crown className="h-3 w-3 text-amber-500" />
                        {clique.leader_name}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {clique.member_count}/{clique.max_size}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {clique.lfc_bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {clique.lfc_bio}
                  </p>
                )}
                
                {clique.lfc_looking_for && clique.lfc_looking_for.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {clique.lfc_looking_for.slice(0, 3).map((trait, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                    {clique.lfc_looking_for.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{clique.lfc_looking_for.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => {
                      setSelectedClique(clique);
                      setShowApplyModal(true);
                    }}
                    disabled={clique.member_count >= clique.max_size}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {clique.member_count >= clique.max_size ? 'Full' : 'Apply to Join'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Apply Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {selectedClique?.name}</DialogTitle>
            <DialogDescription>
              Introduce yourself to the clique. The leader will review your application.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Why do you want to join?</label>
              <Textarea
                placeholder="Share a bit about yourself and why this clique seems like a good fit..."
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Optional, but helps your application!</p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={isApplying}>
                {isApplying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                Submit Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
