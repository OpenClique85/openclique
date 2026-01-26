/**
 * CliqueLoreTab - Persistent memories, photos, and journey summaries
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Camera, 
  Sparkles, 
  Pin, 
  Plus,
  Loader2,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface LoreEntry {
  id: string;
  entry_type: 'memory' | 'photo' | 'milestone' | 'summary';
  title: string | null;
  content: string | null;
  media_url: string | null;
  quest_id: string | null;
  is_pinned: boolean;
  is_ai_generated: boolean;
  created_by: string | null;
  created_by_name?: string;
  created_at: string;
}

interface CliqueLoreTabProps {
  cliqueId: string;
  isLeader: boolean;
}

export function CliqueLoreTab({ cliqueId, isLeader }: CliqueLoreTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<LoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('clique_lore_entries')
      .select('*')
      .eq('squad_id', cliqueId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lore:', error);
      return;
    }

    // Get creator names
    const creatorIds = [...new Set((data || []).map(e => e.created_by).filter(Boolean))] as string[];
    const { data: profiles } = creatorIds.length > 0
      ? await supabase.from('profiles').select('id, display_name').in('id', creatorIds)
      : { data: [] };

    const profilesMap = new Map((profiles || []).map(p => [p.id, p.display_name]));

    const processed: LoreEntry[] = (data || []).map(entry => ({
      id: entry.id,
      entry_type: entry.entry_type as LoreEntry['entry_type'],
      title: entry.title,
      content: entry.content,
      media_url: entry.media_url,
      quest_id: entry.quest_id,
      is_pinned: entry.is_pinned || false,
      is_ai_generated: entry.is_ai_generated || false,
      created_by: entry.created_by,
      created_by_name: entry.created_by ? (profilesMap.get(entry.created_by) as string) || 'Unknown' : undefined,
      created_at: entry.created_at || '',
    }));

    setEntries(processed);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [cliqueId]);

  const handleAddEntry = async () => {
    if (!newContent.trim() || !user) return;

    setIsAdding(true);

    const { error } = await supabase
      .from('clique_lore_entries')
      .insert({
        squad_id: cliqueId,
        entry_type: 'memory',
        title: newTitle.trim() || null,
        content: newContent.trim(),
        created_by: user.id,
      });

    setIsAdding(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to add memory',
        description: error.message,
      });
      return;
    }

    toast({ title: 'Memory added to lore! 📖' });
    setNewTitle('');
    setNewContent('');
    setShowAddForm(false);
    fetchEntries();
  };

  const handleTogglePin = async (entryId: string, currentPinned: boolean) => {
    const { error } = await supabase
      .from('clique_lore_entries')
      .update({ is_pinned: !currentPinned })
      .eq('id', entryId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to update',
        description: error.message,
      });
      return;
    }

    fetchEntries();
  };

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Camera className="h-4 w-4" />;
      case 'milestone': return <Sparkles className="h-4 w-4" />;
      case 'summary': return <BookOpen className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add memory button */}
      {!showAddForm ? (
        <Button onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add a Memory
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Memory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title (optional)"
            />
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What happened? Write it down for the lore..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddEntry} disabled={!newContent.trim() || isAdding}>
                {isAdding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <BookOpen className="h-4 w-4 mr-2" />
                )}
                Save to Lore
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lore entries */}
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Your story starts here</p>
            <p className="text-sm">
              Add memories, photos, and milestones to build your clique's lore
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className={entry.is_pinned ? 'border-primary/50' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="p-1.5 rounded bg-muted">
                      {getEntryIcon(entry.entry_type)}
                    </div>
                    <div className="flex-1">
                      {entry.title && (
                        <h4 className="font-medium">{entry.title}</h4>
                      )}
                      {entry.content && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {entry.content}
                        </p>
                      )}
                      {entry.media_url && (
                        <img 
                          src={entry.media_url} 
                          alt="Lore media" 
                          className="mt-2 rounded-lg max-h-48 object-cover"
                        />
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        {entry.created_by_name && <span>by {entry.created_by_name}</span>}
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</span>
                        {entry.is_ai_generated && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Sparkles className="h-3 w-3" />
                              AI
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {isLeader && (
                    <Button
                      variant={entry.is_pinned ? 'default' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleTogglePin(entry.id, entry.is_pinned)}
                    >
                      <Pin className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
