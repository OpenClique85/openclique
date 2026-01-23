/**
 * =============================================================================
 * SQUAD SWAP MODAL - Two-step interface for swapping users between squads
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { auditLog } from '@/lib/auditLog';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeftRight, Check, User, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SquadMember {
  id: string;
  user_id: string;
  display_name: string;
  squad_id: string;
  squad_name: string;
}

interface SquadSwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  instanceTitle: string;
}

export function SquadSwapModal({ open, onOpenChange, instanceId, instanceTitle }: SquadSwapModalProps) {
  const queryClient = useQueryClient();
  const [selectedUser1, setSelectedUser1] = useState<SquadMember | null>(null);
  const [selectedUser2, setSelectedUser2] = useState<SquadMember | null>(null);

  // Fetch all squads and members for this instance
  const { data: squadsWithMembers, isLoading } = useQuery({
    queryKey: ['swap-squads', instanceId],
    queryFn: async () => {
      const { data: squads, error: squadsError } = await supabase
        .from('quest_squads')
        .select('id, squad_name, locked_at')
        .eq('quest_id', instanceId);

      if (squadsError) throw squadsError;
      if (!squads?.length) return [];

      const squadIds = squads.map(s => s.id);
      const { data: members, error: membersError } = await supabase
        .from('squad_members')
        .select(`
          id,
          user_id,
          squad_id,
          profiles!inner(display_name)
        `)
        .in('squad_id', squadIds);

      if (membersError) throw membersError;

      return squads.map(squad => ({
        id: squad.id,
        squad_name: squad.squad_name || 'Unnamed',
        isLocked: !!squad.locked_at,
        members: (members || [])
          .filter(m => m.squad_id === squad.id)
          .map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            display_name: m.profiles?.display_name || 'Unknown',
            squad_id: squad.id,
            squad_name: squad.squad_name || 'Unnamed',
          })),
      }));
    },
    enabled: open,
  });

  // Swap mutation
  const swapMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser1 || !selectedUser2) return;

      // Update user1 to user2's squad
      const { error: error1 } = await supabase
        .from('squad_members')
        .update({ squad_id: selectedUser2.squad_id })
        .eq('id', selectedUser1.id);

      if (error1) throw error1;

      // Update user2 to user1's squad
      const { error: error2 } = await supabase
        .from('squad_members')
        .update({ squad_id: selectedUser1.squad_id })
        .eq('id', selectedUser2.id);

      if (error2) throw error2;

      // Audit log
      await auditLog({
        action: 'squad_members_swapped',
        targetTable: 'squad_members',
        targetId: instanceId,
        newValues: {
          user1: { id: selectedUser1.user_id, from: selectedUser1.squad_name, to: selectedUser2.squad_name },
          user2: { id: selectedUser2.user_id, from: selectedUser2.squad_name, to: selectedUser1.squad_name },
        },
      });
    },
    onSuccess: () => {
      toast.success('Members swapped successfully');
      queryClient.invalidateQueries({ queryKey: ['swap-squads', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['instance-squads-detail', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['drag-drop-squads', instanceId] });
      setSelectedUser1(null);
      setSelectedUser2(null);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Swap error:', error);
      toast.error('Failed to swap members');
    },
  });

  const handleUserClick = (member: SquadMember, squadLocked: boolean) => {
    if (squadLocked) {
      toast.error('Cannot swap members from a locked squad');
      return;
    }

    if (!selectedUser1) {
      setSelectedUser1(member);
    } else if (selectedUser1.id === member.id) {
      setSelectedUser1(null);
    } else if (selectedUser1.squad_id === member.squad_id) {
      toast.error('Select a user from a different squad');
    } else if (!selectedUser2) {
      setSelectedUser2(member);
    } else if (selectedUser2.id === member.id) {
      setSelectedUser2(null);
    } else {
      // Replace user2
      setSelectedUser2(member);
    }
  };

  const handleReset = () => {
    setSelectedUser1(null);
    setSelectedUser2(null);
  };

  const canSwap = selectedUser1 && selectedUser2 && selectedUser1.squad_id !== selectedUser2.squad_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Swap Squad Members
          </DialogTitle>
          <DialogDescription>
            Select two users from different squads to swap their positions for "{instanceTitle}"
          </DialogDescription>
        </DialogHeader>

        {/* Selection Summary */}
        <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
          <div className={cn(
            "flex-1 p-3 rounded-lg border-2 border-dashed text-center transition-colors",
            selectedUser1 ? "border-primary bg-primary/10" : "border-muted-foreground/30"
          )}>
            {selectedUser1 ? (
              <div>
                <p className="font-medium">{selectedUser1.display_name}</p>
                <p className="text-xs text-muted-foreground">{selectedUser1.squad_name}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Select first user</p>
            )}
          </div>

          <ArrowLeftRight className="h-5 w-5 text-muted-foreground shrink-0" />

          <div className={cn(
            "flex-1 p-3 rounded-lg border-2 border-dashed text-center transition-colors",
            selectedUser2 ? "border-primary bg-primary/10" : "border-muted-foreground/30"
          )}>
            {selectedUser2 ? (
              <div>
                <p className="font-medium">{selectedUser2.display_name}</p>
                <p className="text-xs text-muted-foreground">{selectedUser2.squad_name}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Select second user</p>
            )}
          </div>
        </div>

        {/* Squad Grid */}
        <ScrollArea className="h-[350px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Loading squads...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {squadsWithMembers?.map((squad) => (
                <div
                  key={squad.id}
                  className={cn(
                    "border rounded-lg p-3",
                    squad.isLocked && "opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{squad.squad_name}</h4>
                    {squad.isLocked && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    {squad.members.map((member) => {
                      const isSelected = selectedUser1?.id === member.id || selectedUser2?.id === member.id;
                      const isFirstSelection = selectedUser1?.id === member.id;
                      const isSecondSelection = selectedUser2?.id === member.id;

                      return (
                        <button
                          key={member.id}
                          onClick={() => handleUserClick(member, squad.isLocked)}
                          disabled={squad.isLocked}
                          className={cn(
                            "w-full flex items-center gap-2 p-2 rounded text-left text-sm transition-colors",
                            "hover:bg-accent disabled:cursor-not-allowed",
                            isSelected && "bg-primary/20 border border-primary",
                            isFirstSelection && "ring-2 ring-primary ring-offset-1",
                            isSecondSelection && "ring-2 ring-secondary ring-offset-1"
                          )}
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{member.display_name}</span>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })}
                    {squad.members.length === 0 && (
                      <p className="text-xs text-muted-foreground p-2">No members</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={handleReset} disabled={!selectedUser1 && !selectedUser2}>
            Reset Selection
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => swapMutation.mutate()}
              disabled={!canSwap || swapMutation.isPending}
            >
              {swapMutation.isPending ? 'Swapping...' : 'Confirm Swap'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
