/**
 * PilotTemplatesManager - Template management for reusable pilot configurations
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Loader2, FileText, Edit, Trash2, Copy, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface PilotTemplate {
  id: string;
  name: string;
  description: string | null;
  default_duration_days: number;
  hypothesis_template: string | null;
  success_criteria_template: Array<{ metric: string; target: string; description: string }>;
  suggested_metrics: string[];
  created_at: string;
}

export function PilotTemplatesManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PilotTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_duration_days: 28,
    hypothesis_template: '',
    success_criteria: [{ metric: '', target: '', description: '' }],
    suggested_metrics: [] as string[],
  });

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['pilot-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pilot_templates' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as PilotTemplate[];
    },
  });

  // Create template mutation
  const createTemplate = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('pilot_templates').insert({
        name: data.name,
        description: data.description || null,
        default_duration_days: data.default_duration_days,
        hypothesis_template: data.hypothesis_template || null,
        success_criteria_template: data.success_criteria.filter(c => c.metric),
        suggested_metrics: data.suggested_metrics,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot-templates'] });
      toast({ title: 'Template created' });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update template mutation
  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<typeof formData>) => {
      const { error } = await supabase.from('pilot_templates').update({
        name: data.name,
        description: data.description || null,
        default_duration_days: data.default_duration_days,
        hypothesis_template: data.hypothesis_template || null,
        success_criteria_template: data.success_criteria?.filter(c => c.metric),
        suggested_metrics: data.suggested_metrics,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot-templates'] });
      toast({ title: 'Template updated' });
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete template mutation
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pilot_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot-templates'] });
      toast({ title: 'Template deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      default_duration_days: 28,
      hypothesis_template: '',
      success_criteria: [{ metric: '', target: '', description: '' }],
      suggested_metrics: [],
    });
  };

  const loadTemplateForEdit = (template: PilotTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      default_duration_days: template.default_duration_days,
      hypothesis_template: template.hypothesis_template || '',
      success_criteria: template.success_criteria_template?.length 
        ? template.success_criteria_template 
        : [{ metric: '', target: '', description: '' }],
      suggested_metrics: template.suggested_metrics || [],
    });
    setEditingTemplate(template);
  };

  const duplicateTemplate = (template: PilotTemplate) => {
    setFormData({
      name: `${template.name} (Copy)`,
      description: template.description || '',
      default_duration_days: template.default_duration_days,
      hypothesis_template: template.hypothesis_template || '',
      success_criteria: template.success_criteria_template?.length 
        ? template.success_criteria_template 
        : [{ metric: '', target: '', description: '' }],
      suggested_metrics: template.suggested_metrics || [],
    });
    setIsCreateOpen(true);
  };

  const addCriterion = () => {
    setFormData({
      ...formData,
      success_criteria: [...formData.success_criteria, { metric: '', target: '', description: '' }],
    });
  };

  const removeCriterion = (index: number) => {
    setFormData({
      ...formData,
      success_criteria: formData.success_criteria.filter((_, i) => i !== index),
    });
  };

  const updateCriterion = (index: number, field: string, value: string) => {
    const updated = [...formData.success_criteria];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, success_criteria: updated });
  };

  const METRIC_OPTIONS = ['retention', 'growth', 'satisfaction', 'engagement', 'virality', 'completion'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Pilot Templates
          </h2>
          <p className="text-muted-foreground">Reusable configurations for future pilot programs</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Pilot Template</DialogTitle>
              <DialogDescription>
                Define a reusable template for future pilot programs
              </DialogDescription>
            </DialogHeader>
            <TemplateForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={() => createTemplate.mutate(formData)}
              onCancel={() => setIsCreateOpen(false)}
              isLoading={createTemplate.isPending}
              submitLabel="Create Template"
              addCriterion={addCriterion}
              removeCriterion={removeCriterion}
              updateCriterion={updateCriterion}
              metricOptions={METRIC_OPTIONS}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3" />
                    {template.default_duration_days} days default
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
              )}

              {/* Success criteria count */}
              {template.success_criteria_template?.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {template.success_criteria_template.length} success criteria defined
                </p>
              )}

              {/* Suggested metrics */}
              {template.suggested_metrics?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.suggested_metrics.map((metric, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {metric}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => loadTemplateForEdit(template)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => duplicateTemplate(template)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete this template?')) {
                      deleteTemplate.mutate(template.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!templates || templates.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No templates yet</p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <TemplateForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={() => updateTemplate.mutate({ id: editingTemplate.id, ...formData })}
              onCancel={() => setEditingTemplate(null)}
              isLoading={updateTemplate.isPending}
              submitLabel="Save Changes"
              addCriterion={addCriterion}
              removeCriterion={removeCriterion}
              updateCriterion={updateCriterion}
              metricOptions={METRIC_OPTIONS}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Form component
interface TemplateFormProps {
  formData: {
    name: string;
    description: string;
    default_duration_days: number;
    hypothesis_template: string;
    success_criteria: Array<{ metric: string; target: string; description: string }>;
    suggested_metrics: string[];
  };
  setFormData: (data: TemplateFormProps['formData']) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
  addCriterion: () => void;
  removeCriterion: (index: number) => void;
  updateCriterion: (index: number, field: string, value: string) => void;
  metricOptions: string[];
}

function TemplateForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
  addCriterion,
  removeCriterion,
  updateCriterion,
  metricOptions,
}: TemplateFormProps) {
  const toggleMetric = (metric: string) => {
    const updated = formData.suggested_metrics.includes(metric)
      ? formData.suggested_metrics.filter(m => m !== metric)
      : [...formData.suggested_metrics, metric];
    setFormData({ ...formData, suggested_metrics: updated });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Standard 4-Week Pilot"
            required
          />
        </div>
        <div>
          <Label htmlFor="duration">Default Duration (days)</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            value={formData.default_duration_days}
            onChange={(e) => setFormData({ ...formData, default_duration_days: parseInt(e.target.value) || 28 })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this template..."
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="hypothesis">Hypothesis Template</Label>
        <Textarea
          id="hypothesis"
          value={formData.hypothesis_template}
          onChange={(e) => setFormData({ ...formData, hypothesis_template: e.target.value })}
          placeholder="If we provide [intervention], users will [expected behavior]..."
          rows={3}
        />
      </div>

      {/* Success Criteria Template */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Success Criteria Template</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {formData.success_criteria.map((criterion, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4">
                <Input
                  placeholder="Metric name"
                  value={criterion.metric}
                  onChange={(e) => updateCriterion(index, 'metric', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Target"
                  value={criterion.target}
                  onChange={(e) => updateCriterion(index, 'target', e.target.value)}
                />
              </div>
              <div className="col-span-5">
                <Input
                  placeholder="Description"
                  value={criterion.description}
                  onChange={(e) => updateCriterion(index, 'description', e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="col-span-1"
                onClick={() => removeCriterion(index)}
                disabled={formData.success_criteria.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Metrics */}
      <div>
        <Label>Suggested Metrics</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {metricOptions.map((metric) => (
            <Badge
              key={metric}
              variant={formData.suggested_metrics.includes(metric) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleMetric(metric)}
            >
              {metric}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
