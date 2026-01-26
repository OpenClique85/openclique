/**
 * ModerationDashboard - Admin panel for reviewing flags and trust scores
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Flag,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  User,
  Calendar,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ModerationFlag {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  resolution_notes: string | null;
}

export function ModerationDashboard() {
  const queryClient = useQueryClient();
  const [selectedFlag, setSelectedFlag] = useState<ModerationFlag | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Fetch pending flags
  const { data: pendingFlags, isLoading: flagsLoading } = useQuery({
    queryKey: ['moderation-flags', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moderation_flags')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ModerationFlag[];
    },
  });

  // Fetch trust score overview
  const { data: trustStats } = useQuery({
    queryKey: ['trust-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trust_scores')
        .select('entity_type, score')
        .limit(100);

      if (error) throw error;

      const stats = {
        users: { count: 0, avgScore: 0 },
        orgs: { count: 0, avgScore: 0 },
        quests: { count: 0, avgScore: 0 },
      };

      (data || []).forEach((item: any) => {
        const key = item.entity_type === 'user' ? 'users' : 
                   item.entity_type === 'org' ? 'orgs' : 'quests';
        stats[key].count++;
        stats[key].avgScore += Number(item.score) || 0;
      });

      Object.keys(stats).forEach(key => {
        const k = key as keyof typeof stats;
        if (stats[k].count > 0) {
          stats[k].avgScore = stats[k].avgScore / stats[k].count;
        }
      });

      return stats;
    },
  });

  // Resolve flag mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ flagId, resolution }: { flagId: string; resolution: 'resolved' | 'dismissed' }) => {
      const { error } = await supabase
        .from('moderation_flags')
        .update({
          status: resolution,
          reviewed_at: new Date().toISOString(),
          resolution_notes: resolutionNotes.trim() || null,
        })
        .eq('id', flagId);

      if (error) throw error;
    },
    onSuccess: (_, { resolution }) => {
      queryClient.invalidateQueries({ queryKey: ['moderation-flags'] });
      toast.success(`Flag ${resolution === 'resolved' ? 'resolved' : 'dismissed'}`);
      setSelectedFlag(null);
      setResolutionNotes('');
    },
    onError: () => {
      toast.error('Failed to update flag');
    },
  });

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      harassment: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      inappropriate: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      safety: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };
    return colors[reason] || colors.other;
  };

  return (
    <div className="space-y-6">
      {/* Trust Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trustStats?.users.avgScore.toFixed(1) || '—'}</p>
                <p className="text-sm text-muted-foreground">
                  Avg User Trust ({trustStats?.users.count || 0} tracked)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trustStats?.orgs.avgScore.toFixed(1) || '—'}</p>
                <p className="text-sm text-muted-foreground">
                  Avg Org Trust ({trustStats?.orgs.count || 0} tracked)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Flag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingFlags?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flags Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Moderation Queue
          </CardTitle>
          <CardDescription>
            Review reported content and take action
          </CardDescription>
        </CardHeader>
        <CardContent>
          {flagsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : pendingFlags?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending reports. Queue is clear!</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingFlags?.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell>
                        <Badge variant="outline">{flag.target_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getReasonBadge(flag.reason)}>
                          {flag.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {flag.details || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(flag.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFlag(flag)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={!!selectedFlag} onOpenChange={() => setSelectedFlag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
            <DialogDescription>
              Take action on this reported {selectedFlag?.target_type}
            </DialogDescription>
          </DialogHeader>

          {selectedFlag && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedFlag.target_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <Badge className={getReasonBadge(selectedFlag.reason)}>
                    {selectedFlag.reason}
                  </Badge>
                </div>
              </div>

              {selectedFlag.details && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reporter's Details</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedFlag.details}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Resolution Notes</p>
                <Textarea
                  placeholder="Document your decision..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => resolveMutation.mutate({ 
                    flagId: selectedFlag.id, 
                    resolution: 'dismissed' 
                  })}
                  disabled={resolveMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Dismiss
                </Button>
                <Button
                  onClick={() => resolveMutation.mutate({ 
                    flagId: selectedFlag.id, 
                    resolution: 'resolved' 
                  })}
                  disabled={resolveMutation.isPending}
                >
                  {resolveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Resolve & Take Action
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
