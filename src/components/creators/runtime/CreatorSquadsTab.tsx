import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Plus, Users, Lock, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SQUAD_STATUS_LABELS, SQUAD_STATUS_STYLES, type SquadStatus } from '@/lib/squadLifecycle';

interface CreatorSquadsTabProps {
  questId: string;
}

export function CreatorSquadsTab({ questId }: CreatorSquadsTabProps) {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');

  // Fetch squads with members
  const { data: squads, isLoading } = useQuery({
    queryKey: ['creator-quest-squads', questId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_squads')
        .select(`
          *,
          squad_members (
            id,
            user_id,
            role,
            status,
            profiles:user_id (
              display_name,
              avatar_url
            )
          )
        `)
        .eq('quest_id', questId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Create squad mutation
  const createSquad = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('quest_squads')
        .insert({
          quest_id: questId,
          squad_name: name,
          status: 'draft',
          formation_reason: 'creator_manual',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-quest-squads', questId] });
      queryClient.invalidateQueries({ queryKey: ['quest-squad-count', questId] });
      toast.success('Squad created!');
      setCreateDialogOpen(false);
      setNewSquadName('');
    },
    onError: () => {
      toast.error('Failed to create squad');
    },
  });

  // Update squad status
  const updateSquadStatus = useMutation({
    mutationFn: async ({ squadId, status }: { squadId: string; status: SquadStatus }) => {
      const updates: Record<string, any> = { status };
      
      // Set locked_at when locking
      if (status === 'confirmed') {
        updates.locked_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('quest_squads')
        .update(updates)
        .eq('id', squadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-quest-squads', questId] });
      toast.success('Squad status updated');
    },
    onError: () => {
      toast.error('Failed to update squad');
    },
  });

  const getStatusBadge = (status: string) => {
    const statusKey = status as SquadStatus;
    const styles = SQUAD_STATUS_STYLES[statusKey] || SQUAD_STATUS_STYLES.draft;
    const label = SQUAD_STATUS_LABELS[statusKey] || status;
    
    return (
      <Badge className={`${styles.bg} ${styles.text} ${styles.border} border`}>
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Squads
              </CardTitle>
              <CardDescription>
                Organize participants into groups
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Squad
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Squad</DialogTitle>
                  <DialogDescription>
                    Give your squad a name. You can add members later.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="squad-name">Squad Name</Label>
                  <Input
                    id="squad-name"
                    value={newSquadName}
                    onChange={(e) => setNewSquadName(e.target.value)}
                    placeholder="e.g., Team Alpha"
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => createSquad.mutate(newSquadName)}
                    disabled={!newSquadName.trim() || createSquad.isPending}
                  >
                    {createSquad.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Squad
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {squads?.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No squads yet</p>
              <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                Create Your First Squad
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {squads?.map((squad) => {
                const members = (squad.squad_members || []) as any[];
                const activeMembers = members.filter(m => m.status !== 'dropped');
                
                return (
                  <Card key={squad.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{squad.squad_name}</CardTitle>
                        {getStatusBadge(squad.status)}
                      </div>
                      <CardDescription>
                        {activeMembers.length} members
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Members preview */}
                      <div className="flex -space-x-2">
                        {activeMembers.slice(0, 5).map((member: any) => (
                          <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={member.profiles?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {member.profiles?.display_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {activeMembers.length > 5 && (
                          <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                            +{activeMembers.length - 5}
                          </div>
                        )}
                        {activeMembers.length === 0 && (
                          <span className="text-sm text-muted-foreground">No members yet</span>
                        )}
                      </div>

                      {/* Actions based on status */}
                      <div className="flex gap-2">
                        {squad.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSquadStatus.mutate({ squadId: squad.id, status: 'confirmed' })}
                            disabled={updateSquadStatus.isPending || activeMembers.length === 0}
                            className="gap-1"
                          >
                            <Lock className="h-3 w-3" />
                            Lock Squad
                          </Button>
                        )}
                        {squad.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSquadStatus.mutate({ squadId: squad.id, status: 'active' })}
                            disabled={updateSquadStatus.isPending}
                            className="gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Activate
                          </Button>
                        )}
                        {squad.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSquadStatus.mutate({ squadId: squad.id, status: 'completed' })}
                            disabled={updateSquadStatus.isPending}
                            className="gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
