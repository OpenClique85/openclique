/**
  * Drag-and-Drop Clique Builder (legacy)
 * 
 * Manual squad formation interface allowing admins to drag users
 * between squads and unassigned pool before locking.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, Plus, GripVertical, Trash2, 
  Check, Loader2, UserPlus, AlertCircle
} from 'lucide-react';
import { auditLog } from '@/lib/auditLog';

interface DragUser {
  id: string; // signup id
  user_id: string;
  display_name: string;
  status: string;
  clique_id: string | null;
}

interface DragSquad {
  id: string;
  name: string;
  members: DragUser[];
}

interface DragDropSquadBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  instanceTitle: string;
  targetSquadSize: number;
}

export function DragDropSquadBuilder({
  open,
  onOpenChange,
  instanceId,
  instanceTitle,
  targetSquadSize,
}: DragDropSquadBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [squads, setSquads] = useState<DragSquad[]>([]);
  const [unassigned, setUnassigned] = useState<DragUser[]>([]);
  const [draggedUser, setDraggedUser] = useState<DragUser | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [isNewSquadDialogOpen, setIsNewSquadDialogOpen] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current state
  const { isLoading } = useQuery({
    queryKey: ['drag-drop-squads', instanceId],
    queryFn: async () => {
      // Fetch cliques (quest_squads) for this instance
      const { data: squadData, error: squadError } = await supabase
        .from('quest_squads')
        .select('id, squad_name')
        .eq('instance_id', instanceId)
        .order('squad_name');

      if (squadError) throw squadError;

      // Fetch all signups
      const { data: signupData, error: signupError } = await supabase
        .from('quest_signups')
        .select(`
          id, user_id, status,
          profiles!inner(display_name)
        `)
        .eq('instance_id', instanceId)
        .in('status', ['pending', 'confirmed']);

      if (signupError) throw signupError;

      // Fetch squad_members to know who is in which clique
      const { data: memberData } = await supabase
        .from('squad_members')
        .select('squad_id, user_id');

      // Build user_id -> clique_id map
      const userSquadMap = new Map<string, string>();
      for (const member of memberData || []) {
        userSquadMap.set(member.user_id, member.squad_id);
      }

      // Build squad structure
      const squadMap = new Map<string, DragSquad>();
      for (const squad of squadData || []) {
        squadMap.set(squad.id, {
          id: squad.id,
          name: squad.squad_name || `Squad ${squad.id.slice(0, 4)}`,
          members: [],
        });
      }

      const unassignedUsers: DragUser[] = [];

      for (const signup of signupData || []) {
        const userSquadId = userSquadMap.get(signup.user_id) || null;
        const user: DragUser = {
          id: signup.id,
          user_id: signup.user_id,
          display_name: (signup as any).profiles?.display_name || 'Unknown',
          status: signup.status || 'pending',
          clique_id: userSquadId,
        };

        if (userSquadId && squadMap.has(userSquadId)) {
          squadMap.get(userSquadId)!.members.push(user);
        } else {
          unassignedUsers.push(user);
        }
      }

      setSquads(Array.from(squadMap.values()));
      setUnassigned(unassignedUsers);
      setHasChanges(false);

      return { squads: squadMap, unassigned: unassignedUsers };
    },
    enabled: open,
  });

  // Drag handlers
  const handleDragStart = useCallback((user: DragUser) => {
    setDraggedUser(user);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverTarget(targetId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  const handleDrop = useCallback((targetSquadId: string | 'unassigned') => {
    if (!draggedUser) return;

    setHasChanges(true);

    // Remove from current location
    if ((draggedUser as any).clique_id) {
      setSquads(prev => prev.map(squad => {
        if (squad.id === (draggedUser as any).clique_id) {
          return {
            ...squad,
            members: squad.members.filter(m => m.id !== draggedUser.id),
          };
        }
        return squad;
      }));
    } else {
      setUnassigned(prev => prev.filter(u => u.id !== draggedUser.id));
    }

    // Add to new location
    const updatedUser = { ...draggedUser, clique_id: targetSquadId === 'unassigned' ? null : targetSquadId } as any;

    if (targetSquadId === 'unassigned') {
      setUnassigned(prev => [...prev, updatedUser]);
    } else {
      setSquads(prev => prev.map(squad => {
        if (squad.id === targetSquadId) {
          return {
            ...squad,
            members: [...squad.members, updatedUser],
          };
        }
        return squad;
      }));
    }

    setDraggedUser(null);
    setDragOverTarget(null);
  }, [draggedUser]);

  // Create new squad
  const handleCreateSquad = async () => {
    if (!newSquadName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('quest_squads')
        .insert({
          instance_id: instanceId as any,
          squad_name: newSquadName.trim(),
        } as any)
        .select()
        .single();

      if (error) throw error;

      setSquads(prev => [...prev, {
        id: data.id,
        name: data.squad_name || newSquadName.trim(),
        members: [],
      }]);

      setNewSquadName('');
      setIsNewSquadDialogOpen(false);
      setHasChanges(true);
      toast({ title: 'Clique created' });
    } catch (err: any) {
      toast({ title: 'Failed to create clique', description: err.message, variant: 'destructive' });
    }
  };

  // Delete empty squad
  const handleDeleteSquad = async (squadId: string) => {
    const squad = squads.find(s => s.id === squadId);
    if (!squad || squad.members.length > 0) {
      toast({ title: 'Cannot delete squad with members', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('quest_squads')
        .delete()
        .eq('id', squadId);

      if (error) throw error;

      setSquads(prev => prev.filter(s => s.id !== squadId));
      setHasChanges(true);
      toast({ title: 'Squad deleted' });
    } catch (err: any) {
      toast({ title: 'Failed to delete squad', description: err.message, variant: 'destructive' });
    }
  };

  // Save all changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First, remove all existing squad_members for users in this instance
      const allUserIds = [
        ...squads.flatMap(s => s.members.map(m => m.user_id)),
        ...unassigned.map(u => u.user_id),
      ];

      // Delete existing memberships for these users
      if (allUserIds.length > 0) {
        await supabase
          .from('squad_members')
          .delete()
          .in('user_id', allUserIds);
      }

      // Update squad assignments for all users
      for (const squad of squads) {
        for (const member of squad.members) {
          // Insert into squad_members table
          await supabase
            .from('squad_members')
            .insert({
              squad_id: squad.id,
              user_id: member.user_id,
            });
        }
      }

      // Unassigned users already had their memberships deleted above
      // No additional action needed for them

      // Log the manual assignment
      await auditLog({
        action: 'manual_squad_assignment',
        targetTable: 'quest_instances',
        targetId: instanceId,
        newValues: {
          squad_count: squads.length,
          total_assigned: squads.reduce((sum, s) => sum + s.members.length, 0),
          unassigned_count: unassigned.length,
        },
      });

      queryClient.invalidateQueries({ queryKey: ['instance-squads-detail', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['instance-unassigned', instanceId] });

      toast({ title: 'Squad assignments saved!' });
      setHasChanges(false);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Failed to save', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // User card component
  const UserCard = ({ user, isDragging }: { user: DragUser; isDragging?: boolean }) => (
    <div
      draggable
      onDragStart={() => handleDragStart(user)}
      className={`flex items-center gap-2 p-2 rounded-md border bg-card cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:border-primary/50'
      }`}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm flex-1 truncate">{user.display_name}</span>
      <Badge variant="outline" className="text-xs">
        {user.status}
      </Badge>
    </div>
  );

  // Drop zone component
  const DropZone = ({ 
    id, 
    title, 
    users, 
    onDelete,
    showTargetSize = false,
  }: { 
    id: string; 
    title: string; 
    users: DragUser[]; 
    onDelete?: () => void;
    showTargetSize?: boolean;
  }) => {
    const isOver = dragOverTarget === id;
    const isOverfilled = showTargetSize && users.length > targetSquadSize;
    const isUnderfilled = showTargetSize && users.length > 0 && users.length < targetSquadSize;

    return (
      <Card
        onDragOver={(e) => handleDragOver(e, id)}
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(id)}
        className={`transition-all ${
          isOver ? 'ring-2 ring-primary border-primary' : ''
        }`}
      >
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {title}
              <Badge 
                variant={isOverfilled ? 'destructive' : isUnderfilled ? 'outline' : 'secondary'}
                className="text-xs"
              >
                {users.length}{showTargetSize && `/${targetSquadSize}`}
              </Badge>
            </CardTitle>
            {onDelete && users.length === 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2 min-h-[60px]">
            {users.length > 0 ? (
              users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isDragging={draggedUser?.id === user.id}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-[60px] border-2 border-dashed rounded-md text-muted-foreground text-sm">
                Drop users here
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Manual Squad Builder
          </DialogTitle>
          <DialogDescription>
            Drag and drop users between squads. Changes are saved when you click "Save Changes".
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[60vh]">
            <div className="grid lg:grid-cols-4 gap-4 p-1">
              {/* Unassigned Pool */}
              <div className="lg:col-span-1">
                <DropZone
                  id="unassigned"
                  title="Unassigned"
                  users={unassigned}
                />
              </div>

              {/* Squads */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Squads ({squads.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextNum = squads.length + 1;
                      setNewSquadName(`${instanceTitle} Squad ${nextNum}`);
                      setIsNewSquadDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Squad
                  </Button>
                </div>

                {squads.length > 0 ? (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {squads.map((squad) => (
                      <DropZone
                        key={squad.id}
                        id={squad.id}
                        title={squad.name}
                        users={squad.members}
                        onDelete={() => handleDeleteSquad(squad.id)}
                        showTargetSize
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <UserPlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No squads yet. Create one to start assigning users.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {hasChanges && (
              <>
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span>You have unsaved changes</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* New Squad Dialog */}
      <Dialog open={isNewSquadDialogOpen} onOpenChange={setIsNewSquadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Squad</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Squad name..."
              value={newSquadName}
              onChange={(e) => setNewSquadName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSquad()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewSquadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSquad} disabled={!newSquadName.trim()}>
              Create Squad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
