import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QuestFormData } from '../types';
import { 
  Sparkles, 
  Loader2, 
  Check, 
  Pencil, 
  Trash2, 
  RefreshCw,
  Plus,
  X,
  AlertCircle,
  Info
} from 'lucide-react';

interface AIDraftStepProps {
  formData: QuestFormData;
  updateFormData: (updates: Partial<QuestFormData>) => void;
}

interface QuestObjective {
  objective_text: string;
  objective_type: string;
  proof_type: string;
  completion_rule: string;
  is_required: boolean;
  ai_generated: boolean;
}

interface QuestRole {
  role_name: string;
  role_description: string;
  ai_generated: boolean;
}

interface PersonalityAffinity {
  trait_key: string;
  trait_weight: number;
  explanation: string;
  ai_generated: boolean;
}

interface AIDraft {
  short_teaser: string;
  full_description: string;
  objectives: QuestObjective[];
  roles: QuestRole[];
  suggested_tags: string[];
  personality_affinities: PersonalityAffinity[];
}

const OBJECTIVE_TYPES = [
  { value: 'task', label: 'Task' },
  { value: 'checkin', label: 'Check-in' },
  { value: 'photo', label: 'Photo' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'travel', label: 'Travel' },
  { value: 'purchase_optional', label: 'Purchase (Optional)' },
];

const PROOF_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'photo', label: 'Photo' },
  { value: 'text_confirmation', label: 'Text Confirmation' },
  { value: 'geo', label: 'Location Check-in' },
];

