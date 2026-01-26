/**
 * EnterpriseCliquesTab - Manage cliques/squads across the platform
 * 
 * Features:
 * - List all cliques with filtering
 * - Archive/delete cliques
 * - View clique details
 * - Remove members from cliques
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Search, 
  Trash2, 
  Archive,
  Eye,
  MessageCircle,
  Calendar,
  Loader2,
  UserMinus
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Clique {
  id: string;
  name: string;
  theme_tags: string[] | null;
  commitment_style: string | null;
  archived_at: string | null;
  created_at: string;
  member_count?: number;
  message_count?: number;
}

interface CliqueMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  added_at: string;
  profile: {
    display_name: string | null;
  } | null;
}

export function EnterpriseCliquesTab() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedClique, setSelectedClique] = useState<Clique | null>(null);
  const [cliqueMembers, setCliqueMembers] = useState<CliqueMember[]>([]);

  // Fetch cliques
  const { data: cliques, isLoading } = useQuery({
    queryKey: ['enterprise-cliques', showArchived],
    queryFn: async () => {
      let query = supabase
        .from('squads')
        .select('id, name, theme_tags, commitment_style, archived_at, created_at')
        .order('created_at', { ascending: false });

      if (!showArchived) {
        query = query.is('archived_at', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get member and message counts
      const cliquesWithCounts = await Promise.all(
        (data || []).map(async (clique) => {
          const { count: memberCount } = await supabase
            .from('squad_members')
            .select('*', { count: 'exact', head: true })
            .eq('persistent_squad_id', clique.id)
            .eq('status', 'active');

          const { count: messageCount } = await supabase
            .from('squad_chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('squad_id', clique.id);

          return {
            ...clique,
            member_count: memberCount || 0,
            message_count: messageCount || 0,
          };
        })
      );

      return cliquesWithCounts as Clique[];
    },
  });

  // Archive clique mutation
  const archiveCliqueMutation = useMutation({
    mutationFn: async ({ cliqueId, archive }: { cliqueId: string; archive: boolean }) => {
      const { error } = await supabase
        .from('squads')
        .update({ archived_at: archive ? new Date().toISOString() : null })
        .eq('id', cliqueId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-cliques'] });
      toast.success(variables.archive ? 'Clique archived' : 'Clique reactivated');
    },
    onError: (error) => {
      toast.error('Failed to update clique: ' + error.message);
    },
  });

  // Delete clique mutation
  const deleteCliqueMutation = useMutation({
    mutationFn: async (cliqueId: string) => {
      const { data, error } = await supabase.rpc('delete_clique', { p_clique_id: cliqueId });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete clique');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-cliques'] });
      setShowDeleteModal(false);
      setSelectedClique(null);
      toast.success('Clique deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete clique: ' + error.message);
    },
  });

  // Fetch clique members
  const fetchCliqueMembers = async (cliqueId: string) => {
    const { data, error } = await supabase
      .from('squad_members')
      .select(`
        id,
        user_id,
        role,
        status,
        added_at
      `)
      .eq('persistent_squad_id', cliqueId)
      .order('added_at');

    if (error) {
      toast.error('Failed to fetch members');
      return;
    }

    // Get profile info separately
    const memberIds = (data || []).map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', memberIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    setCliqueMembers((data || []).map(m => ({
      ...m,
      profile: profileMap.get(m.user_id) || null,
    })) as CliqueMember[]);
    setShowMembersModal(true);
  };

  // Remove member from clique
  const removeMemberMutation = useMutation({
    mutationFn: async ({ memberId }: { memberId: string }) => {
      const { error } = await supabase
        .from('squad_members')
        .update({ status: 'removed' })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-cliques'] });
      if (selectedClique) {
        fetchCliqueMembers(selectedClique.id);
      }
      toast.success('Member removed from clique');
    },
    onError: (error) => {
      toast.error('Failed to remove member: ' + error.message);
    },
  });

  const filteredCliques = cliques?.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Cliques Management</h2>
          <p className="text-muted-foreground text-sm">
            View and manage all cliques/squads on the platform
          </p>
        </div>
        <Button
          variant={showArchived ? 'secondary' : 'outline'}
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive className="h-4 w-4 mr-2" />
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cliques..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Cliques Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCliques.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No Cliques Found</h3>
              <p className="text-muted-foreground text-sm">
                {showArchived ? 'No cliques match your search' : 'No active cliques found'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clique</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Style</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCliques.map((clique) => (
                    <TableRow key={clique.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{clique.name}</p>
                            {clique.theme_tags && clique.theme_tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {clique.theme_tags.slice(0, 2).map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {clique.member_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          {clique.message_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        {clique.commitment_style ? (
                          <Badge variant="outline" className="capitalize">
                            {clique.commitment_style}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {clique.archived_at ? (
                          <Badge variant="secondary">
                            <Archive className="h-3 w-3 mr-1" />
                            Archived
                          </Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(clique.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedClique(clique);
                              fetchCliqueMembers(clique.id);
                            }}
                            title="View Members"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => archiveCliqueMutation.mutate({
                              cliqueId: clique.id,
                              archive: !clique.archived_at
                            })}
                            title={clique.archived_at ? 'Reactivate' : 'Archive'}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedClique(clique);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Clique"
                            disabled={clique.member_count! > 0}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clique</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{selectedClique?.name}</strong>?
              This will remove all messages, polls, and other data. This action cannot be undone.
              {selectedClique?.member_count! > 0 && (
                <p className="mt-2 text-amber-600">
                  Note: This clique has {selectedClique?.member_count} active members. 
                  Remove all members first before deleting.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedClique && deleteCliqueMutation.mutate(selectedClique.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={selectedClique?.member_count! > 0}
            >
              Delete Clique
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Members Modal */}
      <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Clique Members - {selectedClique?.name}</DialogTitle>
            <DialogDescription>
              Manage members of this clique
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            {cliqueMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No members in this clique
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cliqueMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.profile?.display_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'leader' ? 'default' : 'outline'} className="capitalize">
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'active' ? 'secondary' : 'outline'} className="capitalize">
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.added_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMemberMutation.mutate({ memberId: member.id })}
                          title="Remove from Clique"
                          disabled={member.status !== 'active'}
                        >
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
