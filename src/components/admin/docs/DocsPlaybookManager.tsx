/**
 * =============================================================================
 * DOCS PLAYBOOK MANAGER - COO Operations Documentation Editor
 * =============================================================================
 * 
 * PURPOSE: Manage operational playbooks, processes, SLAs, and metrics docs
 * 
 * CATEGORIES:
 * - playbook: Daily ops, escalation, support runbooks, crisis response
 * - process: Partner management, onboarding workflows
 * - sla: Response times, uptime targets
 * - metrics: KPIs, dashboards, reporting guidance
 * 
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, Edit, Trash2, Eye, FileText, AlertTriangle, 
  Clock, BarChart3, BookOpen, CheckCircle2
} from 'lucide-react';
import { SingleDocPreview, type PreviewDocument } from './DocPreviewModal';

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

const CATEGORY_CONFIG = {
  playbook: {
    label: 'Playbooks',
    icon: BookOpen,
    description: 'Operational procedures and runbooks',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    subcategories: ['daily_ops', 'escalation', 'support_runbook', 'crisis_response'],
  },
  process: {
    label: 'Processes',
    icon: CheckCircle2,
    description: 'Workflows and procedures',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    subcategories: ['partner_management', 'daily_ops', 'onboarding'],
  },
  sla: {
    label: 'SLAs',
    icon: Clock,
    description: 'Service level agreements',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    subcategories: ['response_times', 'uptime', 'partner_sla'],
  },
  metrics: {
    label: 'Metrics',
    icon: BarChart3,
    description: 'KPIs and reporting',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    subcategories: ['reporting', 'kpis', 'dashboards'],
  },
} as const;

type PlaybookCategory = keyof typeof CATEGORY_CONFIG;

const SUBCATEGORY_LABELS: Record<string, string> = {
  daily_ops: 'Daily Operations',
  escalation: 'Escalation',
  support_runbook: 'Support Runbook',
  crisis_response: 'Crisis Response',
  partner_management: 'Partner Management',
  onboarding: 'Onboarding',
  response_times: 'Response Times',
  uptime: 'Uptime Targets',
  partner_sla: 'Partner SLA',
  reporting: 'Reporting',
  kpis: 'KPIs',
  dashboards: 'Dashboards',
};

export function DocsPlaybookManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PlaybookCategory>('playbook');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PreviewDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<SystemDoc | null>(null);
  
  const [formData, setFormData] = useState({
    category: 'playbook' as PlaybookCategory,
    subcategory: '',
    title: '',
    description: '',
    content_markdown: '',
    mermaid_diagram: '',
    sort_order: 1,
    is_published: true,
  });

  // Fetch all playbook-related docs
  const { data: docs, isLoading } = useQuery({
    queryKey: ['system-docs', 'playbooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_docs')
        .select('*')
        .in('category', ['playbook', 'process', 'sla', 'metrics'])
        .order('category')
        .order('sort_order');
      
      if (error) throw error;
      return data as SystemDoc[];
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      if (data.id) {
        const { error } = await supabase
          .from('system_docs')
          .update({
            category: data.category,
            subcategory: data.subcategory || null,
            title: data.title,
            slug,
            description: data.description || null,
            content_markdown: data.content_markdown || null,
            mermaid_diagram: data.mermaid_diagram || null,
            sort_order: data.sort_order,
            is_published: data.is_published,
            version: (editingDoc?.version || 0) + 1,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_docs')
          .insert({
            category: data.category,
            subcategory: data.subcategory || null,
            title: data.title,
            slug,
            description: data.description || null,
            content_markdown: data.content_markdown || null,
            mermaid_diagram: data.mermaid_diagram || null,
            sort_order: data.sort_order,
            is_published: data.is_published,
            version: 1,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-docs'] });
      toast.success(editingDoc ? 'Document updated' : 'Document created');
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('system_docs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-docs'] });
      toast.success('Document deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      category: activeTab,
      subcategory: '',
      title: '',
      description: '',
      content_markdown: '',
      mermaid_diagram: '',
      sort_order: 1,
      is_published: true,
    });
    setEditingDoc(null);
    setDialogOpen(false);
  };

  const handleEdit = (doc: SystemDoc) => {
    setEditingDoc(doc);
    setFormData({
      category: doc.category as PlaybookCategory,
      subcategory: doc.subcategory || '',
      title: doc.title,
      description: doc.description || '',
      content_markdown: doc.content_markdown || '',
      mermaid_diagram: doc.mermaid_diagram || '',
      sort_order: doc.sort_order,
      is_published: doc.is_published,
    });
    setDialogOpen(true);
  };

  const handlePreview = (doc: SystemDoc) => {
    setPreviewDoc(doc as PreviewDocument);
    setPreviewOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    saveMutation.mutate({ ...formData, id: editingDoc?.id });
  };

  const handleNewDoc = () => {
    setEditingDoc(null);
    setFormData({
      category: activeTab,
      subcategory: CATEGORY_CONFIG[activeTab].subcategories[0] || '',
      title: '',
      description: '',
      content_markdown: '',
      mermaid_diagram: '',
      sort_order: (docs?.filter(d => d.category === activeTab).length || 0) + 1,
      is_published: true,
    });
    setDialogOpen(true);
  };

  // Filter docs by current tab
  const filteredDocs = docs?.filter(d => d.category === activeTab) || [];

  // Group by subcategory
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const key = doc.subcategory || 'uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {} as Record<string, SystemDoc[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Operations Playbooks
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage COO documentation: daily ops, escalations, SLAs, and metrics
          </p>
        </div>
        <Button onClick={handleNewDoc}>
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PlaybookCategory)}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          {(Object.keys(CATEGORY_CONFIG) as PlaybookCategory[]).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = config.icon;
            const count = docs?.filter(d => d.category === cat).length || 0;
            
            return (
              <TabsTrigger key={cat} value={cat} className="gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(CATEGORY_CONFIG) as PlaybookCategory[]).map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = CATEGORY_CONFIG[cat].icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {CATEGORY_CONFIG[cat].label}
                </CardTitle>
                <CardDescription>{CATEGORY_CONFIG[cat].description}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : filteredDocs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No documents yet</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={handleNewDoc}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedDocs).map(([subcategory, subDocs]) => (
                      <div key={subcategory}>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                          {SUBCATEGORY_LABELS[subcategory] || subcategory}
                          <span className="text-xs">({subDocs.length})</span>
                        </h4>
                        <div className="grid gap-3">
                          {subDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium truncate">{doc.title}</h5>
                                  {!doc.is_published && (
                                    <Badge variant="outline" className="text-xs">Draft</Badge>
                                  )}
                                  {doc.mermaid_diagram && (
                                    <Badge variant="secondary" className="text-xs">Has Diagram</Badge>
                                  )}
                                </div>
                                {doc.description && (
                                  <p className="text-sm text-muted-foreground truncate mt-1">
                                    {doc.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handlePreview(doc)}
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
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    if (confirm('Delete this document?')) {
                                      deleteMutation.mutate(doc.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDoc ? 'Edit Document' : 'Create Document'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData(prev => ({ 
                    ...prev, 
                    category: v as PlaybookCategory,
                    subcategory: CATEGORY_CONFIG[v as PlaybookCategory].subcategories[0] || '',
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_CONFIG) as PlaybookCategory[]).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, subcategory: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_CONFIG[formData.category].subcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {SUBCATEGORY_LABELS[sub] || sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Document title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Published</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
              />
            </div>

            <div className="space-y-2">
              <Label>Content (Markdown)</Label>
              <Textarea
                value={formData.content_markdown}
                onChange={(e) => setFormData(prev => ({ ...prev, content_markdown: e.target.value }))}
                placeholder="## Heading&#10;&#10;Content goes here..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Mermaid Diagram (optional)</Label>
              <Textarea
                value={formData.mermaid_diagram}
                onChange={(e) => setFormData(prev => ({ ...prev, mermaid_diagram: e.target.value }))}
                placeholder="graph TD&#10;    A[Start] --> B[End]"
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use Mermaid syntax for flowcharts, state diagrams, etc.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editingDoc ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <SingleDocPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        document={previewDoc}
      />
    </div>
  );
}
