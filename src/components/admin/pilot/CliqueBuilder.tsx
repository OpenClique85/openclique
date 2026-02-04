/**
 * Clique Builder (WoW Raid-style)
 * 
 * Fixed 8-group grid with drag-and-drop user assignment.
 * Click on users to see their profile details.
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Users, Plus, GripVertical, Trash2, 
  Check, Loader2, UserPlus, AlertCircle, User, Pencil
} from 'lucide-react';
import { auditLog } from '@/lib/auditLog';

interface DragUser {
  id: string; // signup id
  user_id: string;
  display_name: string;
  email?: string;
  status: string;
  clique_id: string | null;
}

interface DragClique {
  id: string;
  name: string;
  members: DragUser[];
  isNew?: boolean; // not yet saved to DB
}

interface CliqueBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  instanceTitle: string;
  targetCliqueSize: number;
}

const DEFAULT_CLIQUE_COUNT = 8;

export function CliqueBuilder({
  open,
  onOpenChange,
  instanceId,
  instanceTitle,
  targetCliqueSize,
}: CliqueBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [cliques, setCliques] = useState<DragClique[]>([]);
  const [unassigned, setUnassigned] = useState<DragUser[]>([]);
  const [draggedUser, setDraggedUser] = useState<DragUser | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DragUser | null>(null);
  const [editingCliqueId, setEditingCliqueId] = useState<string | null>(null);
  const [editingCliqueName, setEditingCliqueName] = useState('');

  // Fetch current state from DB
  const { isLoading, refetch } = useQuery({
    queryKey: ['clique-builder-data', instanceId],
    queryFn: async () => {
      // Fetch cliques by instance_id
      const { data: cliqueData, error: cliqueError } = await supabase
        .from('quest_squads')
        .select('id, squad_name')
        .eq('instance_id', instanceId)
        .order('squad_name');

      if (cliqueError) throw cliqueError;

      // Fetch all signups
      const { data: signupData, error: signupError } = await supabase
        .from('quest_signups')
        .select(`
          id, user_id, status,
          profiles(display_name, email)
        `)
        .eq('instance_id', instanceId)
        .in('status', ['pending', 'confirmed']);

      if (signupError) throw signupError;

      // Fetch squad_members
      const cliqueIds = (cliqueData || []).map(c => c.id);
      const { data: memberData } = cliqueIds.length > 0 
        ? await supabase
            .from('squad_members')
            .select('squad_id, user_id')
            .in('squad_id', cliqueIds)
        : { data: [] };

      // Build user_id -> clique_id map
      const userCliqueMap = new Map<string, string>();
      for (const member of memberData || []) {
        userCliqueMap.set(member.user_id, member.squad_id);
      }

      // Build clique structure from DB
      const dbCliques: DragClique[] = (cliqueData || []).map((c) => ({
        id: c.id,
        name: c.squad_name || `Clique ${c.id.slice(0, 4)}`,
        members: [],
        isNew: false,
      }));

      const unassignedUsers: DragUser[] = [];

      for (const signup of signupData || []) {
        const userCliqueId = userCliqueMap.get(signup.user_id) || null;
        const user: DragUser = {
          id: signup.id,
          user_id: signup.user_id,
          display_name: (signup as any).profiles?.display_name || 'Unknown',
          email: (signup as any).profiles?.email || undefined,
          status: signup.status || 'pending',
          clique_id: userCliqueId,
        };

        if (userCliqueId) {
          const clique = dbCliques.find(c => c.id === userCliqueId);
          if (clique) {
            clique.members.push(user);
          } else {
            unassignedUsers.push(user);
          }
        } else {
          unassignedUsers.push(user);
        }
      }

      return { cliques: dbCliques, unassigned: unassignedUsers };
    },
    enabled: open,
  });

  // Initialize 8 clique grid when data loads
  useEffect(() => {
    if (!open) return;

    refetch().then((result) => {
      if (!result.data) return;

      const dbCliques = result.data.cliques;
      const dbUnassigned = result.data.unassigned;

      // Fill up to 8 cliques
      const grid: DragClique[] = [];
      for (let i = 0; i < DEFAULT_CLIQUE_COUNT; i++) {
        if (dbCliques[i]) {
          grid.push(dbCliques[i]);
        } else {
          grid.push({
            id: `new-${i}`,
            name: `Clique ${i + 1}`,
            members: [],
            isNew: true,
          });
        }
      }

      setCliques(grid);
      setUnassigned(dbUnassigned);
      setHasChanges(false);
    });
  }, [open, refetch]);

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

  const handleDrop = useCallback((targetCliqueId: string | 'unassigned') => {
    if (!draggedUser) return;

    setHasChanges(true);

    // Remove from current location
    if (draggedUser.clique_id) {
      setCliques(prev => prev.map(clique => {
        if (clique.id === draggedUser.clique_id) {
          return {
            ...clique,
            members: clique.members.filter(m => m.id !== draggedUser.id),
          };
        }
        return clique;
      }));
    } else {
      setUnassigned(prev => prev.filter(u => u.id !== draggedUser.id));
    }

    // Add to new location
    const updatedUser = { ...draggedUser, clique_id: targetCliqueId === 'unassigned' ? null : targetCliqueId };

    if (targetCliqueId === 'unassigned') {
      setUnassigned(prev => [...prev, updatedUser]);
    } else {
      setCliques(prev => prev.map(clique => {
        if (clique.id === targetCliqueId) {
          return {
            ...clique,
            members: [...clique.members, updatedUser],
          };
        }
        return clique;
      }));
    }

    setDraggedUser(null);
    setDragOverTarget(null);
  }, [draggedUser]);

  // Add more cliques beyond 8
  const handleAddClique = () => {
    const nextNum = cliques.length + 1;
    setCliques(prev => [...prev, {
      id: `new-${Date.now()}`,
      name: `Clique ${nextNum}`,
      members: [],
      isNew: true,
    }]);
    setHasChanges(true);
  };

  // Rename clique
  const handleRenameClique = (cliqueId: string) => {
    const clique = cliques.find(c => c.id === cliqueId);
    if (clique) {
      setEditingCliqueId(cliqueId);
      setEditingCliqueName(clique.name);
    }
  };

  const saveCliqueName = () => {
    if (!editingCliqueId || !editingCliqueName.trim()) return;
    setCliques(prev => prev.map(c => 
      c.id === editingCliqueId ? { ...c, name: editingCliqueName.trim() } : c
    ));
    setEditingCliqueId(null);
    setEditingCliqueName('');
    setHasChanges(true);
  };

  // Save all changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First, get the quest_id from the instance
      const { data: instanceData, error: instanceError } = await supabase
        .from('quest_instances')
        .select('quest_id')
        .eq('id', instanceId)
        .single();

      if (instanceError) throw new Error('Could not find quest instance');
      const questId = instanceData.quest_id;

      // 1. Get or create cliques in DB
      const cliqueIdMap = new Map<string, string>(); // local id -> db id

      for (const clique of cliques) {
        if (clique.isNew) {
          // Only create if has members
          if (clique.members.length > 0) {
            const { data, error } = await supabase
              .from('quest_squads')
              .insert({
                quest_id: questId,
                instance_id: instanceId,
                squad_name: clique.name,
              } as any)
              .select()
              .single();

            if (error) throw error;
            cliqueIdMap.set(clique.id, data.id);
          }
        } else {
          cliqueIdMap.set(clique.id, clique.id);
          // Update name if changed
          await supabase
            .from('quest_squads')
            .update({ squad_name: clique.name })
            .eq('id', clique.id);
        }
      }

      // 2. Get all current clique IDs for this instance
      const { data: dbCliques } = await supabase
        .from('quest_squads')
        .select('id')
        .eq('instance_id', instanceId);

      const dbCliqueIds = (dbCliques || []).map(c => c.id);

      // 3. Clear existing memberships for these cliques
      if (dbCliqueIds.length > 0) {
        await supabase
          .from('squad_members')
          .delete()
          .in('squad_id', dbCliqueIds);
      }

      // 4. Insert new memberships
      for (const clique of cliques) {
        const dbId = cliqueIdMap.get(clique.id);
        if (!dbId) continue;

        for (const member of clique.members) {
          await supabase
            .from('squad_members')
            .insert({
              squad_id: dbId,
              user_id: member.user_id,
            });
        }
      }

      await auditLog({
        action: 'manual_clique_assignment',
        targetTable: 'quest_instances',
        targetId: instanceId,
        newValues: {
          clique_count: cliques.filter(c => c.members.length > 0).length,
          total_assigned: cliques.reduce((sum, c) => sum + c.members.length, 0),
          unassigned_count: unassigned.length,
        },
      });

      queryClient.invalidateQueries({ queryKey: ['instance-cliques-detail', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['instance-unassigned', instanceId] });
      toast({ title: 'Clique assignments saved!' });
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
      onClick={() => setSelectedUser(user)}
      className={`flex items-center gap-2 p-1.5 rounded border bg-card cursor-move transition-all text-sm ${
        isDragging ? 'opacity-50 scale-95' : 'hover:border-primary/50 hover:bg-accent/50'
      }`}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <span className="flex-1 truncate">{user.display_name}</span>
    </div>
  );

  // Empty slot component
  const EmptySlot = ({ index }: { index: number }) => (
    <div className="flex items-center gap-2 p-1.5 rounded border border-dashed border-muted-foreground/30 text-muted-foreground text-sm">
      <User className="h-3 w-3" />
      <span>Empty</span>
    </div>
  );

  // Clique Group component (WoW-style)
  const CliqueGroup = ({ clique, index }: { clique: DragClique; index: number }) => {
    const isOver = dragOverTarget === clique.id;
    const emptySlots = Math.max(0, targetCliqueSize - clique.members.length);

    return (
      <Card
        onDragOver={(e) => handleDragOver(e, clique.id)}
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(clique.id)}
        className={`transition-all ${
          isOver ? 'ring-2 ring-primary border-primary' : ''
        }`}
      >
        <CardHeader className="py-2 px-3">
          <div className="flex items-center justify-between">
            {editingCliqueId === clique.id ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editingCliqueName}
                  onChange={(e) => setEditingCliqueName(e.target.value)}
                  className="h-6 text-xs"
                  autoFocus
                  onBlur={saveCliqueName}
                  onKeyDown={(e) => e.key === 'Enter' && saveCliqueName()}
                />
              </div>
            ) : (
              <CardTitle 
                className="text-xs font-medium flex items-center gap-1 cursor-pointer hover:text-primary"
                onClick={() => handleRenameClique(clique.id)}
              >
                {clique.name}
                <Pencil className="h-2.5 w-2.5 opacity-50" />
              </CardTitle>
            )}
            <Badge 
              variant={clique.members.length > targetCliqueSize ? 'destructive' : 'secondary'}
              className="text-xs h-5"
            >
              {clique.members.length}/{targetCliqueSize}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-1 min-h-[100px]">
            {clique.members.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isDragging={draggedUser?.id === user.id}
              />
            ))}
            {emptySlots > 0 && Array.from({ length: emptySlots }).map((_, i) => (
              <EmptySlot key={`empty-${i}`} index={i} />
            ))}
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-6xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Clique Builder — {instanceTitle}
            </DialogTitle>
            <DialogDescription>
              Drag and drop users into cliques. Click names to view profiles.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden px-6">
            <ScrollArea className="h-[65vh]">
              <div className="grid grid-cols-4 gap-3 pr-4">
                {/* 8-clique grid */}
                {cliques.map((clique, index) => (
                  <CliqueGroup key={clique.id} clique={clique} index={index} />
                ))}
              </div>

              {/* Add more cliques button */}
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={handleAddClique}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Clique
                </Button>
              </div>

              {/* Unassigned pool */}
              {unassigned.length > 0 && (
                <Card 
                  className={`mt-4 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 ${
                    dragOverTarget === 'unassigned' ? 'ring-2 ring-primary' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, 'unassigned')}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop('unassigned')}
                >
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      Unassigned ({unassigned.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="flex flex-wrap gap-2">
                      {unassigned.map((user) => (
                        <div
                          key={user.id}
                          draggable
                          onDragStart={() => handleDragStart(user)}
                          onClick={() => setSelectedUser(user)}
                          className="flex items-center gap-1 px-2 py-1 rounded border bg-card cursor-move hover:border-primary/50 text-sm"
                        >
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                          <span>{user.display_name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </ScrollArea>
          </div>

          <DialogFooter className="flex items-center justify-between border-t px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {hasChanges && (
                <>
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <span>Unsaved changes</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Profile Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </SheetTitle>
            <SheetDescription>
              View participant details
            </SheetDescription>
          </SheetHeader>
          
          {selectedUser && (
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{selectedUser.display_name}</h3>
                {selectedUser.email && (
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline">{selectedUser.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Clique</span>
                  <span className="text-sm">
                    {selectedUser.clique_id 
                      ? cliques.find(c => c.id === selectedUser.clique_id)?.name || 'Assigned'
                      : 'Unassigned'
                    }
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    View Full Profile
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
