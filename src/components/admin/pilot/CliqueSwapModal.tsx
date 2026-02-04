/**
 * Clique Swap Modal
 * 
 * Allows admins to swap members between cliques.
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeftRight, Loader2, User } from 'lucide-react';
import { auditLog } from '@/lib/auditLog';

interface CliqueSwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  instanceTitle: string;
}

interface CliqueMember {
  id: string;
  user_id: string;
  display_name: string;
  clique_id: string;
  clique_name: string;
}

export function CliqueSwapModal({
  open,
  onOpenChange,
  instanceId,
  instanceTitle,
}: CliqueSwapModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser1, setSelectedUser1] = useState<CliqueMember | null>(null);
  const [selectedUser2, setSelectedUser2] = useState<CliqueMember | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // Fetch all cliques and members
  const { data: members, isLoading } = useQuery({
    queryKey: ['clique-swap-members', instanceId],
    queryFn: async () => {
      // Get cliques by instance_id
      const { data: cliques, error: cliquesError } = await supabase
        .from('quest_squads')
        .select('id, squad_name')
        .eq('instance_id', instanceId);

      if (cliquesError) throw cliquesError;

      const cliqueIds = (cliques || []).map(c => c.id);
      if (cliqueIds.length === 0) return [];

      // Get members
      const { data: memberData, error: membersError } = await supabase
        .from('squad_members')
        .select(`
          id,
          squad_id,
          user_id,
          profiles(display_name)
        `)
        .in('squad_id', cliqueIds);

      if (membersError) throw membersError;

      return (memberData || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        display_name: m.profiles?.display_name || 'Unknown',
        clique_id: m.squad_id,
        clique_name: cliques?.find(c => c.id === m.squad_id)?.squad_name || 'Unknown Clique',
      }));
    },
    enabled: open,
  });

  // Perform swap
  const handleSwap = async () => {
    if (!selectedUser1 || !selectedUser2) return;
    if (selectedUser1.clique_id === selectedUser2.clique_id) {
      toast({ title: 'Users must be in different cliques', variant: 'destructive' });
      return;
    }

    setIsSwapping(true);
    try {
      // Update user1 to user2's clique
      const { error: error1 } = await supabase
        .from('squad_members')
        .update({ squad_id: selectedUser2.clique_id })
        .eq('id', selectedUser1.id);

      if (error1) throw error1;

      // Update user2 to user1's clique
      const { error: error2 } = await supabase
        .from('squad_members')
        .update({ squad_id: selectedUser1.clique_id })
        .eq('id', selectedUser2.id);

      if (error2) throw error2;

      await auditLog({
        action: 'clique_members_swapped',
        targetTable: 'squad_members',
        targetId: instanceId,
        newValues: {
          user1: { name: selectedUser1.display_name, from: selectedUser1.clique_name, to: selectedUser2.clique_name },
          user2: { name: selectedUser2.display_name, from: selectedUser2.clique_name, to: selectedUser1.clique_name },
        },
      });

      queryClient.invalidateQueries({ queryKey: ['clique-swap-members', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['instance-cliques-detail', instanceId] });

      toast({ title: 'Members swapped successfully!' });
      setSelectedUser1(null);
      setSelectedUser2(null);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Failed to swap members', description: err.message, variant: 'destructive' });
    } finally {
      setIsSwapping(false);
    }
  };

  const getFilteredMembers = (excludeUserId?: string) => {
    return (members || []).filter(m => m.user_id !== excludeUserId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Swap Clique Members
          </DialogTitle>
          <DialogDescription>
            Select two users from different cliques to swap their positions.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* User 1 Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">First User</label>
              <Select
                value={selectedUser1?.id || ''}
                onValueChange={(value) => {
                  const member = members?.find(m => m.id === value);
                  setSelectedUser1(member || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select first user" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredMembers(selectedUser2?.user_id).map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{member.display_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {member.clique_name}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Swap Icon */}
            <div className="flex justify-center">
              <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* User 2 Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Second User</label>
              <Select
                value={selectedUser2?.id || ''}
                onValueChange={(value) => {
                  const member = members?.find(m => m.id === value);
                  setSelectedUser2(member || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select second user" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredMembers(selectedUser1?.user_id).map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{member.display_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {member.clique_name}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            {selectedUser1 && selectedUser2 && (
              <div className="p-4 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-2">Swap Preview:</p>
                <p className="text-muted-foreground">
                  <strong>{selectedUser1.display_name}</strong> will move from{' '}
                  <Badge variant="outline">{selectedUser1.clique_name}</Badge> to{' '}
                  <Badge variant="outline">{selectedUser2.clique_name}</Badge>
                </p>
                <p className="text-muted-foreground mt-1">
                  <strong>{selectedUser2.display_name}</strong> will move from{' '}
                  <Badge variant="outline">{selectedUser2.clique_name}</Badge> to{' '}
                  <Badge variant="outline">{selectedUser1.clique_name}</Badge>
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSwap}
            disabled={!selectedUser1 || !selectedUser2 || isSwapping || selectedUser1?.clique_id === selectedUser2?.clique_id}
          >
            {isSwapping && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Swap Members
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
