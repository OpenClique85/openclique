/**
 * PilotProgramsManager - CRUD interface for pilot programs
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Calendar, Edit, BarChart3, Loader2, FlaskConical, Target, Trash2 } from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore, parseISO } from 'date-fns';

interface PilotProgram {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  hypothesis: string | null;
  success_criteria: Array<{ metric: string; target: string; description: string }>;
  start_date: string;
  end_date: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  org_id: string | null;
  created_at: string;
}

interface PilotTemplate {
  id: string;
  name: string;
  hypothesis_template: string | null;
  success_criteria_template: Array<{ metric: string; target: string; description: string }>;
  default_duration_days: number;
}

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function PilotProgramsManager() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPilot, setEditingPilot] = useState<PilotProgram | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    hypothesis: '',
    start_date: '',
    end_date: '',
    success_criteria: [{ metric: '', target: '', description: '' }],
  });

  // Fetch pilots
  const { data: pilots, isLoading } = useQuery({
    queryKey: ['pilot-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pilot_programs' as any)
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as unknown as PilotProgram[];
    },
  });

  // Fetch templates for "Create from Template" dropdown
  const { data: templates } = useQuery({
    queryKey: ['pilot-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pilot_templates' as any)
        .select('*')
        .order('name');
      if (error) throw error;
      return data as unknown as PilotTemplate[];
    },
  });

  // Create pilot mutation
  const createPilot = useMutation({
    mutationFn: async (data: typeof formData) => {
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { error } = await supabase.from('pilot_programs').insert({
        name: data.name,
        slug,
        description: data.description || null,
        hypothesis: data.hypothesis || null,
        start_date: data.start_date,
        end_date: data.end_date,
        success_criteria: data.success_criteria.filter(c => c.metric),
        status: 'planned',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot-programs'] });
      toast({ title: 'Pilot created', description: 'New pilot program has been created.' });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update pilot mutation
  const updatePilot = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<PilotProgram>) => {
      const { error } = await supabase.from('pilot_programs').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot-programs'] });
      toast({ title: 'Pilot updated' });
      setEditingPilot(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete pilot mutation
  const deletePilot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pilot_programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot-programs'] });
      toast({ title: 'Pilot deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      hypothesis: '',
      start_date: '',
      end_date: '',
      success_criteria: [{ metric: '', target: '', description: '' }],
    });
    setSelectedTemplateId('');
  };

  const loadTemplate = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + template.default_duration_days);
      
      setFormData({
        ...formData,
        hypothesis: template.hypothesis_template || '',
        success_criteria: template.success_criteria_template?.length 
          ? template.success_criteria_template 
          : [{ metric: '', target: '', description: '' }],
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });
    }
    setSelectedTemplateId(templateId);
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

  const getPilotProgress = (pilot: PilotProgram) => {
    const now = new Date();
    const start = parseISO(pilot.start_date);
    const end = parseISO(pilot.end_date);
    
    if (isBefore(now, start)) return 0;
    if (isAfter(now, end)) return 100;
    
    const total = differenceInDays(end, start);
    const elapsed = differenceInDays(now, start);
    return Math.round((elapsed / total) * 100);
  };

  const getDaysInfo = (pilot: PilotProgram) => {
    const now = new Date();
    const start = parseISO(pilot.start_date);
    const end = parseISO(pilot.end_date);
    
    if (isBefore(now, start)) {
      return `Starts in ${differenceInDays(start, now)} days`;
    }
    if (isAfter(now, end)) {
      return 'Completed';
    }
    return `${differenceInDays(end, now)} days remaining`;
  };

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
            <FlaskConical className="h-6 w-6 text-primary" />
            Pilot Programs
          </h2>
          <p className="text-muted-foreground">Manage structured pilot programs with time-gated metrics</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Pilot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Pilot Program</DialogTitle>
              <DialogDescription>
                Define a new pilot program with dates and success criteria
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createPilot.mutate(formData); }} className="space-y-4">
              {/* Template Selector */}
              {templates && templates.length > 0 && (
                <div>
                  <Label>Start from Template (Optional)</Label>
                  <Select value={selectedTemplateId} onValueChange={loadTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Pilot Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Pilot 1: Prove Retention"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="pilot-1-retention"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the pilot goals..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="hypothesis">Hypothesis</Label>
                <Textarea
                  id="hypothesis"
                  value={formData.hypothesis}
                  onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                  placeholder="If we provide [intervention], users will [expected behavior]..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Success Criteria */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Success Criteria</Label>
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

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPilot.isPending}>
                  {createPilot.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Pilot
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pilot Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pilots?.map((pilot) => (
          <Card key={pilot.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{pilot.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(pilot.start_date), 'MMM d')} - {format(parseISO(pilot.end_date), 'MMM d, yyyy')}
                  </CardDescription>
                </div>
                <Badge className={STATUS_COLORS[pilot.status]}>
                  {pilot.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pilot.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{pilot.description}</p>
              )}

              {/* Progress bar for active pilots */}
              {pilot.status === 'active' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{getDaysInfo(pilot)}</span>
                  </div>
                  <Progress value={getPilotProgress(pilot)} className="h-2" />
                </div>
              )}

              {/* Success criteria preview */}
              {pilot.success_criteria?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {pilot.success_criteria.length} success criteria
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a href={`#pilot-analytics?id=${pilot.id}`}>
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </a>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setEditingPilot(pilot)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Select
                  value={pilot.status}
                  onValueChange={(status) => updatePilot.mutate({ id: pilot.id, status: status as PilotProgram['status'] })}
                >
                  <SelectTrigger className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!pilots || pilots.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pilot programs yet</p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Pilot
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPilot} onOpenChange={() => setEditingPilot(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pilot: {editingPilot?.name}</DialogTitle>
          </DialogHeader>
          {editingPilot && (
            <div className="space-y-4">
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingPilot.description || ''}
                  onChange={(e) => setEditingPilot({ ...editingPilot, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label>Hypothesis</Label>
                <Textarea
                  value={editingPilot.hypothesis || ''}
                  onChange={(e) => setEditingPilot({ ...editingPilot, hypothesis: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Delete this pilot? This cannot be undone.')) {
                      deletePilot.mutate(editingPilot.id);
                      setEditingPilot(null);
                    }
                  }}
                >
                  Delete Pilot
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditingPilot(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => updatePilot.mutate({
                      id: editingPilot.id,
                      description: editingPilot.description,
                      hypothesis: editingPilot.hypothesis,
                    })}
                    disabled={updatePilot.isPending}
                  >
                    {updatePilot.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
