/**
 * Active Cliques Panel
 * 
 * Shows approved cliques in Run of Show with ability to monitor their chats
 * and complete individual cliques.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { 
  Users, 
  MessageCircle, 
  Eye, 
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { SquadChatViewer } from '@/components/admin/SquadChatViewer';
import { CompleteCliqueDialog } from './CompleteCliqueDialog';
import { SQUAD_STATUS_LABELS, SQUAD_STATUS_STYLES, SquadStatus } from '@/lib/squadLifecycle';

interface ActiveCliquesPanelProps {
  instanceId: string;
}

interface ActiveClique {
  id: string;
  squad_name: string;
  status: SquadStatus;
  memberCount: number;
  lastActivity: string | null;
}

export function ActiveCliquesPanel({ instanceId }: ActiveCliquesPanelProps) {
  const [selectedClique, setSelectedClique] = useState<{ id: string; name: string } | null>(null);

  // Fetch approved/active cliques
  const { data: cliques, isLoading } = useQuery({
    queryKey: ['active-cliques', instanceId],
    queryFn: async () => {
      // Fetch cliques that have passed warm-up (approved, active, completed)
      const { data: squadsData, error: squadsError } = await supabase
        .from('quest_squads')
        .select('id, squad_name, status')
        .eq('instance_id', instanceId)
        .in('status', ['approved', 'active', 'completed']);
      
      if (squadsError) throw squadsError;
      
      // Fetch member counts and last activity for each clique
      const enrichedCliques: ActiveClique[] = await Promise.all(
        (squadsData || []).map(async (squad) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from('squad_members')
            .select('*', { count: 'exact', head: true })
            .eq('squad_id', squad.id)
            .neq('status', 'dropped');
          
          // Get last chat message time
          const { data: lastMessage } = await supabase
            .from('squad_chat_messages')
            .select('created_at')
            .eq('squad_id', squad.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          return {
            id: squad.id,
            squad_name: squad.squad_name || `Clique ${squad.id.slice(0, 4)}`,
            status: (squad.status || 'approved') as SquadStatus,
            memberCount: memberCount || 0,
            lastActivity: lastMessage?.created_at || null,
          };
        })
      );
      
      return enrichedCliques;
    },
    enabled: !!instanceId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!cliques?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Cliques
          </CardTitle>
          <CardDescription>
            Approved cliques will appear here after passing the warm-up phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active cliques yet</p>
            <p className="text-xs mt-1">Approve cliques from the Warm-Up tab to see them here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Cliques ({cliques.length})
          </CardTitle>
          <CardDescription>
            Monitor approved cliques and their group chats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {cliques.map((clique) => {
                const statusStyles = SQUAD_STATUS_STYLES[clique.status] || SQUAD_STATUS_STYLES.approved;
                
                return (
                  <div
                    key={clique.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {clique.squad_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{clique.squad_name}</span>
                          <Badge 
                            variant="outline" 
                            className={`${statusStyles.bg} ${statusStyles.text} border ${statusStyles.border} text-xs`}
                          >
                            {SQUAD_STATUS_LABELS[clique.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {clique.memberCount} members
                          </span>
                          {clique.lastActivity && (
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              Last active {format(new Date(clique.lastActivity), 'h:mm a')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedClique({ id: clique.id, name: clique.squad_name })}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Chat
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Viewer Sheet */}
      <Sheet open={!!selectedClique} onOpenChange={(open) => !open && setSelectedClique(null)}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {selectedClique?.name} Chat
            </SheetTitle>
            <SheetDescription>
              Monitor and moderate the clique's group chat
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            {selectedClique && (
              <SquadChatViewer 
                squadId={selectedClique.id} 
                squadName={selectedClique.name} 
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
