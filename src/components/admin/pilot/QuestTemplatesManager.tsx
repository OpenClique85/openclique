/**
 * Quest Templates Manager
 * 
 * Admin component for creating and managing reusable quest templates.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { 
  Plus, FileText, Edit, Trash2, Loader2, 
  Copy, Users, Clock
} from 'lucide-react';

interface QuestTemplate {
  id: string;
  slug: string;
  title: string;
  icon: string;
  description: string | null;
  short_description: string | null;
  default_capacity: number;
  default_duration_minutes: number;
  default_squad_size: number;
  progression_tree: string | null;
  tags: string[];
  theme_color: string;
  what_to_bring: string | null;
  safety_notes: string | null;
  is_active: boolean;
  created_at: string;
}

const ICONS = ['🎯', '🎭', '🎨', '🎪', '🎸', '🍺', '☕', '🌮', '🚴', '🧘', '🏃', '⛺', '🌳', '🏖️', '🎬', '📚', '🎮', '🤝', '💃', '🎤'];

export function QuestTemplatesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuestTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    icon: '🎯',
    description: '',
    short_description: '',
    default_capacity: 24,
    default_duration_minutes: 120,
    default_squad_size: 6,
    progression_tree: '',
    theme_color: 'pink',
    what_to_bring: '',
    safety_notes: '',
  });

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['quest-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as QuestTemplate[];
    },
  });

  // Create/update template
  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      const payload = {
        ...formData,
        slug,
        progression_tree: formData.progression_tree || null,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('quest_templates')
          .update(payload)
          .eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('quest_templates')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quest-templates'] });
      setIsCreateOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast({ title: editingTemplate ? 'Template updated!' : 'Template created!' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to save template', description: err.message, variant: 'destructive' });
    }
  });

  // Delete template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quest_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quest-templates'] });
      toast({ title: 'Template deleted' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      icon: '🎯',
      description: '',
      short_description: '',
      default_capacity: 24,
      default_duration_minutes: 120,
      default_squad_size: 6,
      progression_tree: '',
      theme_color: 'pink',
      what_to_bring: '',
      safety_notes: '',
    });
  };

  const openEdit = (template: QuestTemplate) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      icon: template.icon,
      description: template.description || '',
      short_description: template.short_description || '',
      default_capacity: template.default_capacity,
      default_duration_minutes: template.default_duration_minutes,
      default_squad_size: template.default_squad_size,
      progression_tree: template.progression_tree || '',
      theme_color: template.theme_color,
      what_to_bring: template.what_to_bring || '',
      safety_notes: template.safety_notes || '',
    });
    setIsCreateOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Quest Templates</h2>
          <p className="text-sm text-muted-foreground">Reusable quest definitions</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      {templates && templates.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className={!template.is_active ? 'opacity-50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{template.icon}</span>
                    <CardTitle className="text-base">{template.title}</CardTitle>
                  </div>
                  <Badge variant="outline">{template.slug}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.short_description || template.description || 'No description'}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {template.default_capacity}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.round(template.default_duration_minutes / 60)}h
                  </span>
                  {template.progression_tree && (
                    <Badge variant="secondary" className="text-xs">
                      {template.progression_tree}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => openEdit(template)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this template?')) {
                        deleteMutation.mutate(template.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Templates</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first quest template to get started.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingTemplate(null);
          resetForm();
        }
        setIsCreateOpen(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              Define a reusable quest structure that can be scheduled as instances.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Title & Icon */}
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Quest title"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Short Description</Label>
              <Input
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="One-liner description"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Full Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed quest description..."
                rows={4}
              />
            </div>

            {/* Defaults */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={formData.default_capacity}
                  onChange={(e) => setFormData({ ...formData, default_capacity: parseInt(e.target.value) || 24 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={formData.default_duration_minutes}
                  onChange={(e) => setFormData({ ...formData, default_duration_minutes: parseInt(e.target.value) || 120 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Squad Size</Label>
                <Input
                  type="number"
                  value={formData.default_squad_size}
                  onChange={(e) => setFormData({ ...formData, default_squad_size: parseInt(e.target.value) || 6 })}
                />
              </div>
            </div>

            {/* Categorization */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Progression Tree</Label>
                <Select value={formData.progression_tree} onValueChange={(v) => setFormData({ ...formData, progression_tree: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="culture">🎭 Culture Vulture</SelectItem>
                    <SelectItem value="wellness">🧘 Wellness Warrior</SelectItem>
                    <SelectItem value="connector">🤝 Social Connector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Theme Color</Label>
                <Select value={formData.theme_color} onValueChange={(v) => setFormData({ ...formData, theme_color: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pink">Pink</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="amber">Amber</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Participant Info */}
            <div className="space-y-2">
              <Label>What to Bring</Label>
              <Textarea
                value={formData.what_to_bring}
                onChange={(e) => setFormData({ ...formData, what_to_bring: e.target.value })}
                placeholder="List items participants should bring..."
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Safety Notes</Label>
              <Textarea
                value={formData.safety_notes}
                onChange={(e) => setFormData({ ...formData, safety_notes: e.target.value })}
                placeholder="Important safety information..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !formData.title}
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