export function AIDraftStep({ formData, updateFormData }: AIDraftStepProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<AIDraft | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);

  const generateDraft = async () => {
    if (!formData.title) {
      toast({
        title: 'Title Required',
        description: 'Please add a title in Step 1 before generating a draft.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Not Authenticated',
          description: 'Please log in to use AI features.',
          variant: 'destructive',
        });
        return;
      }

      const response = await supabase.functions.invoke('generate-quest-draft', {
        body: {
          quest_basics: {
            title: formData.title,
            short_description: formData.short_description,
            theme: formData.theme,
            progression_tree: formData.progression_tree,
            tags: formData.tags,
            meeting_location_name: formData.meeting_location_name,
            city: formData.meeting_address?.split(',').pop()?.trim(),
            start_datetime: formData.start_datetime,
            duration_minutes: formData.default_duration_minutes,
          },
          quest_constraints: {
            alcohol: formData.constraints_alcohol || 'none',
            age_requirement: formData.constraints_age_requirement || 'all_ages',
            physical_intensity: formData.constraints_physical_intensity || 'medium',
            social_intensity: formData.constraints_social_intensity || 'moderate',
            noise_level: formData.constraints_noise_level || 'moderate',
            indoor_outdoor: formData.constraints_indoor_outdoor || 'mixed',
            budget_level: formData.constraints_budget_level || 'free',
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate draft');
      }

      const data = response.data;
      if (data.rate_limit_remaining !== undefined) {
        setRateLimitRemaining(data.rate_limit_remaining);
      }

      setDraft(data.draft);
      toast({
        title: 'Draft Generated!',
        description: 'Review the AI suggestions below. Edit anything you like.',
      });
    } catch (error: any) {
      console.error('AI generation error:', error);
      
      if (error.message?.includes('Rate limit')) {
        toast({
          title: 'Rate Limit Reached',
          description: 'Maximum 5 AI drafts per hour. Try again later.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Generation Failed',
          description: error.message || 'Could not generate draft. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const applyDraft = () => {
    if (!draft) return;

    updateFormData({
      short_description: formData.short_description || draft.short_teaser,
      full_description: formData.full_description || draft.full_description,
      // Store objectives, roles, and affinities in temporary form state
      // These will be saved to separate tables when the quest is created
      ai_draft_objectives: draft.objectives,
      ai_draft_roles: draft.roles,
      ai_draft_personality_affinities: draft.personality_affinities,
      ai_draft_suggested_tags: draft.suggested_tags,
      ai_generated: true,
      ai_version: 'v1.0.0',
    });

    toast({
      title: 'Draft Applied!',
      description: 'AI suggestions added to your quest. Continue editing or move to the next step.',
    });
  };

  const discardDraft = () => {
    setDraft(null);
  };

  const updateDraftSection = <K extends keyof AIDraft>(key: K, value: AIDraft[K]) => {
    if (draft) {
      setDraft({ ...draft, [key]: value });
    }
  };

  const removeObjective = (index: number) => {
    if (draft) {
      updateDraftSection('objectives', draft.objectives.filter((_, i) => i !== index));
    }
  };

  const addObjective = () => {
    if (draft) {
      updateDraftSection('objectives', [
        ...draft.objectives,
        {
          objective_text: '',
          objective_type: 'task',
          proof_type: 'none',
          completion_rule: 'all_members',
          is_required: true,
          ai_generated: false,
        },
      ]);
    }
  };

  const updateObjective = (index: number, updates: Partial<QuestObjective>) => {
    if (draft) {
      const newObjectives = [...draft.objectives];
      newObjectives[index] = { ...newObjectives[index], ...updates };
      updateDraftSection('objectives', newObjectives);
    }
  };

  const removeRole = (index: number) => {
    if (draft) {
      updateDraftSection('roles', draft.roles.filter((_, i) => i !== index));
    }
  };

  const removeTag = (index: number) => {
    if (draft) {
      updateDraftSection('suggested_tags', draft.suggested_tags.filter((_, i) => i !== index));
    }
  };

  const removeAffinity = (index: number) => {
    if (draft) {
      updateDraftSection('personality_affinities', draft.personality_affinities.filter((_, i) => i !== index));
    }
  };

  // Initial state - no draft yet
  if (!draft) {
    return (
      <div className="space-y-6">
        <div className="bg-creator/5 border border-creator/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-creator mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Draft with AI (optional)</p>
              <p className="text-sm text-muted-foreground">
                We'll generate a strong first version. You approve everything.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center py-8 space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-creator/10">
            <Sparkles className="w-8 h-8 text-creator" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Let AI help you get started</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Based on your quest basics and constraints, we'll suggest a teaser, 
              description, objectives, roles, and matching traits.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={generateDraft}
              disabled={isGenerating}
              className="gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Draft with AI
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => updateFormData({ ai_skipped: true })}
            >
              Skip and write manually
            </Button>
          </div>

          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Info className="w-3 h-3" />
            AI suggestions are editable. Nothing is published until you submit and an admin approves.
          </p>
          
          {rateLimitRemaining !== null && (
            <p className="text-xs text-muted-foreground">
              {rateLimitRemaining} AI drafts remaining this hour
            </p>
          )}
        </div>
      </div>
    );
  }

  // Draft generated - show editable sections
  return (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">AI Draft Ready for Review</p>
            <p className="text-sm text-muted-foreground">
              Edit, remove, or regenerate any section. Click "Apply Draft" when you're happy.
            </p>
          </div>
        </div>
      </div>

      {/* Teaser */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              Teaser
              <Badge variant="outline" className="text-xs">AI</Badge>
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'teaser' ? null : 'teaser')}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={generateDraft} disabled={isGenerating}>
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'teaser' ? (
            <div className="space-y-2">
              <Textarea
                value={draft.short_teaser}
                onChange={(e) => updateDraftSection('short_teaser', e.target.value)}
                rows={3}
              />
              <Button size="sm" onClick={() => setEditingSection(null)}>
                <Check className="w-4 h-4 mr-1" /> Done
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">{draft.short_teaser}</p>
          )}
        </CardContent>
      </Card>

      {/* Full Description */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              Full Description
              <Badge variant="outline" className="text-xs">AI</Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingSection(editingSection === 'description' ? null : 'description')}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'description' ? (
            <div className="space-y-2">
              <Textarea
                value={draft.full_description}
                onChange={(e) => updateDraftSection('full_description', e.target.value)}
                rows={8}
              />
              <Button size="sm" onClick={() => setEditingSection(null)}>
                <Check className="w-4 h-4 mr-1" /> Done
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">{draft.full_description}</p>
          )}
        </CardContent>
      </Card>

      {/* Objectives */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              Objectives
              <Badge variant="outline" className="text-xs">AI</Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={addObjective}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.objectives.map((objective, index) => (
            <div key={index} className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Input
                  value={objective.objective_text}
                  onChange={(e) => updateObjective(index, { objective_text: e.target.value })}
                  placeholder="Objective description..."
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeObjective(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select
                  value={objective.objective_type}
                  onValueChange={(value) => updateObjective(index, { objective_type: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBJECTIVE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={objective.proof_type}
                  onValueChange={(value) => updateObjective(index, { proof_type: value })}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROOF_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Roles */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Roles (optional)
            <Badge variant="outline" className="text-xs">AI</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Roles help squads click faster.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {draft.roles.map((role, index) => (
            <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{role.role_name}</p>
                <p className="text-xs text-muted-foreground">{role.role_description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRole(index)}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Tags & vibe
            <Badge variant="outline" className="text-xs">AI</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Tags power discovery + matching.</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {draft.suggested_tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="gap-1 pr-1">
                {tag}
                <button
                  onClick={() => removeTag(index)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personality Affinities */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            "Works best for..." (matching hints)
            <Badge variant="outline" className="text-xs">AI</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This helps the algorithm recommend your quest to the right people.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {draft.personality_affinities.map((affinity, index) => (
            <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
              <div className="flex-1">
                <p className="text-sm">{affinity.explanation}</p>
                <p className="text-xs text-muted-foreground">
                  Trait: {affinity.trait_key} • Weight: {affinity.trait_weight}%
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAffinity(index)}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button onClick={applyDraft} className="gap-2">
          <Check className="w-4 h-4" />
          Apply Draft to My Quest
        </Button>
        <Button variant="outline" onClick={discardDraft}>
          Discard Draft
        </Button>
      </div>
    </div>
  );
}
