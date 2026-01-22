import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QuestFormData } from '../types';
import { Sparkles, Plus, X } from 'lucide-react';
import { useState } from 'react';

interface ExperienceStepProps {
  formData: QuestFormData;
  updateFormData: (updates: Partial<QuestFormData>) => void;
}

export function ExperienceStep({ formData, updateFormData }: ExperienceStepProps) {
  const [newHighlight, setNewHighlight] = useState('');

  const addHighlight = () => {
    if (newHighlight.trim()) {
      updateFormData({ highlights: [...formData.highlights, newHighlight.trim()] });
      setNewHighlight('');
    }
  };

  const removeHighlight = (index: number) => {
    updateFormData({ highlights: formData.highlights.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="bg-creator/5 border border-creator/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-creator mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Paint the picture!</p>
            <p className="text-sm text-muted-foreground">
              Help participants imagine themselves on this adventure. What makes it special?
            </p>
          </div>
        </div>
      </div>

      {/* Full Description */}
      <div className="space-y-2">
        <Label htmlFor="full_description" className="text-base font-medium">Full Description *</Label>
        <Textarea
          id="full_description"
          placeholder="Describe the full adventure... What will participants experience from start to finish? What's the vibe? Why is this quest unique?"
          value={formData.full_description}
          onChange={(e) => updateFormData({ full_description: e.target.value })}
          rows={8}
          className="min-h-[200px]"
        />
        <p className="text-sm text-muted-foreground">
          Be descriptive! This is your chance to get people excited.
        </p>
      </div>

      {/* Highlights */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Key Highlights</Label>
        <p className="text-sm text-muted-foreground">
          Bullet points that summarize the best parts of this experience.
        </p>
        
        {/* Existing highlights */}
        {formData.highlights.length > 0 && (
          <ul className="space-y-2">
            {formData.highlights.map((highlight, index) => (
              <li key={index} className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                <span className="text-creator">✓</span>
                <span className="flex-1">{highlight}</span>
                <button
                  type="button"
                  onClick={() => removeHighlight(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        
        {/* Add highlight */}
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Live music from local artists"
            value={newHighlight}
            onChange={(e) => setNewHighlight(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
          />
          <Button type="button" variant="outline" onClick={addHighlight} disabled={!newHighlight.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
