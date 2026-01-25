/**
 * Quest Archives Manager - View cancelled, revoked, and archived quests
 * Shows archival reasons and status timeline
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Archive, 
  XCircle, 
  AlertTriangle, 
  Calendar,
  ChevronRight,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { QuestArchiveDetailDrawer } from './QuestArchiveDetailDrawer';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;

type ArchiveFilter = 'all' | 'cancelled' | 'revoked' | 'paused';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: <XCircle className="h-4 w-4" /> },
  revoked: { label: 'Revoked', color: 'bg-red-200 text-red-800', icon: <AlertTriangle className="h-4 w-4" /> },
  paused: { label: 'Paused', color: 'bg-orange-100 text-orange-700', icon: <Archive className="h-4 w-4" /> },
};

export function QuestArchivesManager() {
  const [filter, setFilter] = useState<ArchiveFilter>('all');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch archived quests
  const { data: archivedQuests, isLoading, refetch } = useQuery({
    queryKey: ['archived-quests', filter],
    queryFn: async () => {
      let query = supabase
        .from('quests')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filter === 'all') {
        query = query.in('status', ['cancelled', 'revoked', 'paused']);
      } else {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Quest[];
    },
  });

  // Fetch signup counts for archived quests
  const { data: signupCounts } = useQuery({
    queryKey: ['archived-quest-signups', archivedQuests?.map(q => q.id)],
    queryFn: async () => {
      if (!archivedQuests?.length) return {};

      const questIds = archivedQuests.map(q => q.id);
      const { data } = await supabase
        .from('quest_signups')
        .select('quest_id')
        .in('quest_id', questIds);

      const counts: Record<string, number> = {};
      (data || []).forEach(s => {
        counts[s.quest_id] = (counts[s.quest_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!archivedQuests?.length,
  });

  const handleOpenDrawer = (quest: Quest) => {
    setSelectedQuest(quest);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedQuest(null);
  };

  const getReasonText = (quest: Quest) => {
    if (quest.status === 'revoked' && quest.revoked_reason) {
      return quest.revoked_reason;
    }
    if (quest.status === 'paused' && quest.paused_reason) {
      return quest.paused_reason;
    }
    return 'No reason provided';
  };

  const counts = {
    all: archivedQuests?.length || 0,
    cancelled: archivedQuests?.filter(q => q.status === 'cancelled').length || 0,
    revoked: archivedQuests?.filter(q => q.status === 'revoked').length || 0,
    paused: archivedQuests?.filter(q => q.status === 'paused').length || 0,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Quest Archives
            </CardTitle>
            <Badge variant="outline" className="text-muted-foreground">
              {counts.all} archived quests
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as ArchiveFilter)} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({counts.cancelled})</TabsTrigger>
              <TabsTrigger value="revoked">Revoked ({counts.revoked})</TabsTrigger>
              <TabsTrigger value="paused">Paused ({counts.paused})</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : archivedQuests?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No archived quests found</p>
              <p className="text-sm mt-1">
                Cancelled, revoked, or paused quests will appear here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Signups</TableHead>
                  <TableHead>Archived</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedQuests?.map((quest) => {
                  const statusConfig = STATUS_CONFIG[quest.status || 'cancelled'];
                  return (
                    <TableRow 
                      key={quest.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleOpenDrawer(quest)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{quest.icon}</span>
                          <div>
                            <p className="font-medium">{quest.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {quest.progression_tree && `${quest.progression_tree} path`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig?.color || 'bg-gray-100'}>
                          <span className="flex items-center gap-1">
                            {statusConfig?.icon}
                            {statusConfig?.label || quest.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground max-w-xs truncate">
                          {getReasonText(quest)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {signupCounts?.[quest.id] || 0} signups
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {quest.updated_at && format(new Date(quest.updated_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Archive Detail Drawer */}
      <QuestArchiveDetailDrawer
        quest={selectedQuest}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onRestore={() => {
          refetch();
          handleCloseDrawer();
        }}
      />
    </div>
  );
}
