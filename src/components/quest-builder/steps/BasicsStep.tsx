import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QuestFormData, PROGRESSION_TREES, ICON_OPTIONS, TAG_SUGGESTIONS } from '../types';
import { X } from 'lucide-react';

interface BasicsStepProps {
  formData: QuestFormData;
  updateFormData: (updates: Partial<QuestFormData>) => void;
}

export function BasicsStep({ formData, updateFormData }: BasicsStepProps) {
  const addTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      updateFormData({ tags: [...formData.tags, tag] });
    }
  };

  const removeTag = (tag: string) => {
    updateFormData({ tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-medium">Quest Title *</Label>
        <Input
          id="title"
          placeholder="e.g., Sunrise Yoga at Zilker Park"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          className="text-lg"
        />
        <p className="text-sm text-muted-foreground">
          Choose a catchy, descriptive name that captures the adventure.
        </p>
      </div>

      {/* Icon */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Quest Icon</Label>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => updateFormData({ icon })}
              className={`w-12 h-12 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                formData.icon === icon 
                  ? 'border-creator bg-creator/10' 
                  : 'border-border hover:border-creator/50'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Progression Tree */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Progression Path *</Label>
        <RadioGroup
          value={formData.progression_tree}
          onValueChange={(value) => updateFormData({ progression_tree: value as QuestFormData['progression_tree'] })}
          className="grid gap-3"
        >
          {PROGRESSION_TREES.map((tree) => (
            <Label
              key={tree.value}
              htmlFor={tree.value}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                formData.progression_tree === tree.value
                  ? 'border-creator bg-creator/5'
                  : 'border-border hover:border-creator/50'
              }`}
            >
              <RadioGroupItem value={tree.value} id={tree.value} className="sr-only" />
              <span className="text-3xl">{tree.emoji}</span>
              <div>
                <p className="font-medium">{tree.label}</p>
                <p className="text-sm text-muted-foreground">{tree.description}</p>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Theme */}
      <div className="space-y-2">
        <Label htmlFor="theme" className="text-base font-medium">Theme</Label>
        <Input
          id="theme"
          placeholder="e.g., Morning Wellness, Live Music Discovery"
          value={formData.theme}
          onChange={(e) => updateFormData({ theme: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          A brief theme or category that describes this experience.
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Tags</Label>
        
        {/* Selected tags */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        
        {/* Suggested tags */}
        <div className="flex flex-wrap gap-2">
          {TAG_SUGGESTIONS.filter(tag => !formData.tags.includes(tag)).map((tag) => (
            <Button
              key={tag}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addTag(tag)}
              className="text-xs"
            >
              + {tag}
            </Button>
          ))}
        </div>
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <Label htmlFor="short_description" className="text-base font-medium">Short Description *</Label>
        <Textarea
          id="short_description"
          placeholder="A brief, enticing summary (1-2 sentences) that will appear on quest cards..."
          value={formData.short_description}
          onChange={(e) => updateFormData({ short_description: e.target.value })}
          rows={3}
        />
        <p className="text-sm text-muted-foreground">
          {formData.short_description.length}/200 characters
        </p>
      </div>
    </div>
  );
}
