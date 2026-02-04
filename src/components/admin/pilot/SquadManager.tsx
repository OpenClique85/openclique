/**
 * Squad Manager
 * 
 * Generate squads, assign WhatsApp links, and manage squad composition.
 * Includes broadcast messaging, drag-and-drop manual squad formation,
 * squad locking, and member swap functionality.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, Wand2, Lock, Copy, MessageSquare, 
  Loader2, AlertCircle, CheckCircle, Link2,
  Megaphone, MousePointerClick, ArrowLeftRight, Unlock
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { auditLog } from '@/lib/auditLog';
import { InstanceBroadcastModal } from './InstanceBroadcastModal';
import { DragDropSquadBuilder } from './DragDropSquadBuilder';
import { SquadSwapModal } from './SquadSwapModal';

interface SquadWithMembers {
  id: string;
  name: string;
  locked_at: string | null;
  members: {
    id: string;
    user_id: string;
    display_name: string;
    status: string;
    checked_in_at: string | null;
  }[];
}

interface SquadManagerProps {
  instanceId: string;
  instanceTitle?: string;
  targetSquadSize: number;
}

export function SquadManager({ instanceId, instanceTitle = 'Quest', targetSquadSize }: SquadManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isDragDropOpen, setIsDragDropOpen] = useState(false);
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [isLockingAll, setIsLockingAll] = useState(false);

  // Fetch squads with members
  const { data: squads, isLoading } = useQuery({
    queryKey: ['instance-squads-detail', instanceId],
    queryFn: async () => {
      // First get squads - use existing quest_squads columns
      const { data: squadData, error: squadError } = await supabase
        .from('quest_squads')
        .select('id, squad_name, locked_at')
        .eq('quest_id', instanceId)
        .order('squad_name');
      
      if (squadError) throw squadError;
      
      // Then get members for each squad
      const squadsWithMembers: SquadWithMembers[] = await Promise.all(
        (squadData || []).map(async (squad) => {
          const { data: members } = await supabase
            .from('squad_members')
            .select(`
              id, user_id,
              profiles(display_name)
            `)
            .eq('squad_id', squad.id);
          
          return {
            id: squad.id,
            name: squad.squad_name || `Squad ${squad.id.slice(0, 4)}`,
            locked_at: squad.locked_at,
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
      
      return squadsWithMembers;
    },
  });

  // Fetch unassigned participants
  const { data: unassigned } = useQuery({
    queryKey: ['instance-unassigned', instanceId],
    queryFn: async () => {
      // Schema note: quest_signups does NOT have a squad_id column.
      // Assignment is tracked via squad_members.

      const [{ data: signups, error: signupsError }, { data: squadRows, error: squadsError }] = await Promise.all([
        supabase
          .from('quest_signups')
          .select(`id, user_id, status, profiles(display_name)`)
          .eq('instance_id', instanceId)
          .in('status', ['pending', 'confirmed']),
        supabase
          .from('quest_squads')
          .select('id')
          .eq('quest_id', instanceId),
      ]);

      if (signupsError) throw signupsError;
      if (squadsError) throw squadsError;

      const squadIds = (squadRows || []).map((s) => s.id);

      let assignedUserIds = new Set<string>();
      if (squadIds.length > 0) {
        const { data: memberRows, error: membersError } = await supabase
          .from('squad_members')
          .select('user_id')
          .in('squad_id', squadIds);
        if (membersError) throw membersError;
        assignedUserIds = new Set((memberRows || []).map((m) => m.user_id));
      }

      return (signups || []).filter((s: any) => !assignedUserIds.has(s.user_id));
    },
  });

  // Generate squads
  const handleGenerateSquads = async () => {
    setIsGenerating(true);
    try {
      // First get the instance title for naming
      const { data: instanceData } = await supabase
        .from('quest_instances')
        .select('title')
        .eq('id', instanceId)
        .single();
      
      const instanceTitle = instanceData?.title || 'Quest';
      
      const { data, error } = await supabase.functions.invoke('recommend-squads', {
        body: { quest_id: instanceId, squad_size: targetSquadSize }
      });
      
      if (error) throw error;
      
      // Create squads and assign members with proper naming convention
      let squadNumber = (squads?.length || 0) + 1;
      
      for (const suggestion of data.squads || []) {
        // Create squad with "{Instance Title} Squad {N}" naming and formation_reason
        const squadName = `${instanceTitle} Squad ${squadNumber++}`;
        
        const { data: newSquad, error: createError } = await supabase
          .from('quest_squads')
          .insert({
            quest_id: instanceId,
            squad_name: squadName,
            formation_reason: suggestion.formation_reason,
            compatibility_score: suggestion.compatibility_score,
            referral_bonds: suggestion.referral_bonds,
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Failed to create squad:', createError);
          continue;
        }
        
        // Assign members
        for (const member of suggestion.members) {
          await supabase
            .from('squad_members')
            .upsert({
              squad_id: newSquad.id,
              user_id: member.user_id,
            }, { onConflict: 'squad_id,user_id' });
          
          // Note the assignment in private notes
          await supabase
            .from('quest_signups')
            .update({ notes_private: `Assigned to: ${squadName}` })
            .eq('id', member.signup_id);
        }
        
        // Log squad formation using auditLog helper
        await auditLog({
          action: 'squad_formed',
          targetTable: 'quest_squads',
          targetId: newSquad.id,
          newValues: {
            squad_name: squadName,
            member_count: suggestion.members.length,
            compatibility_score: suggestion.compatibility_score,
            referral_bonds: suggestion.referral_bonds,
          },
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['instance-squads-detail', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['instance-unassigned', instanceId] });
      toast({ title: 'Squads generated!', description: `Created ${data.squads?.length || 0} squads with "${instanceTitle} Squad N" naming` });
    } catch (err: any) {
      toast({ title: 'Failed to generate squads', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  // Lock/unlock individual squad
  const toggleSquadLock = async (squadId: string, isCurrentlyLocked: boolean) => {
    try {
      const { error } = await supabase
        .from('quest_squads')
        .update(isCurrentlyLocked 
          ? { locked_at: null, locked_by: null }
          : { locked_at: new Date().toISOString(), locked_by: user?.id }
        )
        .eq('id', squadId);
      
      if (error) throw error;
      
      await auditLog({
        action: isCurrentlyLocked ? 'squad_unlocked' : 'squad_locked',
        targetTable: 'quest_squads',
        targetId: squadId,
      });
      
      queryClient.invalidateQueries({ queryKey: ['instance-squads-detail', instanceId] });
      toast({ title: isCurrentlyLocked ? 'Squad unlocked' : 'Squad locked' });
    } catch (err: any) {
      toast({ title: 'Failed to update lock', description: err.message, variant: 'destructive' });
    }
  };

  // Lock all squads
  const handleLockAllSquads = async () => {
    if (!squads?.length) return;
    
    setIsLockingAll(true);
    try {
      const unlockedSquads = squads.filter(s => !s.locked_at);
      
      for (const squad of unlockedSquads) {
        await supabase
          .from('quest_squads')
          .update({ locked_at: new Date().toISOString(), locked_by: user?.id })
          .eq('id', squad.id);
      }
      
      await auditLog({
        action: 'squads_bulk_locked',
        targetTable: 'quest_squads',
        targetId: instanceId,
        newValues: { locked_count: unlockedSquads.length },
      });
      
      queryClient.invalidateQueries({ queryKey: ['instance-squads-detail', instanceId] });
      toast({ title: `Locked ${unlockedSquads.length} squad(s)` });
    } catch (err: any) {
      toast({ title: 'Failed to lock squads', description: err.message, variant: 'destructive' });
    } finally {
      setIsLockingAll(false);
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
                {squads?.length || 0} squads • {unassigned?.length || 0} unassigned
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Broadcast Button */}
              <Button 
                variant="outline"
                onClick={() => setIsBroadcastOpen(true)}
              >
                <Megaphone className="h-4 w-4 mr-2" />
                Broadcast
              </Button>
              
              {/* Manual Assignment Button */}
              <Button 
                variant="outline"
                onClick={() => setIsDragDropOpen(true)}
              >
                <MousePointerClick className="h-4 w-4 mr-2" />
                Manual Assign
              </Button>
              
              {/* Swap Members Button */}
              <Button 
                variant="outline"
                onClick={() => setIsSwapOpen(true)}
                disabled={!squads?.length || squads.length < 2}
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Swap Members
              </Button>
              
              {/* Auto Generate */}
              <Button 
                onClick={handleGenerateSquads}
                disabled={isGenerating || !unassigned?.length}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Generate Squads
              </Button>
              <Button 
                variant="outline"
                onClick={handleLockAllSquads}
                disabled={isLockingAll || !squads?.some(s => !s.locked_at)}
              >
                {isLockingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Lock All Squads
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
                <Badge key={p.id} variant="outline">
                  {p.profiles?.display_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Squad Grid */}
      {squads && squads.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {squads.map((squad) => (
            <Card key={squad.id} className={squad.locked_at ? "border-muted bg-muted/30" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{squad.name}</CardTitle>
                    {squad.locked_at && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{squad.members.length} members</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleSquadLock(squad.id, !!squad.locked_at)}
                    >
                      {squad.locked_at ? (
                        <Unlock className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Members list */}
                <div className="space-y-1">
                  {squad.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm py-1">
                      <span>{m.display_name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {m.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Squads Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate squads when you have enough confirmed participants.
            </p>
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

      {/* Drag & Drop Squad Builder */}
      <DragDropSquadBuilder
        open={isDragDropOpen}
        onOpenChange={(open) => {
          setIsDragDropOpen(open);
          if (!open) {
            // Refresh data when modal closes
            queryClient.invalidateQueries({ queryKey: ['instance-squads-detail', instanceId] });
            queryClient.invalidateQueries({ queryKey: ['instance-unassigned', instanceId] });
          }
        }}
        instanceId={instanceId}
        instanceTitle={instanceTitle}
        targetSquadSize={targetSquadSize}
      />

      {/* Squad Swap Modal */}
      <SquadSwapModal
        open={isSwapOpen}
        onOpenChange={setIsSwapOpen}
        instanceId={instanceId}
        instanceTitle={instanceTitle}
      />
    </div>
  );
}
