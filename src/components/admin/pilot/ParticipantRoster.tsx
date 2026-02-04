/**
 * Participant Roster
 * 
 * Filterable table of all participants in a quest instance.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { 
  Search, MoreHorizontal, MessageSquare, UserMinus, 
  AlertTriangle, CheckCircle, Loader2
} from 'lucide-react';
import type { Tables, Enums } from '@/integrations/supabase/types';

type SignupStatus = Enums<'signup_status'>;

interface ParticipantWithProfile {
  id: string;
  user_id: string;
  status: SignupStatus;
  checked_in_at: string | null;
  completed_at: string | null;
  last_activity_at: string | null;
  signed_up_at: string;
  squad_id: string | null;
  profiles: {
    display_name: string | null;
    email: string | null;
  } | null;
  quest_squads: {
    name: string;
  } | null;
}

const STATUS_COLORS: Record<SignupStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-700',
  confirmed: 'bg-blue-500/20 text-blue-700',
  standby: 'bg-purple-500/20 text-purple-700',
  dropped: 'bg-muted text-muted-foreground',
  completed: 'bg-green-500/20 text-green-700',
  no_show: 'bg-destructive/20 text-destructive',
};

interface ParticipantRosterProps {
  instanceId: string;
}

export function ParticipantRoster({ instanceId }: ParticipantRosterProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch participants
  const { data: participants, isLoading } = useQuery({
    queryKey: ['instance-participants', instanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_signups')
        .select(`
          id, user_id, status,
          checked_in_at, completed_at, last_activity_at, signed_up_at, squad_id,
          profiles!inner(display_name, email),
          quest_squads(name)
        `)
        .eq('instance_id', instanceId)
        .order('signed_up_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as ParticipantWithProfile[];
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ signupId, newStatus }: { signupId: string; newStatus: SignupStatus }) => {
      const { error } = await supabase
        .from('quest_signups')
        .update({ status: newStatus })
        .eq('id', signupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instance-participants', instanceId] });
      toast({ title: 'Status updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to update', description: err.message, variant: 'destructive' });
    }
  });


  // Filter participants
  const filteredParticipants = participants?.filter(p => {
    const matchesSearch = !search || 
      p.profiles?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.profiles?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];


  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Participant Roster ({participants?.length || 0})</CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="standby">Standby</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Squad</TableHead>
                <TableHead>Checked In</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No participants found
                  </TableCell>
                </TableRow>
              ) : (
                filteredParticipants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{p.profiles?.display_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{p.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {p.quest_squads?.name || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {p.checked_in_at ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {formatTime(p.checked_in_at)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTime(p.last_activity_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ signupId: p.id, newStatus: 'confirmed' })}
                          >
                            Mark Confirmed
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ signupId: p.id, newStatus: 'completed' })}
                          >
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ signupId: p.id, newStatus: 'no_show' })}
                            className="text-amber-600"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Mark No-Show
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ signupId: p.id, newStatus: 'dropped' })}
                            className="text-destructive"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
