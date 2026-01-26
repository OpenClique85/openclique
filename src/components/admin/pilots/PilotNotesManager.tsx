/**
 * PilotNotesManager - Journal interface for pilot observations, issues, and milestones
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, Search, Loader2, StickyNote, AlertTriangle, CheckCircle, 
  Milestone, AlertCircle, Download, Trash2, Calendar, User
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface PilotNote {
  id: string;
  pilot_id: string;
  note_type: 'observation' | 'issue' | 'decision' | 'milestone' | 'risk';
  content: string;
  tags: string[];
  related_quest_id: string | null;
  related_user_id: string | null;
  created_by: string | null;
  created_at: string;
}

interface PilotProgram {
  id: string;
  name: string;
  slug: string;
}

const NOTE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  observation: { 
    label: 'Observation', 
    icon: <StickyNote className="h-4 w-4" />, 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
  },
  issue: { 
    label: 'Issue', 
    icon: <AlertTriangle className="h-4 w-4" />, 
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
  },
  decision: { 
    label: 'Decision', 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
  },
  milestone: { 
    label: 'Milestone', 
    icon: <Milestone className="h-4 w-4" />, 
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
  },
  risk: { 
    label: 'Risk', 
    icon: <AlertCircle className="h-4 w-4" />, 
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' 
  },
};

export function PilotNotesManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPilotId, setSelectedPilotId] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    note_type: 'observation' as PilotNote['note_type'],
    content: '',
    tags: '',
  });

  // Fetch pilots
  const { data: pilots, isLoading: pilotsLoading } = useQuery({
    queryKey: ['pilot-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pilot_programs' as any)
        .select('id, name, slug')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as unknown as PilotProgram[];
    },
  });

  // Auto-select first pilot
  const effectivePilotId = selectedPilotId || pilots?.[0]?.id || '';

  // Fetch notes for selected pilot
  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['pilot-notes', effectivePilotId],
    queryFn: async () => {
      if (!effectivePilotId) return [];
      const { data, error } = await supabase
        .from('pilot_notes' as any)
        .select('*')
        .eq('pilot_id', effectivePilotId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as PilotNote[];
    },
    enabled: !!effectivePilotId,
  });

  // Create note mutation
  const createNote = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('pilot_notes').insert({
        pilot_id: effectivePilotId,
        note_type: data.note_type,
        content: data.content,
        tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot-notes', effectivePilotId] });
      toast({ title: 'Note added' });
      setIsCreateOpen(false);
      setFormData({ note_type: 'observation', content: '', tags: '' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete note mutation
  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pilot_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot-notes', effectivePilotId] });
      toast({ title: 'Note deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Filter notes
  const filteredNotes = notes?.filter(note => {
    const matchesType = filterType === 'all' || note.note_type === filterType;
    const matchesSearch = !searchQuery || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Export notes
  const exportNotes = (exportFormat: 'json' | 'markdown') => {
    if (!filteredNotes?.length) {
      toast({ title: 'No notes to export', variant: 'destructive' });
      return;
    }

    const pilotName = pilots?.find(p => p.id === effectivePilotId)?.slug || 'pilot';

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(filteredNotes, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pilotName}-notes.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const md = filteredNotes.map(note => {
        const dateStr = note.created_at ? format(parseISO(note.created_at), 'MMM d, yyyy HH:mm') : 'Unknown date';
        const typeLabel = NOTE_TYPE_CONFIG[note.note_type]?.label || note.note_type;
        return `## ${dateStr} - ${typeLabel}\n\n${note.content}\n\n${note.tags.length ? `_Tags: ${note.tags.join(', ')}_` : ''}\n\n---\n`;
      }).join('\n');
      
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pilotName}-notes.md`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast({ title: 'Notes exported' });
  };

  const selectedPilot = pilots?.find(p => p.id === effectivePilotId);

  if (pilotsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pilots?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No pilot programs available</p>
          <p className="text-sm text-muted-foreground">Create a pilot program first</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <StickyNote className="h-6 w-6 text-primary" />
            Pilot Notes & Issues
          </h2>
          <p className="text-muted-foreground">Track observations, decisions, and milestones</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription>
                Record an observation, issue, decision, milestone, or risk for {selectedPilot?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createNote.mutate(formData); }} className="space-y-4">
              <div>
                <Label>Note Type</Label>
                <Select 
                  value={formData.note_type} 
                  onValueChange={(v) => setFormData({ ...formData, note_type: v as PilotNote['note_type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTE_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          {config.icon}
                          {config.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Content *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="What did you observe, decide, or encounter?"
                  rows={5}
                  required
                />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="ux, onboarding, retention"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createNote.isPending}>
                  {createNote.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Note
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={effectivePilotId} onValueChange={setSelectedPilotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pilot..." />
                </SelectTrigger>
                <SelectContent>
                  {pilots.map((pilot) => (
                    <SelectItem key={pilot.id} value={pilot.id}>{pilot.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(NOTE_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(format) => exportNotes(format as 'json' | 'markdown')}>
                <SelectTrigger className="w-[130px]">
                  <Download className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Timeline */}
      {notesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredNotes?.length ? (
        <div className="space-y-4">
          {filteredNotes.map((note) => {
            const config = NOTE_TYPE_CONFIG[note.note_type];
            return (
              <Card key={note.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={config.color}>{config.label}</Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(note.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {note.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this note?')) {
                          deleteNote.mutate(note.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notes found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || filterType !== 'all' ? 'Try adjusting your filters' : 'Start documenting your pilot observations'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
