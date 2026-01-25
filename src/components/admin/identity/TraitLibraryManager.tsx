/**
 * =============================================================================
 * TRAIT LIBRARY MANAGER - Admin CRUD for trait taxonomy
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Pencil, Archive, Eye, Filter, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { auditLog } from '@/lib/auditLog';
import type { Tables } from '@/integrations/supabase/types';

type Trait = Tables<'trait_library'>;

const CATEGORIES = [
  { value: 'social_energy', label: 'Social Energy' },
  { value: 'planning_style', label: 'Planning Style' },
  { value: 'conversation_style', label: 'Conversation Style' },
  { value: 'pace_intensity', label: 'Pace & Intensity' },
  { value: 'adventure_preference', label: 'Adventure Preference' },
  { value: 'risk_novelty', label: 'Risk & Novelty' },
  { value: 'group_role', label: 'Group Roles' },
];

interface TraitFormData {
  slug: string;
  category: string;
  display_name: string;
  description: string;
  emoji: string;
  is_negative: boolean;
  is_active: boolean;
}

const defaultFormData: TraitFormData = {
  slug: '',
  category: 'social_energy',
  display_name: '',
  description: '',
  emoji: '',
  is_negative: false,
  is_active: true,
};

export function TraitLibraryManager() {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTrait, setEditingTrait] = useState<Trait | null>(null);
  const [previewTrait, setPreviewTrait] = useState<Trait | null>(null);
  const [formData, setFormData] = useState<TraitFormData>(defaultFormData);

  // Fetch all traits (admin sees all, including inactive)
  const { data: traits, isLoading } = useQuery({
    queryKey: ['trait-library', showInactive],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trait_library')
        .select('*')
        .order('category')
        .order('display_name');
      
      if (error) throw error;
      return data as Trait[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: TraitFormData) => {
      const { error } = await supabase
        .from('trait_library')
        .insert({
          slug: data.slug,
          category: data.category,
          display_name: data.display_name,
          description: data.description,
          emoji: data.emoji,
          is_negative: data.is_negative,
          is_active: data.is_active,
        });
      
      if (error) throw error;
      
      await auditLog({
        action: 'trait_create',
        targetTable: 'trait_library',
        targetId: data.slug,
        newValues: { ...data },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trait-library'] });
      toast.success('Trait created successfully');
      setIsCreateOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create trait: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data, oldData }: { id: string; data: Partial<TraitFormData>; oldData: Trait }) => {
      const { error } = await supabase
        .from('trait_library')
        .update({
          ...data,
          version: (oldData.version || 1) + 1,
        })
        .eq('id', id);
      
      if (error) throw error;
      
      await auditLog({
        action: 'trait_update',
        targetTable: 'trait_library',
        targetId: id,
        oldValues: { 
          display_name: oldData.display_name, 
          description: oldData.description,
          is_active: oldData.is_active,
        },
        newValues: { ...data },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trait-library'] });
      toast.success('Trait updated successfully');
      setEditingTrait(null);
      setFormData(defaultFormData);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update trait: ${error.message}`);
    },
  });

  // Deprecate mutation (soft delete)
  const deprecateMutation = useMutation({
    mutationFn: async (trait: Trait) => {
      const { error } = await supabase
        .from('trait_library')
        .update({ is_active: false })
        .eq('id', trait.id);
      
      if (error) throw error;
      
      await auditLog({
        action: 'trait_deprecate',
        targetTable: 'trait_library',
        targetId: trait.id,
        oldValues: { is_active: true },
        newValues: { is_active: false },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trait-library'] });
      toast.success('Trait deprecated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deprecate trait: ${error.message}`);
    },
  });

  const filteredTraits = traits?.filter(trait => {
    if (categoryFilter !== 'all' && trait.category !== categoryFilter) return false;
    if (!showInactive && !trait.is_active) return false;
    return true;
  });

  const handleCreate = () => {
    if (!formData.slug || !formData.display_name) {
      toast.error('Slug and display name are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingTrait) return;
    updateMutation.mutate({
      id: editingTrait.id,
      data: formData,
      oldData: editingTrait,
    });
  };

  const openEdit = (trait: Trait) => {
    setEditingTrait(trait);
    setFormData({
      slug: trait.slug,
      category: trait.category,
      display_name: trait.display_name,
      description: trait.description || '',
      emoji: trait.emoji || '',
      is_negative: trait.is_negative || false,
      is_active: trait.is_active ?? true,
    });
  };

  const getCategoryLabel = (value: string) => 
    CATEGORIES.find(c => c.value === value)?.label || value;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Trait Library</h2>
          <p className="text-muted-foreground">
            Manage the trait taxonomy used for AI-powered identity matching
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setFormData(defaultFormData)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Trait
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Trait</DialogTitle>
            </DialogHeader>
            <TraitForm 
              data={formData} 
              onChange={setFormData} 
              isCreate 
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Trait
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                id="show-inactive" 
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive" className="text-sm">
                Show deprecated
              </Label>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">
              {filteredTraits?.length || 0} traits
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traits Table */}
      <Card>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Emoji</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-16">v</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTraits?.map(trait => (
                <TableRow key={trait.id} className={!trait.is_active ? 'opacity-50' : ''}>
                  <TableCell className="text-xl">{trait.emoji}</TableCell>
                  <TableCell className="font-mono text-sm">{trait.slug}</TableCell>
                  <TableCell className="font-medium">{trait.display_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryLabel(trait.category)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">v{trait.version}</TableCell>
                  <TableCell>
                    {trait.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Deprecated</Badge>
                    )}
                    {trait.is_negative && (
                      <Badge variant="destructive" className="ml-1">Private</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewTrait(trait)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(trait)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {trait.is_active && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deprecateMutation.mutate(trait)}
                          title="Deprecate"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      {!trait.is_active && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateMutation.mutate({
                            id: trait.id,
                            data: { is_active: true },
                            oldData: trait,
                          })}
                          title="Restore"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTrait} onOpenChange={(open) => !open && setEditingTrait(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trait</DialogTitle>
          </DialogHeader>
          <TraitForm 
            data={formData} 
            onChange={setFormData} 
            isCreate={false} 
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTrait} onOpenChange={(open) => !open && setPreviewTrait(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trait Preview</DialogTitle>
          </DialogHeader>
          {previewTrait && <TraitPreview trait={previewTrait} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TraitFormProps {
  data: TraitFormData;
  onChange: (data: TraitFormData) => void;
  isCreate: boolean;
}

function TraitForm({ data, onChange, isCreate }: TraitFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (identifier)</Label>
          <Input
            id="slug"
            value={data.slug}
            onChange={(e) => onChange({ ...data, slug: e.target.value })}
            placeholder="cozy_energy"
            disabled={!isCreate}
          />
          {!isCreate && (
            <p className="text-xs text-muted-foreground">Slug cannot be changed</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="emoji">Emoji</Label>
          <Input
            id="emoji"
            value={data.emoji}
            onChange={(e) => onChange({ ...data, emoji: e.target.value })}
            placeholder="🏠"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          value={data.display_name}
          onChange={(e) => onChange({ ...data, display_name: e.target.value })}
          placeholder="Thrives in small, cozy groups"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select 
          value={data.category} 
          onValueChange={(value) => onChange({ ...data, category: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="You feel most comfortable and connected in intimate settings..."
          rows={3}
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="is_negative"
            checked={data.is_negative}
            onCheckedChange={(checked) => onChange({ ...data, is_negative: checked })}
          />
          <Label htmlFor="is_negative" className="text-sm">
            Private only (never shown publicly)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={data.is_active}
            onCheckedChange={(checked) => onChange({ ...data, is_active: checked })}
          />
          <Label htmlFor="is_active" className="text-sm">
            Active
          </Label>
        </div>
      </div>
    </div>
  );
}

function TraitPreview({ trait }: { trait: Trait }) {
  return (
    <div className="space-y-4">
      {/* User-facing card preview */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{trait.emoji}</span>
          <div>
            <h4 className="font-medium text-foreground">{trait.display_name}</h4>
            <p className="text-sm text-muted-foreground mt-1">{trait.description}</p>
          </div>
        </div>
      </div>

      {/* Badge preview */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">As a badge:</p>
        <div className="flex gap-2">
          <Badge variant="secondary" className="gap-1">
            {trait.emoji} {trait.display_name}
          </Badge>
        </div>
      </div>

      {/* Meta info */}
      <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
        <p><strong>Slug:</strong> <code className="bg-muted px-1 rounded">{trait.slug}</code></p>
        <p><strong>Category:</strong> {trait.category}</p>
        <p><strong>Version:</strong> {trait.version}</p>
        <p><strong>Created:</strong> {trait.created_at ? new Date(trait.created_at).toLocaleDateString() : 'N/A'}</p>
      </div>
    </div>
  );
}
