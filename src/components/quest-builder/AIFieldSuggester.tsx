/**
 * AI Field Suggester
 * 
 * A reusable component that provides AI-powered suggestions for text fields.
 * Shows a "Suggest with AI" button that generates contextual content.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Check, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIFieldSuggesterProps {
  fieldName: string;
  fieldLabel: string;
  currentValue: string;
  onSuggestion: (value: string) => void;
  questContext: {
    title: string;
    theme?: string;
    progression_tree?: string;
    short_description?: string;
    constraints_physical_intensity?: string;
    constraints_social_intensity?: string;
    constraints_indoor_outdoor?: string;
    constraints_age_requirement?: string;
  };
  placeholder?: string;
}

export function AIFieldSuggester({
  fieldName,
  fieldLabel,
  currentValue,
  onSuggestion,
  questContext,
  placeholder
}: AIFieldSuggesterProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);

  const generateSuggestion = async () => {
    if (!questContext.title) {
      toast.error('Please fill in the quest title first');
      return;
    }

    setIsGenerating(true);
    setSuggestion(null);
    setIsApplied(false);

    try {
      const { data, error } = await supabase.functions.invoke('generate-field-suggestion', {
        body: {
          field_name: fieldName,
          field_label: fieldLabel,
          quest_context: questContext,
          current_value: currentValue
        }
      });

      if (error) throw error;

      if (data?.suggestion) {
        setSuggestion(data.suggestion);
      } else {
        toast.error('No suggestion generated');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      toast.error('Failed to generate suggestion. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const applySuggestion = () => {
    if (suggestion) {
      onSuggestion(suggestion);
      setIsApplied(true);
      toast.success(`${fieldLabel} updated`);
    }
  };

  const regenerate = () => {
    setSuggestion(null);
    setIsApplied(false);
    generateSuggestion();
  };

  if (suggestion && !isApplied) {
    return (
      <div className="mt-2 p-3 rounded-lg border border-creator/30 bg-creator/5 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-creator">
          <Sparkles className="w-4 h-4" />
          AI Suggestion
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{suggestion}</p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={applySuggestion}
            className="bg-creator hover:bg-creator/90"
          >
            <Check className="w-3 h-3 mr-1" />
            Apply
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={regenerate}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Regenerate
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setSuggestion(null)}
          >
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={generateSuggestion}
      disabled={isGenerating}
      className="mt-1 text-creator hover:text-creator hover:bg-creator/10"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3 mr-1" />
          {placeholder || 'Suggest with AI'}
        </>
      )}
    </Button>
  );
}
