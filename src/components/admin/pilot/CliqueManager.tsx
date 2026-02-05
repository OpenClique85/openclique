/**
 * Clique Manager
 * 
 * Create cliques, assign users, and manage clique composition.
 * Includes broadcast messaging, drag-and-drop manual clique formation,
 * clique locking, warm-up initiation, and member swap functionality.
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Wand2, Lock, 
  Loader2, AlertCircle,
  Megaphone, ArrowLeftRight, Unlock, Plus, User, Play, ThermometerSun,
  CheckCircle2
} from 'lucide-react';
import { auditLog } from '@/lib/auditLog';
import { InstanceBroadcastModal } from './InstanceBroadcastModal';
import { CliqueBuilder } from './CliqueBuilder';
import { CliqueSwapModal } from './CliqueSwapModal';
import { CompleteCliqueDialog } from './CompleteCliqueDialog';
import { SQUAD_STATUS_LABELS, SQUAD_STATUS_STYLES, SquadStatus } from '@/lib/squadLifecycle';

interface CliqueWithMembers {
  id: string;
  name: string;
  locked_at: string | null;
  status: SquadStatus;
  members: {
    id: string;
    user_id: string;
    display_name: string;
    status: string;
    checked_in_at: string | null;
  }[];
}

interface CliqueManagerProps {
  instanceId: string;
  instanceTitle?: string;
  targetCliqueSize: number;
}

export function CliqueManager({ instanceId, instanceTitle = 'Quest', targetCliqueSize }: CliqueManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [isLockingAll, setIsLockingAll] = useState(false);
  const [startingWarmUpId, setStartingWarmUpId] = useState<string | null>(null);
  const [completingClique, setCompletingClique] = useState<{ id: string; name: string; memberCount: number } | null>(null);

  // Fetch cliques with members (using instance_id)
  const { data: cliques, isLoading } = useQuery({
    queryKey: ['instance-cliques-detail', instanceId],
    queryFn: async () => {
      // Get cliques by instance_id
      const { data: cliqueData, error: cliqueError } = await supabase
        .from('quest_squads')
        .select('id, squad_name, locked_at, status')
        .eq('instance_id', instanceId)
        .order('squad_name');
      
      if (cliqueError) throw cliqueError;
      
      // Then get members for each clique
      const cliquesWithMembers: CliqueWithMembers[] = await Promise.all(
        (cliqueData || []).map(async (clique) => {
          const { data: members } = await supabase
            .from('squad_members')
            .select(`
              id, user_id,
              profiles(display_name)
            `)
            .eq('squad_id', clique.id);
          
          return {
            id: clique.id,
            name: clique.squad_name || `Clique ${clique.id.slice(0, 4)}`,
            locked_at: clique.locked_at,
            status: (clique.status || 'confirmed') as SquadStatus,
            members: (members || []).map((m: any) => ({
              id: m.id,
              user_id: m.user_id,
              display_name: m.profiles?.display_name || 'Unknown',
              status: 'confirmed',
              checked_in_at: null,
            }))
          };
        })
      );
      
      return cliquesWithMembers;
    },
  });

  // Fetch unassigned participants
  const { data: unassigned } = useQuery({
    queryKey: ['instance-unassigned', instanceId],
    queryFn: async () => {
      const [{ data: signups, error: signupsError }, { data: cliqueRows, error: cliquesError }] = await Promise.all([
        supabase
          .from('quest_signups')
          .select(`id, user_id, status, profiles(display_name)`)
          .eq('instance_id', instanceId)
          .in('status', ['pending', 'confirmed']),
        supabase
          .from('quest_squads')
          .select('id')
          .eq('instance_id', instanceId),
      ]);

      if (signupsError) throw signupsError;
      if (cliquesError) throw cliquesError;

      const cliqueIds = (cliqueRows || []).map((s) => s.id);

      let assignedUserIds = new Set<string>();
      if (cliqueIds.length > 0) {
        const { data: memberRows, error: membersError } = await supabase
          .from('squad_members')
          .select('user_id')
          .in('squad_id', cliqueIds);
        if (membersError) throw membersError;
        assignedUserIds = new Set((memberRows || []).map((m) => m.user_id));
      }

      return (signups || []).filter((s: any) => !assignedUserIds.has(s.user_id));
    },
  });
  // Generate cliques (auto)
  const handleGenerateCliques = async () => {
    setIsGenerating(true);
    try {
      // First, get the quest_id from the instance
      const { data: instanceData, error: instanceError } = await supabase
        .from('quest_instances')
        .select('quest_id')
        .eq('id', instanceId)
        .single();

      if (instanceError) throw new Error('Could not find quest instance');
      const questId = instanceData.quest_id;

      const { data, error } = await supabase.functions.invoke('recommend-squads', {
        body: { quest_id: instanceId, squad_size: targetCliqueSize }
      });
      
      if (error) throw error;
      
      let cliqueNumber = (cliques?.length || 0) + 1;
      
      for (const suggestion of data.squads || []) {
        const cliqueName = `${instanceTitle} Clique ${cliqueNumber++}`;
        
        const { data: newClique, error: createError } = await supabase
          .from('quest_squads')
          .insert({
            quest_id: questId,
            instance_id: instanceId,
            squad_name: cliqueName,
            formation_reason: suggestion.formation_reason,
            compatibility_score: suggestion.compatibility_score,
            referral_bonds: suggestion.referral_bonds,
          } as any)
          .select()
          .single();
        
        if (createError) {
          console.error('Failed to create clique:', createError);
          continue;
        }
        
        for (const member of suggestion.members) {
          await supabase
            .from('squad_members')
            .upsert({
              squad_id: newClique.id,
              user_id: member.user_id,
            }, { onConflict: 'squad_id,user_id' });
          
          await supabase
            .from('quest_signups')
            .update({ notes_private: `Assigned to: ${cliqueName}` })
            .eq('id', member.signup_id);
        }
        
        await auditLog({
          action: 'clique_formed',
          targetTable: 'quest_squads',
          targetId: newClique.id,
          newValues: {
            squad_name: cliqueName,
            member_count: suggestion.members.length,
            compatibility_score: suggestion.compatibility_score,
            referral_bonds: suggestion.referral_bonds,
          },
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['instance-cliques-detail', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['instance-unassigned', instanceId] });
      toast({ title: 'Cliques generated!', description: `Created ${data.squads?.length || 0} cliques` });
    } catch (err: any) {
      toast({ title: 'Failed to generate cliques', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Lock/unlock individual clique
  const toggleCliqueLock = async (cliqueId: string, isCurrentlyLocked: boolean) => {
    try {
      const { error } = await supabase
        .from('quest_squads')
        .update(isCurrentlyLocked 
          ? { locked_at: null, locked_by: null }
          : { locked_at: new Date().toISOString(), locked_by: user?.id }
        )
        .eq('id', cliqueId);
      
      if (error) throw error;
      
      await auditLog({
        action: isCurrentlyLocked ? 'clique_unlocked' : 'clique_locked',
        targetTable: 'quest_squads',
        targetId: cliqueId,
      });
      
      queryClient.invalidateQueries({ queryKey: ['instance-cliques-detail', instanceId] });
      toast({ title: isCurrentlyLocked ? 'Clique unlocked' : 'Clique locked' });
    } catch (err: any) {
      toast({ title: 'Failed to update lock', description: err.message, variant: 'destructive' });
    }
  };

  // Lock all cliques
  const handleLockAllCliques = async () => {
    if (!cliques?.length) return;
    
    setIsLockingAll(true);
    try {
      const unlockedCliques = cliques.filter(c => !c.locked_at);
      
      for (const clique of unlockedCliques) {
        await supabase
          .from('quest_squads')
          .update({ locked_at: new Date().toISOString(), locked_by: user?.id })
          .eq('id', clique.id);
      }
      
      await auditLog({
        action: 'cliques_bulk_locked',
        targetTable: 'quest_squads',
        targetId: instanceId,
        newValues: { locked_count: unlockedCliques.length },
      });
      
      queryClient.invalidateQueries({ queryKey: ['instance-cliques-detail', instanceId] });
      toast({ title: `Locked ${unlockedCliques.length} clique(s)` });
    } catch (err: any) {
      toast({ title: 'Failed to lock cliques', description: err.message, variant: 'destructive' });
    } finally {
      setIsLockingAll(false);
    }
  };

  // Start warm-up for a clique
  const handleStartWarmUp = async (cliqueId: string, cliqueName: string) => {
    setStartingWarmUpId(cliqueId);
    try {
      // Update clique status to warming_up
      const { error: updateError } = await supabase
        .from('quest_squads')
        .update({ status: 'warming_up' })
        .eq('id', cliqueId);
      
      if (updateError) throw updateError;
      
      // Notify all clique members
      try {
        await supabase.functions.invoke('notify-clique-members', {
          body: {
            squad_id: cliqueId,
            notification_type: 'warm_up_started',
            title: 'Warm-Up Started!',
            body: `Your clique "${cliqueName}" is now in the warm-up lobby. Introduce yourself and get ready for the quest!`,
            metadata: { instance_id: instanceId },
          },
        });
      } catch (notifyErr) {
        console.error('Failed to send warm-up notifications:', notifyErr);
        // Don't fail the whole operation if notifications fail
      }
      
      await auditLog({
        action: 'clique_warmup_started',
        targetTable: 'quest_squads',
        targetId: cliqueId,
        newValues: { status: 'warming_up' },
      });
      
      queryClient.invalidateQueries({ queryKey: ['instance-cliques-detail', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['instance-squads-warmup', instanceId] });
      toast({ title: 'Warm-Up Started!', description: `${cliqueName} members have been notified.` });
    } catch (err: any) {
      toast({ title: 'Failed to start warm-up', description: err.message, variant: 'destructive' });
    } finally {
      setStartingWarmUpId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {cliques?.length || 0} cliques • {unassigned?.length || 0} unassigned
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline"
                onClick={() => setIsBroadcastOpen(true)}
              >
                <Megaphone className="h-4 w-4 mr-2" />
                Broadcast
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setIsBuilderOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Cliques
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setIsSwapOpen(true)}
                disabled={!cliques?.length || cliques.length < 2}
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Swap Members
              </Button>
              
              <Button 
                onClick={handleGenerateCliques}
                disabled={isGenerating || !unassigned?.length}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Auto-Generate
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleLockAllCliques}
                disabled={isLockingAll || !cliques?.some(c => !c.locked_at)}
              >
                {isLockingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Lock All Cliques
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unassigned */}
      {unassigned && unassigned.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Unassigned Participants ({unassigned.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unassigned.map((p: any) => (
                <Badge key={p.id} variant="outline" className="cursor-pointer hover:bg-muted">
                  <User className="h-3 w-3 mr-1" />
                  {p.profiles?.display_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clique Grid */}
      {cliques && cliques.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cliques.map((clique) => {
            const isLocked = !!clique.locked_at;
            const isWarmingUp = ['warming_up', 'ready_for_review', 'approved'].includes(clique.status);
            const isActive = clique.status === 'active' || clique.status === 'approved';
            const isCompleted = clique.status === 'completed';
            const canStartWarmUp = isLocked && !isWarmingUp && !isCompleted && clique.members.length > 0;
            const canComplete = isActive && clique.members.length > 0;
            const statusStyles = SQUAD_STATUS_STYLES[clique.status] || SQUAD_STATUS_STYLES.confirmed;
            
            return (
              <Card 
                key={clique.id} 
                className={isWarmingUp 
                  ? `${statusStyles.border} ${statusStyles.bg}` 
                  : isLocked 
                    ? "border-muted bg-muted/30" 
                    : ""
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{clique.name}</CardTitle>
                      {isLocked && !isWarmingUp && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      {isWarmingUp && (
                        <ThermometerSun className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isWarmingUp && (
                        <Badge className={`${statusStyles.bg} ${statusStyles.text} border ${statusStyles.border} text-xs`}>
                          {SQUAD_STATUS_LABELS[clique.status]}
                        </Badge>
                      )}
                      <Badge variant="secondary">{clique.members.length}/{targetCliqueSize}</Badge>
                      {!isWarmingUp && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleCliqueLock(clique.id, isLocked)}
                        >
                          {isLocked ? (
                            <Unlock className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Members list */}
                  <div className="space-y-1">
                    {clique.members.length > 0 ? (
                      clique.members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted cursor-pointer">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span>{m.display_name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {m.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm border-2 border-dashed rounded-md">
                        Drop users here
                      </div>
                    )}
                    
                    {/* Empty slots visualization */}
                    {clique.members.length < targetCliqueSize && clique.members.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {Array.from({ length: targetCliqueSize - clique.members.length }).map((_, i) => (
                          <div 
                            key={`empty-${i}`} 
                            className="flex items-center gap-2 text-sm py-1 px-2 rounded border border-dashed border-muted-foreground/30 text-muted-foreground"
                          >
                            <User className="h-3 w-3" />
                            <span>Empty slot</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Start Warm-Up Button */}
                  {canStartWarmUp && (
                    <Button
                      className="w-full"
                      onClick={() => handleStartWarmUp(clique.id, clique.name)}
                      disabled={startingWarmUpId === clique.id}
                    >
                      {startingWarmUpId === clique.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Start Warm-Up
                    </Button>
                  )}
                  
                  {/* Complete Clique Button */}
                  {canComplete && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setCompletingClique({ 
                        id: clique.id, 
                        name: clique.name, 
                        memberCount: clique.members.length 
                      })}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete Clique
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Cliques Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create cliques to organize participants for this quest.
            </p>
            <Button 
              onClick={() => setIsBuilderOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Cliques
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Broadcast Modal */}
      <InstanceBroadcastModal
        open={isBroadcastOpen}
        onOpenChange={setIsBroadcastOpen}
        instanceId={instanceId}
        instanceTitle={instanceTitle}
      />

      {/* Clique Builder */}
      <CliqueBuilder
        open={isBuilderOpen}
        onOpenChange={(open) => {
          setIsBuilderOpen(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ['instance-cliques-detail', instanceId] });
            queryClient.invalidateQueries({ queryKey: ['instance-unassigned', instanceId] });
          }
        }}
        instanceId={instanceId}
        instanceTitle={instanceTitle}
        targetCliqueSize={targetCliqueSize}
      />

      {/* Clique Swap Modal */}
      <CliqueSwapModal
        open={isSwapOpen}
        onOpenChange={setIsSwapOpen}
        instanceId={instanceId}
        instanceTitle={instanceTitle}
      />
    </div>
  );
}
