/**
 * =============================================================================
 * ISSUE CATEGORIES MANAGER
 * Admin CRUD for support ticket issue categories
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, AlertTriangle, GripVertical } from 'lucide-react';

interface IssueCategory {
  id: string;
  name: string;
  description: string | null;
  severity_default: string;
  requires_escalation: boolean;
  is_active: boolean;
  display_order: number;
}

export function IssueCategoriesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<IssueCategory | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-issue-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as IssueCategory[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (category: Partial<IssueCategory>) => {
      const { data, error } = await supabase
        .from('issue_categories')
        .insert(category as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-issue-categories'] });
      queryClient.invalidateQueries({ queryKey: ['issue-categories'] });
      setIsCreateOpen(false);
      toast({ title: 'Category created' });
    },
    onError: () => {
      toast({ title: 'Failed to create category', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<IssueCategory> }) => {
      const { data, error } = await supabase
        .from('issue_categories')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-issue-categories'] });
      queryClient.invalidateQueries({ queryKey: ['issue-categories'] });
      setEditingCategory(null);
      toast({ title: 'Category updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update category', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('issue_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-issue-categories'] });
      queryClient.invalidateQueries({ queryKey: ['issue-categories'] });
      toast({ title: 'Category deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete category', variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Issue Categories</h2>
          <p className="text-sm text-muted-foreground">
            Manage support ticket categories and escalation rules
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {categories?.map((cat) => (
            <Card key={cat.id} className={!cat.is_active ? 'opacity-50' : ''}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cat.name}</span>
                      {cat.requires_escalation && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          Escalates
                        </Badge>
                      )}
                      {!cat.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{cat.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Default: {cat.severity_default}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingCategory(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this category?')) {
                          deleteMutation.mutate(cat.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CategoryFormModal
        open={isCreateOpen || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingCategory(null);
          }
        }}
        category={editingCategory}
        onSave={(data) => {
          if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, updates: data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: IssueCategory | null;
  onSave: (data: Partial<IssueCategory>) => void;
  isSaving: boolean;
}

function CategoryFormModal({ open, onOpenChange, category, onSave, isSaving }: CategoryFormModalProps) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [severityDefault, setSeverityDefault] = useState(category?.severity_default || 'medium');
  const [requiresEscalation, setRequiresEscalation] = useState(category?.requires_escalation || false);
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [displayOrder, setDisplayOrder] = useState(category?.display_order || 0);

  // Reset form when category changes
  useState(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setSeverityDefault(category.severity_default);
      setRequiresEscalation(category.requires_escalation);
      setIsActive(category.is_active);
      setDisplayOrder(category.display_order);
    } else {
      setName('');
      setDescription('');
      setSeverityDefault('medium');
      setRequiresEscalation(false);
      setIsActive(true);
      setDisplayOrder(0);
    }
  });

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      severity_default: severityDefault,
      requires_escalation: requiresEscalation,
      is_active: isActive,
      display_order: displayOrder,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'Create Category'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Quest logistics"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this category"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Default Severity</Label>
            <Select value={severityDefault} onValueChange={setSeverityDefault}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Display Order</Label>
            <Input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Requires Escalation</Label>
              <p className="text-xs text-muted-foreground">Auto-set urgency to urgent</p>
            </div>
            <Switch checked={requiresEscalation} onCheckedChange={setRequiresEscalation} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Active</Label>
              <p className="text-xs text-muted-foreground">Show in user dropdown</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !name.trim()}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {category ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
