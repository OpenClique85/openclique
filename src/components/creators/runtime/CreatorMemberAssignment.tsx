import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Loader2, Users, UserPlus, ArrowRight, Check,
  UserMinus
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreatorMemberAssignmentProps {
  questId: string;
}

export function CreatorMemberAssignment({ questId }: CreatorMemberAssignmentProps) {
  const queryClient = useQueryClient();
  const [selectedSignups, setSelectedSignups] = useState<string[]>([]);
  const [targetSquadId, setTargetSquadId] = useState<string>('');

  // Fetch unassigned signups
  const { data: unassignedSignups, isLoading: loadingSignups } = useQuery({
    queryKey: ['unassigned-signups', questId],
    queryFn: async () => {
      // Get all signups for this quest
      const { data: signups, error: signupsError } = await supabase
        .from('quest_signups')
        .select(`
          id,
          user_id,
          status,
          profiles:user_id (
            display_name,
            avatar_url,
            city
          )
        `)
        .eq('quest_id', questId)
        .eq('status', 'confirmed');
      
      if (signupsError) throw signupsError;

      // Get all assigned user IDs
      const { data: members, error: membersError } = await supabase
        .from('squad_members')
        .select('user_id, squad_id')
        .in('squad_id', (
          await supabase
            .from('quest_squads')
            .select('id')
            .eq('quest_id', questId)
        ).data?.map(s => s.id) || []);
      
      if (membersError) throw membersError;

      const assignedUserIds = new Set(members?.map(m => m.user_id) || []);
      
      // Filter out assigned users
      return (signups || []).filter(s => !assignedUserIds.has(s.user_id));
    },
  });

  // Fetch squads for this quest
  const { data: squads, isLoading: loadingSquads } = useQuery({
    queryKey: ['creator-quest-squads-assignment', questId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_squads')
        .select(`
          id,
          squad_name,
          status,
          squad_members (id)
        `)
        .eq('quest_id', questId)
        .in('status', ['draft', 'confirmed'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Assign members mutation
  const assignMembers = useMutation({
    mutationFn: async ({ signupIds, squadId }: { signupIds: string[]; squadId: string }) => {
      // Get user IDs from signup IDs
      const { data: signups, error: signupsError } = await supabase
        .from('quest_signups')
        .select('id, user_id')
        .in('id', signupIds);
      
      if (signupsError) throw signupsError;

      // Insert squad members
      const members = signups?.map(s => ({
        squad_id: squadId,
        user_id: s.user_id,
        signup_id: s.id,
        status: 'active',
      })) || [];

      const { error } = await supabase
        .from('squad_members')
        .insert(members);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unassigned-signups', questId] });
      queryClient.invalidateQueries({ queryKey: ['creator-quest-squads', questId] });
      queryClient.invalidateQueries({ queryKey: ['creator-quest-squads-assignment', questId] });
      toast.success(`${selectedSignups.length} member(s) assigned to squad`);
      setSelectedSignups([]);
      setTargetSquadId('');
    },
    onError: () => {
      toast.error('Failed to assign members');
    },
  });

  const toggleSignup = (signupId: string) => {
    setSelectedSignups(prev => 
      prev.includes(signupId)
        ? prev.filter(id => id !== signupId)
        : [...prev, signupId]
    );
  };

  const handleAssign = () => {
    if (!targetSquadId || selectedSignups.length === 0) return;
    assignMembers.mutate({ signupIds: selectedSignups, squadId: targetSquadId });
  };

  if (loadingSignups || loadingSquads) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const draftSquads = squads?.filter(s => s.status === 'draft') || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Assign Members to Squads
        </CardTitle>
        <CardDescription>
          Select confirmed signups and assign them to a squad
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unassigned members */}
        {!unassignedSignups || unassignedSignups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>All confirmed signups are assigned to squads</p>
          </div>
        ) : (
          <>
            <div>
              <h4 className="text-sm font-medium mb-3">
                Unassigned Signups ({unassignedSignups.length})
              </h4>
              <ScrollArea className="h-[200px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {unassignedSignups.map((signup: any) => {
                    const isSelected = selectedSignups.includes(signup.id);
                    return (
                      <button
                        key={signup.id}
                        onClick={() => toggleSignup(signup.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 border-primary border' 
                            : 'hover:bg-muted/50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={signup.profiles?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {signup.profiles?.display_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <p className="text-sm font-medium">
                              {signup.profiles?.display_name || 'Unknown'}
                            </p>
                            {signup.profiles?.city && (
                              <p className="text-xs text-muted-foreground">
                                {signup.profiles.city}
                              </p>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Assignment controls */}
            {selectedSignups.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Badge variant="secondary" className="shrink-0">
                  {selectedSignups.length} selected
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={targetSquadId} onValueChange={setTargetSquadId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select squad" />
                  </SelectTrigger>
                  <SelectContent>
                    {draftSquads.map((squad) => (
                      <SelectItem key={squad.id} value={squad.id}>
                        {squad.squad_name} ({squad.squad_members?.length || 0} members)
                      </SelectItem>
                    ))}
                    {draftSquads.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No draft squads available
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssign}
                  disabled={!targetSquadId || assignMembers.isPending}
                  className="shrink-0 gap-2"
                >
                  {assignMembers.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Assign
                </Button>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSignups(unassignedSignups.map((s: any) => s.id))}
              >
                Select All
              </Button>
              {selectedSignups.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSignups([])}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
