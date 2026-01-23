/**
 * =============================================================================
 * SQUADS DIRECTORY - Admin browser for all squads with filtering and export
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, Search, Download, Lock, Star, MessageSquare,
  Calendar, Filter, RefreshCw
} from 'lucide-react';
import { SquadDetailDrawer } from './SquadDetailDrawer';
import { SquadExportModal } from './SquadExportModal';

interface SquadRow {
  id: string;
  squad_name: string;
  status: string;
  locked_at: string | null;
  created_at: string;
  quest_id: string;
  quest_title: string;
  scheduled_date: string | null;
  member_count: number;
  avg_rating: number | null;
  feedback_count: number;
}

export function SquadsDirectory() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);
  const [selectedSquads, setSelectedSquads] = useState<Set<string>>(new Set());
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Fetch all squads with aggregated data
  const { data: squads, isLoading, refetch } = useQuery({
    queryKey: ['squads-directory', statusFilter, dateFilter],
    queryFn: async () => {
      // Get all squads
      const { data: squadsData, error: squadsError } = await supabase
        .from('quest_squads')
        .select('id, squad_name, status, locked_at, created_at, quest_id')
        .order('created_at', { ascending: false });

      if (squadsError) throw squadsError;
      if (!squadsData?.length) return [];

      // Get quest/instance info for each squad
      const questIds = [...new Set(squadsData.map(s => s.quest_id).filter(Boolean))];
      
      // Try quest_instances first (for pilot quests)
      const { data: instances } = await supabase
        .from('quest_instances')
        .select('id, title, scheduled_date')
        .in('id', questIds);
      
      // Also try quests table
      const { data: quests } = await supabase
        .from('quests')
        .select('id, title, start_datetime')
        .in('id', questIds);
      
      // Build quest lookup
      const questLookup: Record<string, { title: string; date: string | null }> = {};
      instances?.forEach(i => {
        questLookup[i.id] = { title: i.title || 'Unknown', date: i.scheduled_date };
      });
      quests?.forEach(q => {
        if (!questLookup[q.id]) {
          questLookup[q.id] = { title: q.title || 'Unknown', date: q.start_datetime };
        }
      });

      // Get member counts
      const squadIds = squadsData.map(s => s.id);
      const { data: memberCounts } = await supabase
        .from('squad_members')
        .select('squad_id')
        .in('squad_id', squadIds);

      // Get feedback (linked by quest_id, not squad_id)
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('quest_id, rating_1_5, testimonial_text, is_testimonial_approved')
        .in('quest_id', questIds);

      // Aggregate member counts
      const memberCountMap = (memberCounts || []).reduce((acc, m) => {
        acc[m.squad_id] = (acc[m.squad_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Aggregate feedback by quest_id (split evenly among squads for that quest)
      const feedbackByQuest = (feedbackData || []).reduce((acc, f) => {
        if (!acc[f.quest_id]) {
          acc[f.quest_id] = { ratings: [], count: 0 };
        }
        if (f.rating_1_5) acc[f.quest_id].ratings.push(f.rating_1_5);
        acc[f.quest_id].count++;
        return acc;
      }, {} as Record<string, { ratings: number[]; count: number }>);

      return squadsData.map(squad => {
        const questInfo = questLookup[squad.quest_id] || { title: 'Unknown Quest', date: null };
        const questFeedback = feedbackByQuest[squad.quest_id] || { ratings: [], count: 0 };
        const avgRating = questFeedback.ratings.length > 0
          ? questFeedback.ratings.reduce((a, b) => a + b, 0) / questFeedback.ratings.length
          : null;

        return {
          id: squad.id,
          squad_name: squad.squad_name || 'Unnamed Squad',
          status: squad.status,
          locked_at: squad.locked_at,
          created_at: squad.created_at,
          quest_id: squad.quest_id,
          quest_title: questInfo.title,
          scheduled_date: questInfo.date,
          member_count: memberCountMap[squad.id] || 0,
          avg_rating: avgRating,
          feedback_count: questFeedback.count,
        } as SquadRow;
      });
    },
  });

  // Filter squads
  const filteredSquads = squads?.filter(squad => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      if (!squad.squad_name.toLowerCase().includes(searchLower) &&
          !squad.quest_title.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'locked' && !squad.locked_at) return false;
      if (statusFilter === 'active' && squad.locked_at) return false;
      if (statusFilter === 'forming' && squad.status !== 'forming') return false;
      if (statusFilter === 'confirmed' && squad.status !== 'confirmed') return false;
    }

    // Date filter
    if (dateFilter !== 'all' && squad.scheduled_date) {
      const date = new Date(squad.scheduled_date);
      const now = new Date();
      if (dateFilter === 'upcoming' && date < now) return false;
      if (dateFilter === 'past' && date >= now) return false;
      if (dateFilter === 'this-week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (date < weekAgo || date > weekAhead) return false;
      }
    }

    return true;
  }) || [];

  const toggleSquadSelection = (squadId: string) => {
    const newSelected = new Set(selectedSquads);
    if (newSelected.has(squadId)) {
      newSelected.delete(squadId);
    } else {
      newSelected.add(squadId);
    }
    setSelectedSquads(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedSquads.size === filteredSquads.length) {
      setSelectedSquads(new Set());
    } else {
      setSelectedSquads(new Set(filteredSquads.map(s => s.id)));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Squad Directory
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button
                variant="default"
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
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search squads or quests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="forming">Forming</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{filteredSquads.length}</p>
              <p className="text-xs text-muted-foreground">Total Squads</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">
                {filteredSquads.reduce((sum, s) => sum + s.member_count, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Members</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">
                {filteredSquads.filter(s => s.avg_rating).length > 0
                  ? (filteredSquads.filter(s => s.avg_rating).reduce((sum, s) => sum + (s.avg_rating || 0), 0) /
                     filteredSquads.filter(s => s.avg_rating).length).toFixed(1)
                  : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">
                {filteredSquads.reduce((sum, s) => sum + s.feedback_count, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Feedback Entries</p>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedSquads.size === filteredSquads.length && filteredSquads.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Squad Name</TableHead>
                  <TableHead>Quest</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Members</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  <TableHead className="text-center">Feedback</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading squads...
                    </TableCell>
                  </TableRow>
                ) : filteredSquads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No squads found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSquads.map((squad) => (
                    <TableRow
                      key={squad.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedSquadId(squad.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedSquads.has(squad.id)}
                          onCheckedChange={() => toggleSquadSelection(squad.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {squad.squad_name}
                          {squad.locked_at && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {squad.quest_title}
                      </TableCell>
                      <TableCell>
                        {squad.scheduled_date
                          ? format(new Date(squad.scheduled_date), 'MMM d, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{squad.member_count}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {squad.avg_rating ? (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {squad.avg_rating.toFixed(1)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {squad.feedback_count > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {squad.feedback_count}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={squad.status === 'confirmed' ? 'default' : 'secondary'}
                        >
                          {squad.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <SquadDetailDrawer
        squadId={selectedSquadId}
        onClose={() => setSelectedSquadId(null)}
      />

      {/* Export Modal */}
      <SquadExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        squadIds={Array.from(selectedSquads)}
      />
    </div>
  );
}
