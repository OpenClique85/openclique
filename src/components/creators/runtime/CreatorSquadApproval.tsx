import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Loader2, CheckCircle, Users, Clock, MessageSquare, 
  ThumbsUp, AlertCircle, Eye
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  SQUAD_STATUS_LABELS, 
  SQUAD_STATUS_STYLES, 
  calculateWarmUpProgress,
  type SquadStatus 
} from '@/lib/squadLifecycle';

interface CreatorSquadApprovalProps {
  questId: string;
}

export function CreatorSquadApproval({ questId }: CreatorSquadApprovalProps) {
  const queryClient = useQueryClient();
  const [selectedSquad, setSelectedSquad] = useState<any>(null);
  const [viewingResponses, setViewingResponses] = useState(false);

  // Fetch squads that need approval (in warm-up phases)
  const { data: squads, isLoading } = useQuery({
    queryKey: ['creator-squads-approval', questId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_squads')
        .select(`
          *,
          squad_members (
            id,
            user_id,
            role,
            status,
            profiles:user_id (
              display_name,
              avatar_url
            )
          )
        `)
        .eq('quest_id', questId)
        // Use text filter to handle extended enum values not yet in TypeScript types
        .in('status', ['warming_up', 'ready_for_review', 'confirmed'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Approve squad mutation
  const approveSquad = useMutation({
    mutationFn: async (squadId: string) => {
      const { error } = await supabase
        .from('quest_squads')
        .update({ 
          status: 'approved' as any, // Extended enum value
          confirmed_at: new Date().toISOString()
        })
        .eq('id', squadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-squads-approval', questId] });
      queryClient.invalidateQueries({ queryKey: ['creator-quest-squads', questId] });
      toast.success('Squad approved! Members can now see quest instructions.');
      setSelectedSquad(null);
    },
    onError: () => {
      toast.error('Failed to approve squad');
    },
  });

  // Start warm-up mutation
  const startWarmUp = useMutation({
    mutationFn: async (squadId: string) => {
      const { error } = await supabase
        .from('quest_squads')
        .update({ status: 'warming_up' as any }) // Extended enum value
        .eq('id', squadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-squads-approval', questId] });
      queryClient.invalidateQueries({ queryKey: ['creator-quest-squads', questId] });
      toast.success('Warm-up started! Members will receive icebreaker prompts.');
    },
    onError: () => {
      toast.error('Failed to start warm-up');
    },
  });

  const getStatusBadge = (status: string) => {
    const statusKey = status as SquadStatus;
    const styles = SQUAD_STATUS_STYLES[statusKey] || SQUAD_STATUS_STYLES.draft;
    const label = SQUAD_STATUS_LABELS[statusKey] || status;
    
    return (
      <Badge className={`${styles.bg} ${styles.text} ${styles.border} border`}>
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const warmingUpSquads = squads?.filter(s => (s.status as string) === 'warming_up') || [];
  const readySquads = squads?.filter(s => (s.status as string) === 'ready_for_review') || [];
  const confirmedSquads = squads?.filter(s => (s.status as string) === 'confirmed') || [];

  if (!squads || squads.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No squads in warm-up or approval phase</p>
          <p className="text-sm text-muted-foreground mt-2">
            Lock squads from the Squads tab to start the warm-up process
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ready for Review - Priority */}
      {readySquads.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertCircle className="h-5 w-5" />
              Ready for Approval ({readySquads.length})
            </CardTitle>
            <CardDescription>
              These squads have completed warm-up and are waiting for your approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {readySquads.map((squad) => (
              <SquadApprovalCard
                key={squad.id}
                squad={squad}
                onApprove={() => setSelectedSquad(squad)}
                onViewResponses={() => {
                  setSelectedSquad(squad);
                  setViewingResponses(true);
                }}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warming Up */}
      {warmingUpSquads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Warming Up ({warmingUpSquads.length})
            </CardTitle>
            <CardDescription>
              Members are responding to icebreaker prompts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {warmingUpSquads.map((squad) => (
              <SquadWarmUpCard
                key={squad.id}
                squad={squad}
                onViewResponses={() => {
                  setSelectedSquad(squad);
                  setViewingResponses(true);
                }}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Confirmed - Ready to Start Warm-up */}
      {confirmedSquads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Ready to Start Warm-up ({confirmedSquads.length})
            </CardTitle>
            <CardDescription>
              Locked squads that haven't started their warm-up phase yet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {confirmedSquads.map((squad) => {
              const members = (squad.squad_members || []) as any[];
              const activeMembers = members.filter(m => m.status !== 'dropped');
              
              return (
                <div 
                  key={squad.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {activeMembers.slice(0, 3).map((member: any) => (
                        <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={member.profiles?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {member.profiles?.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <div>
                      <p className="font-medium">{squad.squad_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {activeMembers.length} members
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => startWarmUp.mutate(squad.id)}
                    disabled={startWarmUp.isPending}
                    className="gap-2"
                  >
                    {startWarmUp.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                    Start Warm-up
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Approval Confirmation Dialog */}
      <Dialog open={!!selectedSquad && !viewingResponses} onOpenChange={() => setSelectedSquad(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {selectedSquad?.squad_name}?</DialogTitle>
            <DialogDescription>
              Approving this squad will:
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Unlock quest instructions for all members
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Notify members that they're ready to go
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Move squad to "Approved" status
            </li>
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSquad(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => approveSquad.mutate(selectedSquad.id)}
              disabled={approveSquad.isPending}
              className="gap-2"
            >
              {approveSquad.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Approve Squad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Responses Dialog */}
      <Dialog open={viewingResponses} onOpenChange={() => setViewingResponses(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Warm-up Responses: {selectedSquad?.squad_name}</DialogTitle>
            <DialogDescription>
              Aggregated icebreaker responses from squad members
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {selectedSquad?.squad_members?.filter((m: any) => m.prompt_response).map((member: any) => (
                <div key={member.id} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.profiles?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {member.profiles?.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {member.profiles?.display_name || 'Unknown'}
                    </span>
                    {member.readiness_confirmed_at && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {member.prompt_response}
                  </p>
                </div>
              ))}
              {selectedSquad?.squad_members?.filter((m: any) => !m.prompt_response).length > 0 && (
                <div className="p-4 rounded-lg border border-dashed text-center text-muted-foreground">
                  <Clock className="h-5 w-5 mx-auto mb-2" />
                  <p className="text-sm">
                    {selectedSquad.squad_members.filter((m: any) => !m.prompt_response).length} member(s) haven't responded yet
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingResponses(false)}>
              Close
            </Button>
            {selectedSquad?.status === 'ready_for_review' && (
              <Button
                onClick={() => {
                  setViewingResponses(false);
                  approveSquad.mutate(selectedSquad.id);
                }}
                disabled={approveSquad.isPending}
                className="gap-2"
              >
                {approveSquad.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Approve Squad
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-component for squads ready for approval
function SquadApprovalCard({ 
  squad, 
  onApprove, 
  onViewResponses,
  getStatusBadge 
}: { 
  squad: any; 
  onApprove: () => void;
  onViewResponses: () => void;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  const members = (squad.squad_members || []) as any[];
  const progress = calculateWarmUpProgress(members);
  
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member: any) => (
              <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={member.profiles?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {member.profiles?.display_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div>
            <p className="font-medium">{squad.squad_name}</p>
            <p className="text-sm text-muted-foreground">
              {progress.readyMembers}/{progress.totalMembers} members ready
            </p>
          </div>
        </div>
        {getStatusBadge(squad.status)}
      </div>
      
      <Progress value={progress.percentage} className="h-2 mb-4" />
      
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onViewResponses} className="gap-1">
          <Eye className="h-3 w-3" />
          View Responses
        </Button>
        <Button size="sm" onClick={onApprove} className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Approve
        </Button>
      </div>
    </div>
  );
}

// Sub-component for squads in warm-up
function SquadWarmUpCard({ 
  squad, 
  onViewResponses,
  getStatusBadge 
}: { 
  squad: any; 
  onViewResponses: () => void;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  const members = (squad.squad_members || []) as any[];
  const progress = calculateWarmUpProgress(members);
  
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member: any) => (
              <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={member.profiles?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {member.profiles?.display_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div>
            <p className="font-medium">{squad.squad_name}</p>
            <p className="text-sm text-muted-foreground">
              {progress.readyMembers}/{progress.totalMembers} responded
            </p>
          </div>
        </div>
        {getStatusBadge(squad.status)}
      </div>
      
      <Progress value={progress.percentage} className="h-2 mb-4" />
      
      <Button size="sm" variant="outline" onClick={onViewResponses} className="gap-1">
        <Eye className="h-3 w-3" />
        View Responses
      </Button>
    </div>
  );
}
