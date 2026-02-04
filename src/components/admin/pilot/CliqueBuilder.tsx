/**
 * Clique Builder
 * 
 * Drag-and-drop interface for manually assigning users to cliques.
 * Click on users to see their profile details.
 */

import { useState, useCallback } from 'react';
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
  Check, Loader2, UserPlus, AlertCircle, User, X
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
}

interface CliqueBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  instanceTitle: string;
  targetCliqueSize: number;
}

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
  const [isNewCliqueDialogOpen, setIsNewCliqueDialogOpen] = useState(false);
  const [newCliqueName, setNewCliqueName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DragUser | null>(null);

  // Fetch current state
  const { isLoading } = useQuery({
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

      // Fetch squad_members to know who is in which clique
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

      // Build clique structure
      const cliqueMap = new Map<string, DragClique>();
      for (const clique of cliqueData || []) {
        cliqueMap.set(clique.id, {
          id: clique.id,
          name: clique.squad_name || `Clique ${clique.id.slice(0, 4)}`,
          members: [],
        });
      }

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

        if (userCliqueId && cliqueMap.has(userCliqueId)) {
          cliqueMap.get(userCliqueId)!.members.push(user);
        } else {
          unassignedUsers.push(user);
        }
      }

      setCliques(Array.from(cliqueMap.values()));
      setUnassigned(unassignedUsers);
      setHasChanges(false);

      return { cliques: cliqueMap, unassigned: unassignedUsers };
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

  // Create new clique
  const handleCreateClique = async () => {
    if (!newCliqueName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('quest_squads')
        .insert({
          instance_id: instanceId,
          squad_name: newCliqueName.trim(),
        } as any)
        .select()
        .single();

      if (error) throw error;

      setCliques(prev => [...prev, {
        id: data.id,
        name: data.squad_name || newCliqueName.trim(),
        members: [],
      }]);

      setNewCliqueName('');
      setIsNewCliqueDialogOpen(false);
      setHasChanges(true);
      toast({ title: 'Clique created' });
    } catch (err: any) {
      toast({ title: 'Failed to create clique', description: err.message, variant: 'destructive' });
    }
  };

  // Delete empty clique
  const handleDeleteClique = async (cliqueId: string) => {
    const clique = cliques.find(c => c.id === cliqueId);
    if (!clique || clique.members.length > 0) {
      toast({ title: 'Cannot delete clique with members', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('quest_squads')
        .delete()
        .eq('id', cliqueId);

      if (error) throw error;

      setCliques(prev => prev.filter(c => c.id !== cliqueId));
      setHasChanges(true);
      toast({ title: 'Clique deleted' });
    } catch (err: any) {
      toast({ title: 'Failed to delete clique', description: err.message, variant: 'destructive' });
    }
  };

  // Save all changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get all user ids
      const allUserIds = [
        ...cliques.flatMap(c => c.members.map(m => m.user_id)),
        ...unassigned.map(u => u.user_id),
      ];

      // Get clique IDs for this instance
      const cliqueIds = cliques.map(c => c.id);

      // Delete existing memberships for users in these cliques
      if (cliqueIds.length > 0) {
        await supabase
          .from('squad_members')
          .delete()
          .in('squad_id', cliqueIds);
      }

      // Insert new memberships
      for (const clique of cliques) {
        for (const member of clique.members) {
          await supabase
            .from('squad_members')
            .insert({
              squad_id: clique.id,
              user_id: member.user_id,
            });
        }
      }

      await auditLog({
        action: 'manual_clique_assignment',
        targetTable: 'quest_instances',
        targetId: instanceId,
        newValues: {
          clique_count: cliques.length,
          total_assigned: cliques.reduce((sum, c) => sum + c.members.length, 0),
          unassigned_count: unassigned.length,
        },
      });

      toast({ title: 'Clique assignments saved!' });
      setHasChanges(false);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Failed to save', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // User card component with click-to-view profile
  const UserCard = ({ user, isDragging }: { user: DragUser; isDragging?: boolean }) => (
    <div
      draggable
      onDragStart={() => handleDragStart(user)}
      onClick={() => setSelectedUser(user)}
      className={`flex items-center gap-2 p-2 rounded-md border bg-card cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:border-primary/50 hover:bg-accent/50'
      }`}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
    const isOverfilled = showTargetSize && users.length > targetCliqueSize;
    const isUnderfilled = showTargetSize && users.length > 0 && users.length < targetCliqueSize;
    const emptySlots = showTargetSize ? Math.max(0, targetCliqueSize - users.length) : 0;

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
                {users.length}{showTargetSize && `/${targetCliqueSize}`}
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
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isDragging={draggedUser?.id === user.id}
              />
            ))}
            
            {/* Empty slots */}
            {showTargetSize && emptySlots > 0 && (
              <>
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <div 
                    key={`empty-${i}`}
                    className="flex items-center gap-2 p-2 rounded-md border border-dashed border-muted-foreground/30 text-muted-foreground text-sm"
                  >
                    <User className="h-4 w-4" />
                    <span>Empty slot</span>
                  </div>
                ))}
              </>
            )}
            
            {users.length === 0 && !showTargetSize && (
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Clique Builder
            </DialogTitle>
            <DialogDescription>
              Drag and drop users between cliques. Click on a user to view their profile.
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

                {/* Cliques */}
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Cliques ({cliques.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextNum = cliques.length + 1;
                        setNewCliqueName(`${instanceTitle} Clique ${nextNum}`);
                        setIsNewCliqueDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Clique
                    </Button>
                  </div>

                  {cliques.length > 0 ? (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {cliques.map((clique) => (
                        <DropZone
                          key={clique.id}
                          id={clique.id}
                          title={clique.name}
                          users={clique.members}
                          onDelete={() => handleDeleteClique(clique.id)}
                          showTargetSize
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center">
                        <UserPlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No cliques yet. Create one to start assigning users.
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

      {/* New Clique Dialog */}
      <Dialog open={isNewCliqueDialogOpen} onOpenChange={setIsNewCliqueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Clique</DialogTitle>
            <DialogDescription>
              Enter a name for the new clique.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-clique-name">Clique Name</Label>
              <Input
                id="new-clique-name"
                value={newCliqueName}
                onChange={(e) => setNewCliqueName(e.target.value)}
                placeholder="e.g., Party at Moontower Clique 1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCliqueDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateClique} disabled={!newCliqueName.trim()}>
              Create
            </Button>
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
              View participant details and constraints
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
