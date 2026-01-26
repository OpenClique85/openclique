/**
 * =============================================================================
 * DOCS FLOWS MANAGER - Flow & State Machine Documentation Editor
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, GitBranch, Workflow } from 'lucide-react';

interface SystemDoc {
  id: string;
  category: string;
  subcategory: string | null;
  title: string;
  slug: string;
  description: string | null;
  content_markdown: string | null;
  mermaid_diagram: string | null;
  version: number;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const SUBCATEGORIES = ['quest', 'signup', 'clique', 'gamification', 'feedback', 'listing', 'ticket', 'support', 'organization', 'club'];

export function DocsFlowsManager() {
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<SystemDoc | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'flow',
    subcategory: '',
    title: '',
    slug: '',
    description: '',
    content_markdown: '',
    mermaid_diagram: '',
    sort_order: 0,
    is_published: true,
  });

  // Fetch flow and state machine docs
  const { data: docs, isLoading } = useQuery({
    queryKey: ['system-docs', 'flows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_docs')
        .select('*')
        .in('category', ['flow', 'state_machine'])
        .order('category')
        .order('sort_order');
      
      if (error) throw error;
      return data as SystemDoc[];
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      if (data.id) {
        const { error } = await supabase
          .from('system_docs')
          .update({
            ...data,
            slug,
            version: (selectedDoc?.version || 0) + 1,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_docs')
          .insert({ ...data, slug });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Document saved successfully');
      queryClient.invalidateQueries({ queryKey: ['system-docs'] });
      setIsEditing(false);
      setSelectedDoc(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to save document: ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('system_docs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['system-docs'] });
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      category: 'flow',
      subcategory: '',
      title: '',
      slug: '',
      description: '',
      content_markdown: '',
      mermaid_diagram: '',
      sort_order: 0,
      is_published: true,
    });
  };

  const handleEdit = (doc: SystemDoc) => {
    setSelectedDoc(doc);
    setFormData({
      category: doc.category,
      subcategory: doc.subcategory || '',
      title: doc.title,
      slug: doc.slug,
      description: doc.description || '',
      content_markdown: doc.content_markdown || '',
      mermaid_diagram: doc.mermaid_diagram || '',
      sort_order: doc.sort_order,
      is_published: doc.is_published,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    saveMutation.mutate({
      ...formData,
      id: selectedDoc?.id,
    });
  };

  const flowDocs = docs?.filter(d => d.category === 'flow') || [];
  const stateMachineDocs = docs?.filter(d => d.category === 'state_machine') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Flows & State Machines</h3>
          <p className="text-sm text-muted-foreground">
            Document user journeys and state transitions with Mermaid diagrams
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsEditing(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Flows Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Workflow className="h-4 w-4" />
              User Flows ({flowDocs.length})
            </div>
            {flowDocs.map((doc) => (
              <Card key={doc.id} className="group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{doc.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {doc.subcategory && (
                          <Badge variant="secondary" className="text-xs">{doc.subcategory}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">v{doc.version}</span>
                        {!doc.is_published && (
                          <Badge variant="outline" className="text-xs">Draft</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setSelectedDoc(doc); setIsPreviewOpen(true); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{doc.description}</p>
                </CardContent>
              </Card>
            ))}
            {flowDocs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No flow documents yet</p>
            )}
          </div>

          {/* State Machines Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <GitBranch className="h-4 w-4" />
              State Machines ({stateMachineDocs.length})
            </div>
            {stateMachineDocs.map((doc) => (
              <Card key={doc.id} className="group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{doc.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {doc.subcategory && (
                          <Badge variant="secondary" className="text-xs">{doc.subcategory}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">v{doc.version}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setSelectedDoc(doc); setIsPreviewOpen(true); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{doc.description}</p>
                </CardContent>
              </Card>
            ))}
            {stateMachineDocs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No state machine documents yet</p>
            )}
          </div>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDoc ? 'Edit Document' : 'New Document'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flow">User Flow</SelectItem>
                    <SelectItem value="state_machine">State Machine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(v) => setFormData({ ...formData, subcategory: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBCATEGORIES.map((sub) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Quest Signup Flow"
                />
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this flow..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Content (Markdown)</Label>
              <Textarea
                value={formData.content_markdown}
                onChange={(e) => setFormData({ ...formData, content_markdown: e.target.value })}
                placeholder="# Flow Title&#10;&#10;## Overview&#10;..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Mermaid Diagram</Label>
              <Textarea
                value={formData.mermaid_diagram}
                onChange={(e) => setFormData({ ...formData, mermaid_diagram: e.target.value })}
                placeholder="flowchart TD&#10;    A[Start] --> B[End]"
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use Mermaid syntax. Supported: flowchart, stateDiagram-v2, sequenceDiagram
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.title}</DialogTitle>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">{selectedDoc.description}</p>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                  {selectedDoc.content_markdown}
                </pre>
              </div>

              {selectedDoc.mermaid_diagram && (
                <div className="space-y-2">
                  <Label>Mermaid Diagram Code</Label>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono">
                    {selectedDoc.mermaid_diagram}
                  </pre>
                  <p className="text-xs text-muted-foreground">
                    Copy this to <a href="https://mermaid.live" target="_blank" rel="noopener" className="underline">mermaid.live</a> to preview
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
