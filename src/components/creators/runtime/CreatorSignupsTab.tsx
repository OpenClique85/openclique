import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Search, CheckCircle, XCircle, Clock, Users } from 'lucide-react';

interface CreatorSignupsTabProps {
  questId: string;
  capacity: number;
}

// Use the actual enum type from database
type SignupStatus = 'pending' | 'confirmed' | 'standby' | 'dropped' | 'no_show' | 'completed';

export function CreatorSignupsTab({ questId, capacity }: CreatorSignupsTabProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch signups with profile info
  const { data: signups, isLoading } = useQuery({
    queryKey: ['creator-quest-signups', questId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_signups')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('quest_id', questId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Update signup status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ signupId, status }: { signupId: string; status: SignupStatus }) => {
      const { error } = await supabase
        .from('quest_signups')
        .update({ status })
        .eq('id', signupId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-quest-signups', questId] });
      queryClient.invalidateQueries({ queryKey: ['quest-signup-stats', questId] });
      toast.success('Signup status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const filteredSignups = (signups || []).filter(signup => {
    const matchesSearch = !searchQuery || 
      (signup.profiles as any)?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || signup.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const confirmedCount = signups?.filter(s => s.status === 'confirmed').length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pending</Badge>;
      case 'standby':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Standby</Badge>;
      case 'dropped':
        return <Badge variant="secondary">Dropped</Badge>;
      case 'no_show':
        return <Badge variant="destructive">No Show</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Signups
            </CardTitle>
            <CardDescription>
              {confirmedCount} / {capacity} confirmed participants
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-40"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="standby">Standby</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredSignups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {signups?.length === 0 ? 'No signups yet' : 'No signups match your filters'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSignups.map((signup) => {
              const profile = signup.profiles as any;
              return (
                <div
                  key={signup.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {profile?.display_name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Signup #{signup.id.slice(0, 8)}
                    </p>
                  </div>

                  {getStatusBadge(signup.status)}

                  <div className="flex gap-1">
                    {signup.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ signupId: signup.id, status: 'confirmed' })}
                          disabled={updateStatus.isPending}
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ signupId: signup.id, status: 'standby' })}
                          disabled={updateStatus.isPending}
                        >
                          <Clock className="h-4 w-4 text-amber-500" />
                        </Button>
                      </>
                    )}
                    {signup.status === 'standby' && confirmedCount < capacity && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ signupId: signup.id, status: 'confirmed' })}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                    {['pending', 'confirmed', 'standby'].includes(signup.status) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus.mutate({ signupId: signup.id, status: 'dropped' })}
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
