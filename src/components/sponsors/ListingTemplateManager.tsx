/**
 * ListingTemplateManager - Save and load listing templates for sponsors
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  ChevronDown,
  Loader2,
  FileText
} from 'lucide-react';

export interface ListingTemplate {
  id: string;
  name: string;
  quest_type: string;
  budget_range: string;
  description: string;
  target_audience: { age_ranges: string[]; interests: string[] };
  creator_requirements: string;
  includes_branding: boolean;
  created_at: string;
}

interface ListingTemplateManagerProps {
  sponsorId: string;
  currentData: {
    quest_type: string;
    budget_range: string;
    description: string;
    target_audience: { age_ranges: string[]; interests: string[] };
    creator_requirements: string;
    includes_branding: boolean;
  };
  onLoadTemplate: (template: ListingTemplate) => void;
}

export function ListingTemplateManager({
  sponsorId,
  currentData,
  onLoadTemplate,
}: ListingTemplateManagerProps) {
  const queryClient = useQueryClient();
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateToDelete, setTemplateToDelete] = useState<ListingTemplate | null>(null);

  // Fetch templates from sponsor_profiles.listing_templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['listing-templates', sponsorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('listing_templates')
        .eq('id', sponsorId)
        .single();
      
      if (error) throw error;
      const templates = data?.listing_templates;
      if (!templates || !Array.isArray(templates)) return [];
      return templates as unknown as ListingTemplate[];
    },
    enabled: !!sponsorId,
  });

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async (name: string) => {
      const newTemplate: ListingTemplate = {
        id: crypto.randomUUID(),
        name,
        quest_type: currentData.quest_type,
        budget_range: currentData.budget_range,
        description: currentData.description,
        target_audience: currentData.target_audience,
        creator_requirements: currentData.creator_requirements,
        includes_branding: currentData.includes_branding,
        created_at: new Date().toISOString(),
      };

      const updatedTemplates = [...templates, newTemplate];

      const { error } = await supabase
        .from('sponsor_profiles')
        .update({ listing_templates: JSON.parse(JSON.stringify(updatedTemplates)) })
        .eq('id', sponsorId);

      if (error) throw error;
      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-templates', sponsorId] });
      toast.success('Template saved!');
      setIsSaveOpen(false);
      setTemplateName('');
    },
    onError: () => {
      toast.error('Failed to save template');
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const updatedTemplates = templates.filter(t => t.id !== templateId);

      const { error } = await supabase
        .from('sponsor_profiles')
        .update({ listing_templates: JSON.parse(JSON.stringify(updatedTemplates)) })
        .eq('id', sponsorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-templates', sponsorId] });
      toast.success('Template deleted');
      setIsDeleteOpen(false);
      setTemplateToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete template');
    },
  });

  const handleSave = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    saveMutation.mutate(templateName.trim());
  };

  const handleLoad = (template: ListingTemplate) => {
    onLoadTemplate(template);
    toast.success(`Loaded template: ${template.name}`);
  };

  const handleDeleteClick = (template: ListingTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplateToDelete(template);
    setIsDeleteOpen(true);
  };

  const hasData = currentData.quest_type || currentData.description || currentData.budget_range;

  return (
    <div className="flex items-center gap-2">
      {/* Load Template Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={templates.length === 0 && !isLoading}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Load Template
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </div>
          ) : templates.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No saved templates
            </div>
          ) : (
            templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                className="flex items-center justify-between group cursor-pointer"
                onClick={() => handleLoad(template)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{template.name}</p>
                    <div className="flex gap-1">
                      {template.quest_type && (
                        <Badge variant="outline" className="text-xs py-0">
                          {template.quest_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={(e) => handleDeleteClick(template, e)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
          {templates.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2 text-xs text-muted-foreground text-center">
                {templates.length} template{templates.length !== 1 ? 's' : ''} saved
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Template Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsSaveOpen(true)}
        disabled={!hasData}
      >
        <Save className="h-4 w-4 mr-2" />
        Save Template
      </Button>

      {/* Save Template Dialog */}
      <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save your current listing configuration for reuse
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Fitness Event Sponsorship"
                autoFocus
              />
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
              <p className="font-medium">Will save:</p>
              <ul className="text-muted-foreground space-y-0.5">
                {currentData.quest_type && <li>• Quest type: {currentData.quest_type}</li>}
                {currentData.budget_range && <li>• Budget range</li>}
                {currentData.description && <li>• Description</li>}
                {(currentData.target_audience?.age_ranges?.length > 0 || 
                  currentData.target_audience?.interests?.length > 0) && (
                  <li>• Target audience</li>
                )}
                {currentData.creator_requirements && <li>• Creator requirements</li>}
                {currentData.includes_branding && <li>• Branding included</li>}
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSaveOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!templateName.trim() || saveMutation.isPending}
              >
                {saveMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => templateToDelete && deleteMutation.mutate(templateToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
