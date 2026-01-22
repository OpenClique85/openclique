/**
 * =============================================================================
 * QUESTION SECTION - Reusable Profile Question Components
 * =============================================================================
 * 
 * Provides reusable UI components for different question types:
 * - MultiSelect: Checkbox-based multi-select
 * - SingleSelect: Radio button single-select
 * - VibeSlider: Slider for vibe preference
 * - TextQuestion: Open-ended text input
 * 
 * =============================================================================
 */

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { QuestionOption } from '@/types/profile';

interface MultiSelectProps<T extends string> {
  label: string;
  sublabel?: string;
  options: QuestionOption<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
  maxSelect?: number;
}

export function MultiSelect<T extends string>({
  label,
  sublabel,
  options,
  selected,
  onChange,
  maxSelect,
}: MultiSelectProps<T>) {
  const handleToggle = (id: T) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      if (maxSelect && selected.length >= maxSelect) {
        // Replace the first item if at max
        onChange([...selected.slice(1), id]);
      } else {
        onChange([...selected, id]);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {sublabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleToggle(option.id)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all
                border
                ${isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:border-primary/50'
                }
              `}
            >
              {option.emoji && <span className="mr-1">{option.emoji}</span>}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SingleSelectProps<T extends string> {
  label: string;
  options: QuestionOption<T>[];
  selected: T | undefined;
  onChange: (value: T) => void;
}

export function SingleSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
}: SingleSelectProps<T>) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <RadioGroup
        value={selected || ''}
        onValueChange={(value) => onChange(value as T)}
        className="flex flex-wrap gap-2"
      >
        {options.map((option) => {
          const isSelected = selected === option.id;
          return (
            <label
              key={option.id}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer
                border flex items-center gap-2
                ${isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:border-primary/50'
                }
              `}
            >
              <RadioGroupItem value={option.id} className="sr-only" />
              {option.label}
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}

interface VibeSliderProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function VibeSlider({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
  min = 1,
  max = 5,
}: VibeSliderProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      </div>
    </div>
  );
}

interface TextQuestionProps {
  label: string;
  sublabel?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export function TextQuestion({
  label,
  sublabel,
  placeholder,
  value,
  onChange,
  maxLength = 140,
}: TextQuestionProps) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {sublabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
        )}
      </div>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        className="resize-none h-20"
        maxLength={maxLength}
      />
      <p className="text-xs text-muted-foreground text-right">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  icon?: string;
}

export function SectionHeader({ title, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-2 border-t border-border mt-4">
      {icon && <span>{icon}</span>}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}
