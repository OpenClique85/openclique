/**
 * =============================================================================
 * SQUAD ARCHIVAL MANAGER - Automated archival system with exportable reports
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import {
  Archive,
  Download,
  Clock,
  Search,
  RefreshCw,
  CheckCircle2,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  Play,
  Undo2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ArchivedSquad {
  id: string;
  squadName: string;
  questTitle: string;
  scheduledDate: string | null;
  memberCount: number;
  archivedAt: string;
  archivedReason: string;
  daysOld: number;
}

interface PendingArchival {
  id: string;
  squadName: string;
  questTitle: string;
  scheduledDate: string | null;
  memberCount: number;
  completedAt: string;
  daysUntilArchive: number;
}

export function SquadArchivalManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedSquads, setSelectedSquads] = useState<Set<string>>(new Set());
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [squadToRestore, setSquadToRestore] = useState<string | null>(null);

  // Fetch archived squads
  const { data: archivedData, isLoading: loadingArchived, refetch: refetchArchived } = useQuery({
    queryKey: ['archived-squads'],
    queryFn: async () => {
      const { data: squads, error } = await supabase
        .from('quest_squads')
        .select('id, squad_name, quest_id, archived_at, archived_reason, created_at')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (error) throw error;
      if (!squads?.length) return [];

      // Get quest info
      const questIds = [...new Set(squads.map(s => s.quest_id).filter(Boolean))];
      const { data: instances } = await supabase
        .from('quest_instances')
        .select('id, title, scheduled_date')
        .in('id', questIds);

      const questLookup: Record<string, { title: string; date: string | null }> = {};
      instances?.forEach(i => {
        questLookup[i.id] = { title: i.title || 'Unknown', date: i.scheduled_date };
      });

      // Get member counts
      const squadIds = squads.map(s => s.id);
      const { data: members } = await supabase
        .from('squad_members')
        .select('squad_id')
        .in('squad_id', squadIds);

      const memberCounts = (members || []).reduce((acc, m) => {
        acc[m.squad_id] = (acc[m.squad_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return squads.map(squad => {
        const questInfo = questLookup[squad.quest_id] || { title: 'Unknown', date: null };
        return {
          id: squad.id,
          squadName: squad.squad_name || 'Unnamed Squad',
          questTitle: questInfo.title,
          scheduledDate: questInfo.date,
          memberCount: memberCounts[squad.id] || 0,
          archivedAt: squad.archived_at,
          archivedReason: squad.archived_reason || 'manual',
          daysOld: differenceInDays(new Date(), new Date(squad.created_at)),
        } as ArchivedSquad;
      });
    },
  });

  // Fetch pending archival (completed squads older than 20 days)
  const { data: pendingData, isLoading: loadingPending, refetch: refetchPending } = useQuery({
    queryKey: ['pending-archival-squads'],
    queryFn: async () => {
      // Get completed instances with squads
      const { data: instances } = await supabase
        .from('quest_instances')
        .select('id, title, scheduled_date, status, updated_at')
        .eq('status', 'completed');

      if (!instances?.length) return [];

      const instanceIds = instances.map(i => i.id);

      // Get squads for these instances that aren't archived
      const { data: squads, error } = await supabase
        .from('quest_squads')
        .select('id, squad_name, quest_id, created_at, status')
        .in('quest_id', instanceIds)
        .is('archived_at', null)
        .eq('status', 'confirmed');

      if (error) throw error;
      if (!squads?.length) return [];

      // Get member counts
      const squadIds = squads.map(s => s.id);
      const { data: members } = await supabase
        .from('squad_members')
        .select('squad_id')
        .in('squad_id', squadIds);

      const memberCounts = (members || []).reduce((acc, m) => {
        acc[m.squad_id] = (acc[m.squad_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const instanceLookup = instances.reduce((acc, i) => {
        acc[i.id] = i;
        return acc;
      }, {} as Record<string, typeof instances[0]>);

      return squads
        .map(squad => {
          const instance = instanceLookup[squad.quest_id];
          if (!instance) return null;

          const daysSinceCompletion = differenceInDays(new Date(), new Date(instance.updated_at));
          const daysUntilArchive = Math.max(0, 30 - daysSinceCompletion);

          return {
            id: squad.id,
            squadName: squad.squad_name || 'Unnamed Squad',
            questTitle: instance.title || 'Unknown',
            scheduledDate: instance.scheduled_date,
            memberCount: memberCounts[squad.id] || 0,
            completedAt: instance.updated_at,
            daysUntilArchive,
          } as PendingArchival;
        })
        .filter(Boolean)
        .sort((a, b) => a!.daysUntilArchive - b!.daysUntilArchive) as PendingArchival[];
    },
  });

  // Manual archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (squadIds: string[]) => {
      const { error } = await supabase
        .from('quest_squads')
        .update({
          archived_at: new Date().toISOString(),
          archived_reason: 'manual',
        })
        .in('id', squadIds);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Squads archived successfully');
      queryClient.invalidateQueries({ queryKey: ['archived-squads'] });
      queryClient.invalidateQueries({ queryKey: ['pending-archival-squads'] });
      setSelectedSquads(new Set());
      setConfirmArchiveOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to archive squads');
      console.error(error);
    },
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (squadId: string) => {
      const { error } = await supabase
        .from('quest_squads')
        .update({
          archived_at: null,
          archived_reason: null,
        })
        .eq('id', squadId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Squad restored successfully');
      queryClient.invalidateQueries({ queryKey: ['archived-squads'] });
      queryClient.invalidateQueries({ queryKey: ['pending-archival-squads'] });
      setSquadToRestore(null);
      setRestoreConfirmOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to restore squad');
      console.error(error);
    },
  });

  // Run auto-archive function
  const autoArchiveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('auto_archive_squads');
      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      toast.success(`Archived ${count} squad(s)`);
      queryClient.invalidateQueries({ queryKey: ['archived-squads'] });
      queryClient.invalidateQueries({ queryKey: ['pending-archival-squads'] });
    },
    onError: (error) => {
      toast.error('Failed to run auto-archive');
      console.error(error);
    },
  });

  // Export archived squad data
  const handleExport = async (exportFormat: 'json' | 'csv') => {
    const squadIds = Array.from(selectedSquads);
    if (squadIds.length === 0) {
      toast.error('Select squads to export');
      return;
    }

    try {
      // Get full squad data
      const { data: squads } = await supabase
        .from('quest_squads')
        .select('*')
        .in('id', squadIds);

      const questIds = [...new Set(squads?.map(s => s.quest_id).filter(Boolean) || [])];

      // Get quest info
      const { data: instances } = await supabase
        .from('quest_instances')
        .select('*')
        .in('id', questIds);

      // Get members
      const { data: members } = await supabase
        .from('squad_members')
        .select('squad_id, user_id, role, added_at')
        .in('squad_id', squadIds);

      // Get member profiles
      const memberUserIds = [...new Set((members || []).map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', memberUserIds);

      const profileLookup = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, { id: string; display_name: string }>);

      // Get feedback
      const { data: feedback } = await supabase
        .from('feedback')
        .select('*')
        .in('quest_id', questIds);

      // Build export data
      const exportData = squads?.map(squad => {
        const instance = instances?.find(i => i.id === squad.quest_id);
        const squadMembers = (members || []).filter(m => m.squad_id === squad.id);
        const questFeedback = (feedback || []).filter(f => f.quest_id === squad.quest_id);

        return {
          squad: {
            id: squad.id,
            name: squad.squad_name,
            status: squad.status,
            formation_reason: squad.formation_reason,
            compatibility_score: squad.compatibility_score,
            referral_bonds: squad.referral_bonds,
            archived_at: squad.archived_at,
            archived_reason: squad.archived_reason,
          },
          quest: instance ? {
            id: instance.id,
            title: instance.title,
            scheduled_date: instance.scheduled_date,
            status: instance.status,
          } : null,
          members: squadMembers.map(m => ({
            user_id: m.user_id,
            display_name: profileLookup[m.user_id]?.display_name || 'Unknown',
            role: m.role,
            added_at: m.added_at,
          })),
          feedback_summary: {
            total_responses: questFeedback.length,
            avg_rating: questFeedback.length > 0
              ? questFeedback.reduce((sum, f) => sum + (f.rating_1_5 || 0), 0) / questFeedback.length
              : null,
            would_do_again_pct: questFeedback.filter(f => f.would_do_again !== null).length > 0
              ? (questFeedback.filter(f => f.would_do_again).length / 
                 questFeedback.filter(f => f.would_do_again !== null).length) * 100
              : null,
          },
        };
      });

      // Generate file
      let content: string;
      let filename: string;
      let mimeType: string;

      if (exportFormat === 'json') {
        content = JSON.stringify(exportData, null, 2);
        filename = `squad-archive-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
        mimeType = 'application/json';
      } else {
        // CSV format - flatten the data
        const rows: string[] = [];
        rows.push('Squad ID,Squad Name,Quest Title,Quest Date,Members,Avg Rating,Would Repeat %,Archived At,Archive Reason');
        
        exportData?.forEach(item => {
          rows.push([
            item.squad.id,
            `"${item.squad.name}"`,
            `"${item.quest?.title || 'Unknown'}"`,
            item.quest?.scheduled_date || '',
            item.members.length,
            item.feedback_summary.avg_rating?.toFixed(1) || '',
            item.feedback_summary.would_do_again_pct?.toFixed(0) || '',
            item.squad.archived_at || '',
            item.squad.archived_reason || '',
          ].join(','));
        });

        content = rows.join('\n');
        filename = `squad-archive-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        mimeType = 'text/csv';
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Save export record
      await supabase.from('squad_archive_reports').insert({
        squad_id: squadIds[0], // Just reference first squad
        created_by: user?.id,
        report_data: exportData as any,
        export_format: exportFormat,
      });

      toast.success(`Exported ${squadIds.length} squad(s) as ${exportFormat.toUpperCase()}`);
      setExportModalOpen(false);
      setSelectedSquads(new Set());
    } catch (error) {
      toast.error('Export failed');
      console.error(error);
    }
  };

  const filteredArchived = archivedData?.filter(squad =>
    search ? squad.squadName.toLowerCase().includes(search.toLowerCase()) ||
             squad.questTitle.toLowerCase().includes(search.toLowerCase())
    : true
  ) || [];

  const toggleSelectSquad = (squadId: string) => {
    const newSelected = new Set(selectedSquads);
    if (newSelected.has(squadId)) {
      newSelected.delete(squadId);
    } else {
      newSelected.add(squadId);
    }
    setSelectedSquads(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedSquads.size === filteredArchived.length) {
      setSelectedSquads(new Set());
    } else {
      setSelectedSquads(new Set(filteredArchived.map(s => s.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Archival Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Auto-Archive
              </CardTitle>
              <CardDescription>
                Completed squads will be automatically archived after 30 days
              </CardDescription>
            </div>
            <Button
              onClick={() => autoArchiveMutation.mutate()}
              disabled={autoArchiveMutation.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              Run Now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPending ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !pendingData?.length ? (
            <p className="text-muted-foreground text-center py-8">
              No squads pending archival
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Squad</TableHead>
                  <TableHead>Quest</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="text-right">Archive In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingData.slice(0, 10).map((squad) => (
                  <TableRow key={squad.id}>
                    <TableCell className="font-medium">{squad.squadName}</TableCell>
                    <TableCell className="text-muted-foreground">{squad.questTitle}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{squad.memberCount}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(squad.completedAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      {squad.daysUntilArchive === 0 ? (
                        <Badge variant="destructive">Today</Badge>
                      ) : (
                        <Badge variant="outline">{squad.daysUntilArchive} days</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Archived Squads Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Archived Squads
              </CardTitle>
              <CardDescription>
                Historical squad records available for export and analysis
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchArchived();
                  refetchPending();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setExportModalOpen(true)}
                disabled={selectedSquads.size === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export ({selectedSquads.size})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search archived squads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loadingArchived ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !filteredArchived.length ? (
            <p className="text-muted-foreground text-center py-8">
              No archived squads found
            </p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedSquads.size === filteredArchived.length && filteredArchived.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Squad</TableHead>
                    <TableHead>Quest</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Archived</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArchived.map((squad) => (
                    <TableRow key={squad.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSquads.has(squad.id)}
                          onCheckedChange={() => toggleSelectSquad(squad.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{squad.squadName}</TableCell>
                      <TableCell className="text-muted-foreground">{squad.questTitle}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{squad.memberCount}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(squad.archivedAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={squad.archivedReason === 'auto_30_day' ? 'outline' : 'secondary'}>
                          {squad.archivedReason === 'auto_30_day' ? 'Auto' : 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSquadToRestore(squad.id);
                            setRestoreConfirmOpen(true);
                          }}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Archived Squads</DialogTitle>
            <DialogDescription>
              Export {selectedSquads.size} squad(s) with full member profiles, feedback, and formation data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex-col"
              onClick={() => handleExport('json')}
            >
              <FileJson className="h-8 w-8 mb-2" />
              <span>JSON</span>
              <span className="text-xs text-muted-foreground">Full structured data</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col"
              onClick={() => handleExport('csv')}
            >
              <FileSpreadsheet className="h-8 w-8 mb-2" />
              <span>CSV</span>
              <span className="text-xs text-muted-foreground">Spreadsheet format</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <AlertDialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Squad?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the squad from the archive and make it visible in the active squad directory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => squadToRestore && restoreMutation.mutate(squadToRestore)}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
