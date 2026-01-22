import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Users, 
  Crown, 
  Plus, 
  RefreshCw,
  Sparkles,
  Calendar
} from 'lucide-react';

interface SquadMember {
  id: string;
  user_id: string;
  display_name: string;
  role: 'leader' | 'member';
}

interface PersistentSquad {
  id: string;
  name: string;
  created_at: string;
  origin_quest_title?: string;
  members: SquadMember[];
  quest_count: number;
}

interface QuestSquadWithReenlist {
  quest_id: string;
  quest_title: string;
  quest_squads: {
    id: string;
    squad_name: string;
    members: {
      user_id: string;
      display_name: string;
      wants_reenlist: boolean | null;
    }[];
    reenlist_count: number;
  }[];
}

export function PersistentSquadsManager() {
  const { toast } = useToast();
  const [squads, setSquads] = useState<PersistentSquad[]>([]);
  const [promotableQuests, setPromotableQuests] = useState<QuestSquadWithReenlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteDialog, setPromoteDialog] = useState<{
    open: boolean;
    questSquadId: string;
    squadName: string;
    members: { user_id: string; display_name: string }[];
  }>({ open: false, questSquadId: '', squadName: '', members: [] });
  const [newSquadName, setNewSquadName] = useState('');
  const [selectedLeader, setSelectedLeader] = useState('');

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch persistent squads
    const { data: squadData } = await supabase
      .from('squads')
      .select('id, name, created_at, origin_quest_id')
      .order('created_at', { ascending: false });

    if (squadData) {
      const squadsWithDetails = await Promise.all(
        squadData.map(async (squad) => {
          // Get origin quest title
          let originQuestTitle: string | undefined;
          if (squad.origin_quest_id) {
            const { data: quest } = await supabase
              .from('quests')
              .select('title')
              .eq('id', squad.origin_quest_id)
              .maybeSingle();
            originQuestTitle = quest?.title;
          }

          // Get members
          const { data: members } = await supabase
            .from('squad_members')
            .select('id, user_id, role')
            .eq('persistent_squad_id', squad.id)
            .eq('status', 'active');

          const memberUserIds = members?.map(m => m.user_id) || [];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', memberUserIds.length > 0 ? memberUserIds : ['none']);

          const membersWithNames: SquadMember[] = (members || []).map(m => ({
            id: m.id,
            user_id: m.user_id,
            display_name: profiles?.find(p => p.id === m.user_id)?.display_name || 'Unknown',
            role: (m.role as 'leader' | 'member') || 'member'
          }));

          // Count quests
          const { count } = await supabase
            .from('squad_quest_invites')
            .select('id', { count: 'exact', head: true })
            .eq('squad_id', squad.id)
            .eq('status', 'accepted');

          return {
            id: squad.id,
            name: squad.name,
            created_at: squad.created_at,
            origin_quest_title: originQuestTitle,
            members: membersWithNames,
            quest_count: count || 0
          };
        })
      );
      setSquads(squadsWithDetails);
    }

    // Fetch completed quests with re-enlist data
    const { data: completedQuests } = await supabase
      .from('quests')
      .select('id, title')
      .eq('status', 'completed')
      .order('end_datetime', { ascending: false })
      .limit(10);

    if (completedQuests) {
      const questsWithReenlist = await Promise.all(
        completedQuests.map(async (quest) => {
          // Get quest_squads for this quest
          const { data: questSquads } = await supabase
            .from('quest_squads')
            .select('id, squad_name')
            .eq('quest_id', quest.id)
            .eq('status', 'confirmed');

          if (!questSquads || questSquads.length === 0) {
            return null;
          }

          const squadsWithMembers = await Promise.all(
            questSquads.map(async (qs) => {
              // Get squad members
              const { data: members } = await supabase
                .from('squad_members')
                .select('user_id, signup_id')
                .eq('squad_id', qs.id);

              if (!members || members.length === 0) {
                return null;
              }

              // Get profiles and re-enlist status
              const userIds = members.map(m => m.user_id);
              const signupIds = members.map(m => m.signup_id).filter(Boolean);

              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, display_name')
                .in('id', userIds);

              const { data: signups } = await supabase
                .from('quest_signups')
                .select('id, user_id, wants_reenlist')
                .in('id', signupIds.length > 0 ? signupIds : ['none']);

              const membersWithReenlist = members.map(m => {
                const profile = profiles?.find(p => p.id === m.user_id);
                const signup = signups?.find(s => s.user_id === m.user_id);
                return {
                  user_id: m.user_id,
                  display_name: profile?.display_name || 'Unknown',
                  wants_reenlist: signup?.wants_reenlist ?? null
                };
              });

              const reenlistCount = membersWithReenlist.filter(m => m.wants_reenlist === true).length;

              return {
                id: qs.id,
                squad_name: qs.squad_name,
                members: membersWithReenlist,
                reenlist_count: reenlistCount
              };
            })
          );

          const validSquads = squadsWithMembers.filter(Boolean) as {
            id: string;
            squad_name: string;
            members: { user_id: string; display_name: string; wants_reenlist: boolean | null }[];
            reenlist_count: number;
          }[];

          // Only show quests where at least one squad has 3+ re-enlist votes
          const hasPromotableSquad = validSquads.some(s => s.reenlist_count >= 3);
          if (!hasPromotableSquad) return null;

          return {
            quest_id: quest.id,
            quest_title: quest.title,
            quest_squads: validSquads.filter(s => s.reenlist_count >= 3)
          };
        })
      );

      setPromotableQuests(questsWithReenlist.filter(Boolean) as QuestSquadWithReenlist[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePromoteSquad = async () => {
    if (!promoteDialog.questSquadId || !newSquadName.trim()) return;

    setIsPromoting(true);

    // Create persistent squad
    const { data: newSquad, error: squadError } = await supabase
      .from('squads')
      .insert({
        name: newSquadName.trim(),
        origin_quest_id: null // We don't have easy access here, could enhance
      })
      .select()
      .single();

    if (squadError || !newSquad) {
      toast({ variant: 'destructive', title: 'Failed to create squad' });
      setIsPromoting(false);
      return;
    }

    // Add members to persistent squad
    const memberInserts = promoteDialog.members.map((m, index) => ({
      persistent_squad_id: newSquad.id,
      user_id: m.user_id,
      role: selectedLeader === m.user_id ? 'leader' : 'member',
      status: 'active',
      squad_id: promoteDialog.questSquadId // Keep reference to original
    }));

    // If no leader selected, pick alphabetically first
    if (!selectedLeader) {
      const sortedMembers = [...promoteDialog.members].sort((a, b) => 
        a.display_name.localeCompare(b.display_name)
      );
      memberInserts.forEach(m => {
        m.role = m.user_id === sortedMembers[0].user_id ? 'leader' : 'member';
      });
    }

    const { error: membersError } = await supabase
      .from('squad_members')
      .insert(memberInserts);

    if (membersError) {
      toast({ variant: 'destructive', title: 'Failed to add members' });
      setIsPromoting(false);
      return;
    }

    toast({
      title: 'Squad promoted!',
      description: `${newSquadName} is now a persistent squad.`
    });

    setPromoteDialog({ open: false, questSquadId: '', squadName: '', members: [] });
    setNewSquadName('');
    setSelectedLeader('');
    setIsPromoting(false);
    fetchData();
  };

  const openPromoteDialog = (
    questSquadId: string, 
    squadName: string, 
    members: { user_id: string; display_name: string }[]
  ) => {
    setPromoteDialog({ open: true, questSquadId, squadName, members });
    setNewSquadName(squadName);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Promotable Squads Section */}
      {promotableQuests.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ready to Promote
            </CardTitle>
            <CardDescription>
              These squads have 3+ members who want to re-enlist together.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {promotableQuests.map((quest) => (
                <div key={quest.quest_id}>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    From: {quest.quest_title}
                  </h4>
                  <div className="space-y-3">
                    {quest.quest_squads.map((squad) => (
                      <div 
                        key={squad.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-background border"
                      >
                        <div>
                          <p className="font-medium">{squad.squad_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {squad.reenlist_count}/{squad.members.length} want to re-enlist
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => openPromoteDialog(
                            squad.id, 
                            squad.squad_name,
                            squad.members.filter(m => m.wants_reenlist === true)
                          )}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Promote
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Persistent Squads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Persistent Squads ({squads.length})
            </CardTitle>
            <CardDescription>
              Squads that persist across multiple quests.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {squads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No persistent squads yet. Promote squads from completed quests above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Squad</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Quests</TableHead>
                  <TableHead>Formed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {squads.map((squad) => {
                  const leader = squad.members.find(m => m.role === 'leader');
                  return (
                    <TableRow key={squad.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{squad.name}</p>
                          {squad.origin_quest_title && (
                            <p className="text-xs text-muted-foreground">
                              From: {squad.origin_quest_title}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {squad.members.length} members
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {leader ? (
                          <span className="flex items-center gap-1">
                            <Crown className="h-3 w-3 text-amber-500" />
                            {leader.display_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>{squad.quest_count}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(squad.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Promote Dialog */}
      <Dialog open={promoteDialog.open} onOpenChange={(open) => !open && setPromoteDialog({ open: false, questSquadId: '', squadName: '', members: [] })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote to Persistent Squad</DialogTitle>
            <DialogDescription>
              Create a persistent squad from these {promoteDialog.members.length} members who want to re-enlist.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Squad Name</Label>
              <Input 
                value={newSquadName} 
                onChange={(e) => setNewSquadName(e.target.value)}
                placeholder="Enter squad name"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Leader</Label>
              <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                <SelectTrigger>
                  <SelectValue placeholder="Alphabetical first (default)" />
                </SelectTrigger>
                <SelectContent>
                  {promoteDialog.members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                If not selected, the alphabetically first member becomes leader.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Members ({promoteDialog.members.length})</Label>
              <div className="flex flex-wrap gap-2">
                {promoteDialog.members.map((m) => (
                  <Badge key={m.user_id} variant="outline">
                    {m.display_name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteDialog({ open: false, questSquadId: '', squadName: '', members: [] })}>
              Cancel
            </Button>
            <Button onClick={handlePromoteSquad} disabled={isPromoting || !newSquadName.trim()}>
              {isPromoting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Persistent Squad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
