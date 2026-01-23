import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Json } from '@/integrations/supabase/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Save, 
  Trash2, 
  Loader2,
  BookmarkPlus,
  FolderOpen
} from 'lucide-react';

export interface ProposalTemplate {
  id: string;
  name: string;
  message: string;
  budget_or_reward: string;
  created_at: string;
}

interface ProposalTemplateManagerProps {
  sponsorId: string;
  currentMessage: string;
  currentBudget: string;
  onLoadTemplate: (template: ProposalTemplate) => void;
}

export function ProposalTemplateManager({
  sponsorId,
  currentMessage,
  currentBudget,
  onLoadTemplate,
}: ProposalTemplateManagerProps) {
  const queryClient = useQueryClient();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateToDelete, setTemplateToDelete] = useState<ProposalTemplate | null>(null);

  // Fetch templates from sponsor profile
  const { data: templates, isLoading } = useQuery({
    queryKey: ['proposal-templates', sponsorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('proposal_templates')
        .eq('id', sponsorId)
        .single();
      
      if (error) throw error;
      const rawTemplates = data?.proposal_templates;
      if (Array.isArray(rawTemplates)) {
        return rawTemplates as unknown as ProposalTemplate[];
      }
      return [];
    },
    enabled: !!sponsorId,
  });

  // Save template mutation
  const saveTemplate = useMutation({
    mutationFn: async (newTemplate: Omit<ProposalTemplate, 'id' | 'created_at'>) => {
      const template: ProposalTemplate = {
        ...newTemplate,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      
      const updatedTemplates = [...(templates || []), template];
      
      const { error } = await supabase
        .from('sponsor_profiles')
        .update({ proposal_templates: updatedTemplates as unknown as Json })
        .eq('id', sponsorId);
      
      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      toast.success('Template saved!');
      queryClient.invalidateQueries({ queryKey: ['proposal-templates', sponsorId] });
      setSaveDialogOpen(false);
      setTemplateName('');
    },
    onError: () => {
      toast.error('Failed to save template');
    },
  });

  // Delete template mutation
  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const updatedTemplates = (templates || []).filter(t => t.id !== templateId);
      
      const { error } = await supabase
        .from('sponsor_profiles')
        .update({ proposal_templates: updatedTemplates as unknown as Json })
        .eq('id', sponsorId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['proposal-templates', sponsorId] });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete template');
    },
  });

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    if (!currentMessage.trim()) {
      toast.error('Cannot save empty message as template');
      return;
    }
    
    saveTemplate.mutate({
      name: templateName.trim(),
      message: currentMessage,
      budget_or_reward: currentBudget,
    });
  };

  const handleLoadTemplate = (template: ProposalTemplate) => {
    onLoadTemplate(template);
    setLoadDialogOpen(false);
    toast.success(`Loaded template: ${template.name}`);
  };

  const handleDeleteClick = (template: ProposalTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const hasTemplates = templates && templates.length > 0;
  const canSave = currentMessage.trim().length > 0;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Load Template Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setLoadDialogOpen(true)}
        disabled={!hasTemplates}
        className="gap-1"
      >
        <FolderOpen className="h-3.5 w-3.5" />
        Load Template
        {hasTemplates && (
          <Badge variant="secondary" className="ml-1 text-xs">
            {templates.length}
          </Badge>
        )}
      </Button>

      {/* Save as Template Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setSaveDialogOpen(true)}
        disabled={!canSave}
        className="gap-1"
      >
        <BookmarkPlus className="h-3.5 w-3.5" />
        Save as Template
      </Button>

      {/* Save Template Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save your current message and budget as a reusable template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Standard Quest Sponsorship"
              />
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Message Preview:</p>
              <p className="text-muted-foreground line-clamp-3">{currentMessage}</p>
              {currentBudget && (
                <>
                  <p className="font-medium mt-2 mb-1">Budget/Offering:</p>
                  <p className="text-muted-foreground">{currentBudget}</p>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={saveTemplate.isPending}>
              {saveTemplate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Load Template</DialogTitle>
            <DialogDescription>
              Choose a saved template to use for your proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleLoadTemplate(template)}
                  >
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {template.message}
                      </p>
                      {template.budget_or_reward && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {template.budget_or_reward}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteClick(template, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No templates saved yet</p>
                <p className="text-sm mt-1">
                  Save your first template when creating a proposal
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{templateToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => templateToDelete && deleteTemplate.mutate(templateToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTemplate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
