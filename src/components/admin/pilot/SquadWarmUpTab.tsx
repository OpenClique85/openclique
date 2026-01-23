/**
 * Squad Warm-Up Tab
 * 
 * Admin tab for viewing all squads' warm-up status and reviewing individual squads.
 * Integrates with SquadWarmUpReview for detailed squad inspection and approval.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  Loader2,
  ThermometerSun,
  AlertOctagon
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SquadWarmUpReview } from './SquadWarmUpReview';
import { 
  SQUAD_STATUS_LABELS, 
  SQUAD_STATUS_STYLES, 
  type SquadStatus 
} from '@/lib/squadLifecycle';
import { format } from 'date-fns';

interface SquadWarmUpTabProps {
  instanceId: string;
}

interface SquadSummary {
  id: string;
  name: string;
  status: SquadStatus;
  memberCount: number;
  readyCount: number;
  progressPct: number;
  lastActivity: string | null;
  warmingUpSince: string | null;
  isStalled: boolean;
  stalledHours: number;
}

export function SquadWarmUpTab({ instanceId }: SquadWarmUpTabProps) {
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);

  // Fetch all squads with warm-up progress for this instance
  const { data: squads, isLoading } = useQuery({
    queryKey: ['instance-squads-warmup', instanceId],
    queryFn: async () => {
      // Get squads for this instance
      const { data: squadData, error: squadError } = await supabase
        .from('quest_squads')
        .select(`
          id,
          squad_name,
          status,
          created_at
        `)
        .eq('quest_id', instanceId)
        .order('squad_name');

      if (squadError) throw squadError;
      
      const now = new Date();

      // For each squad, get member count
      const squadsWithProgress: SquadSummary[] = await Promise.all(
        (squadData || []).map(async (squad) => {
          const { data: members, count } = await supabase
            .from('squad_members')
            .select('id, status', { count: 'exact' })
            .eq('squad_id', squad.id);

          const totalMembers = count || 0;
          const activeMembers = (members || []).filter(m => m.status !== 'dropped').length;
          
          // Status-based progress calculation
          // If squad is approved/active/completed, it's 100% ready
          // If ready_for_review, it's 100% but awaiting approval
          // If warming_up, we estimate based on status
          const squadStatus = (squad.status || 'confirmed') as SquadStatus;
          let progressPct = 0;
          let readyCount = 0;
          
          if (['approved', 'active', 'completed'].includes(squadStatus)) {
            progressPct = 100;
            readyCount = activeMembers;
          } else if (squadStatus === 'ready_for_review') {
            progressPct = 100;
            readyCount = activeMembers;
          } else if (squadStatus === 'warming_up') {
            // Partial progress - this will be accurate when viewed in detail
            progressPct = 50;
            readyCount = Math.floor(activeMembers / 2);
          }
          
          // Calculate stalled status (warming_up for > 24 hours)
          // Using created_at as proxy for when warm-up started
          let isStalled = false;
          let stalledHours = 0;
          const warmingUpSince = squad.created_at;
          
          if (squadStatus === 'warming_up' && warmingUpSince) {
            const warmUpStart = new Date(warmingUpSince);
            stalledHours = Math.floor((now.getTime() - warmUpStart.getTime()) / (1000 * 60 * 60));
            isStalled = stalledHours >= 24;
          }

          return {
            id: squad.id,
            name: squad.squad_name || `Squad ${squad.id.slice(0, 4)}`,
            status: squadStatus,
            memberCount: totalMembers,
            readyCount: readyCount,
            progressPct: progressPct,
            warmingUpSince,
            isStalled,
            stalledHours,
            lastActivity: squad.created_at,
          };
        })
      );

      return squadsWithProgress;
    },
  });

  // Calculate summary stats
  const stalledSquads = squads?.filter(s => s.isStalled) || [];
  const stats = {
    total: squads?.length || 0,
    warmingUp: squads?.filter(s => s.status === 'warming_up').length || 0,
    readyForReview: squads?.filter(s => s.status === 'ready_for_review').length || 0,
    approved: squads?.filter(s => ['approved', 'active', 'completed'].includes(s.status)).length || 0,
    stalled: stalledSquads.length,
  };

  const getStatusIcon = (status: SquadStatus, progressPct: number) => {
    if (['approved', 'active', 'completed'].includes(status)) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }
    if (status === 'ready_for_review') {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
    if (progressPct === 100) {
      return <Clock className="h-4 w-4 text-blue-500" />;
    }
    return <ThermometerSun className="h-4 w-4 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Squads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.warmingUp}</div>
            <p className="text-sm text-muted-foreground">Warming Up</p>
          </CardContent>
        </Card>
        <Card className={stats.readyForReview > 0 ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20" : ""}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats.readyForReview}</div>
            <p className="text-sm text-muted-foreground">Ready for Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Stalled squads alert */}
      {stats.stalled > 0 && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertOctagon className="h-4 w-4" />
              Stalled Warm-Ups ({stats.stalled})
            </CardTitle>
            <CardDescription>
              These squads have been in warm-up for 24+ hours without completing. Consider reaching out or reassigning members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stalledSquads.map(squad => (
                <Button
                  key={squad.id}
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 hover:bg-destructive/20"
                  onClick={() => setSelectedSquadId(squad.id)}
                >
                  <AlertOctagon className="h-3 w-3 mr-1" />
                  {squad.name} ({squad.stalledHours}h)
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Squads needing attention */}
      {stats.readyForReview > 0 && (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Squads Awaiting Review
            </CardTitle>
            <CardDescription>
              These squads have completed warm-up and need your approval to unlock quest instructions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {squads?.filter(s => s.status === 'ready_for_review').map(squad => (
                <Button
                  key={squad.id}
                  variant="outline"
                  size="sm"
                  className="border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  onClick={() => setSelectedSquadId(squad.id)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {squad.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Squads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Squads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!squads || squads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No squads formed yet.</p>
              <p className="text-sm">Form squads from the Squads tab first.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Squad</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attention</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Members Ready</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {squads.map((squad) => {
                    const statusStyles = SQUAD_STATUS_STYLES[squad.status] || SQUAD_STATUS_STYLES.draft;
                    
                    return (
                      <TableRow 
                        key={squad.id}
                        className={`cursor-pointer hover:bg-muted/50 ${squad.isStalled ? 'bg-destructive/5' : ''}`}
                        onClick={() => setSelectedSquadId(squad.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(squad.status, squad.progressPct)}
                            {squad.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${statusStyles.bg} ${statusStyles.text} border ${statusStyles.border}`}
                          >
                            {SQUAD_STATUS_LABELS[squad.status] || squad.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {squad.isStalled ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant="outline" 
                                    className="bg-destructive/20 text-destructive border-destructive/30 gap-1 cursor-help"
                                  >
                                    <AlertOctagon className="h-3 w-3" />
                                    Stalled
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">In warm-up for {squad.stalledHours} hours</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : squad.status === 'ready_for_review' ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant="outline" 
                                    className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 cursor-help"
                                  >
                                    <AlertCircle className="h-3 w-3" />
                                    Needs Review
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Ready for admin approval</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress 
                              value={squad.progressPct}
                              className={`h-2 ${squad.progressPct === 100 ? '[&>div]:bg-emerald-500' : ''}`}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={squad.progressPct === 100 ? 'text-emerald-600 font-medium' : ''}>
                            {squad.readyCount}/{squad.memberCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {squad.lastActivity 
                            ? format(new Date(squad.lastActivity), 'MMM d, h:mm a')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSquadId(squad.id);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Squad Review Sheet */}
      <Sheet open={!!selectedSquadId} onOpenChange={(open) => !open && setSelectedSquadId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Squad Warm-Up Review</SheetTitle>
          </SheetHeader>
          {selectedSquadId && (
            <div className="mt-6">
              <SquadWarmUpReview 
                squadId={selectedSquadId} 
                onClose={() => setSelectedSquadId(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
