/**
 * =============================================================================
 * CliquesManager - Admin moderation tools for cliques/squads
 * =============================================================================
 * 
 * Features:
 * - Browse all cliques
 * - View chat transcripts
 * - Moderate messages
 * - Send admin messages
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SquadChatViewer } from './SquadChatViewer';
import { 
  Search, 
  Users, 
  MessageCircle, 
  Calendar,
  Loader2,
  Archive,
  Eye,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

interface CliqueRow {
  id: string;
  name: string;
  created_at: string;
  archived_at: string | null;
  theme_tags: string[];
  commitment_style: string;
  member_count?: number;
  message_count?: number;
}

export function CliquesManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedClique, setSelectedClique] = useState<CliqueRow | null>(null);
  const [showChatViewer, setShowChatViewer] = useState(false);

  const { data: cliques, isLoading } = useQuery({
    queryKey: ['admin-cliques', showArchived],
    queryFn: async () => {
      let query = supabase
        .from('squads')
        .select('id, name, created_at, archived_at, theme_tags, commitment_style')
        .order('created_at', { ascending: false });
      
      if (!showArchived) {
        query = query.is('archived_at', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get member counts
      const cliqueIds = data.map(c => c.id);
      const { data: memberCounts } = await supabase
        .from('squad_members')
        .select('persistent_squad_id')
        .in('persistent_squad_id', cliqueIds)
        .eq('status', 'active');

      // Get message counts
      const { data: messageCounts } = await supabase
        .from('squad_chat_messages')
        .select('squad_id')
        .in('squad_id', cliqueIds);

      const memberCountMap = new Map<string, number>();
      const messageCountMap = new Map<string, number>();

      memberCounts?.forEach(m => {
        const count = memberCountMap.get(m.persistent_squad_id) || 0;
        memberCountMap.set(m.persistent_squad_id, count + 1);
      });

      messageCounts?.forEach(m => {
        const count = messageCountMap.get(m.squad_id) || 0;
        messageCountMap.set(m.squad_id, count + 1);
      });

      return data.map(clique => ({
        ...clique,
        member_count: memberCountMap.get(clique.id) || 0,
        message_count: messageCountMap.get(clique.id) || 0,
      })) as CliqueRow[];
    },
  });

  const filteredCliques = cliques?.filter(clique =>
    clique.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleViewChat = (clique: CliqueRow) => {
    setSelectedClique(clique);
    setShowChatViewer(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-foreground">Clique Moderation</h2>
        <p className="text-muted-foreground text-sm">View chat transcripts and moderate clique messages</p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cliques..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showArchived ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className="h-4 w-4 mr-2" />
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cliques List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Cliques ({filteredCliques.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredCliques.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cliques found
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredCliques.map((clique) => (
                  <div
                    key={clique.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{clique.name}</h3>
                        {clique.archived_at && (
                          <Badge variant="secondary" className="text-xs">
                            <Archive className="h-3 w-3 mr-1" />
                            Archived
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {clique.member_count} members
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {clique.message_count} messages
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(clique.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {clique.theme_tags?.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {clique.theme_tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewChat(clique)}
                      className="ml-4"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Chat
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Chat Viewer Dialog */}
      <Dialog open={showChatViewer} onOpenChange={setShowChatViewer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chat Transcript</DialogTitle>
          </DialogHeader>
          {selectedClique && (
            <SquadChatViewer
              squadId={selectedClique.id}
              squadName={selectedClique.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
