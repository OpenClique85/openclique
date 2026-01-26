/**
 * Completeness Helper
 * 
 * Shows what's missing from the quest and navigates to incomplete sections.
 * Designed to be shown on the Review step or as a floating indicator.
 */

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { QuestFormData, WIZARD_STEPS } from './types';
import { cn } from '@/lib/utils';

interface CompletenessItem {
  field: keyof QuestFormData | string;
  label: string;
  step: number;
  required: boolean;
  isComplete: boolean;
}

interface CompletenessHelperProps {
  formData: QuestFormData;
  onNavigateToStep: (step: number) => void;
  showAll?: boolean;
  className?: string;
}

export function CompletenessHelper({ 
  formData, 
  onNavigateToStep, 
  showAll = false,
  className 
}: CompletenessHelperProps) {
  const completenessItems = useMemo((): CompletenessItem[] => {
    return [
      // Step 1: Basics
      { field: 'title', label: 'Quest Title', step: 1, required: true, isComplete: !!formData.title?.trim() },
      { field: 'short_description', label: 'Short Description', step: 1, required: true, isComplete: !!formData.short_description?.trim() },
      { field: 'progression_tree', label: 'Progression Tree', step: 1, required: true, isComplete: !!formData.progression_tree },
      
      // Step 2: Timing
      { field: 'start_datetime', label: 'Start Date & Time', step: 2, required: true, isComplete: !!formData.start_datetime },
      { field: 'end_datetime', label: 'End Date & Time', step: 2, required: false, isComplete: !!formData.end_datetime },
      
      // Step 3: Constraints
      { field: 'constraints_alcohol', label: 'Alcohol Setting', step: 3, required: true, isComplete: !!formData.constraints_alcohol },
      { field: 'constraints_age_requirement', label: 'Age Requirement', step: 3, required: true, isComplete: !!formData.constraints_age_requirement },
      
      // Step 5: Experience
      { field: 'full_description', label: 'Full Description', step: 5, required: true, isComplete: (formData.full_description?.length || 0) > 50 },
      { field: 'highlights', label: 'Key Highlights', step: 5, required: false, isComplete: formData.highlights?.length > 0 },
      
      // Step 6: Objectives
      { field: 'objectives', label: 'Quest Objectives', step: 6, required: false, isComplete: !!formData.objectives?.trim() },
      { field: 'success_criteria', label: 'Success Criteria', step: 6, required: false, isComplete: !!formData.success_criteria?.trim() },
      
      // Step 7: Expectations
      { field: 'what_to_bring', label: 'What to Bring', step: 7, required: false, isComplete: !!formData.what_to_bring?.trim() },
      { field: 'dress_code', label: 'Dress Code', step: 7, required: false, isComplete: !!formData.dress_code?.trim() },
      { field: 'physical_requirements', label: 'Physical Requirements', step: 7, required: false, isComplete: !!formData.physical_requirements?.trim() },
      
      // Step 8: Safety
      { field: 'age_restriction', label: 'Age Restriction', step: 8, required: true, isComplete: !!formData.age_restriction },
      { field: 'safety_notes', label: 'Safety Notes', step: 8, required: false, isComplete: !!formData.safety_notes?.trim() },
      { field: 'emergency_contact', label: 'Emergency Contact', step: 8, required: true, isComplete: !!formData.emergency_contact?.trim() },
      
      // Step 9: Capacity
      { field: 'capacity_total', label: 'Total Capacity', step: 9, required: true, isComplete: formData.capacity_total > 0 },
      { field: 'rewards', label: 'Rewards', step: 9, required: false, isComplete: !!formData.rewards?.trim() },
      
      // Step 10: Media
      { field: 'image_url', label: 'Quest Image', step: 10, required: false, isComplete: !!formData.image_url },
      { field: 'meeting_location_name', label: 'Meeting Location', step: 10, required: true, isComplete: !!formData.meeting_location_name?.trim() },
      { field: 'meeting_address', label: 'Meeting Address', step: 10, required: true, isComplete: !!formData.meeting_address?.trim() },
    ];
  }, [formData]);

  const requiredItems = completenessItems.filter(item => item.required);
  const optionalItems = completenessItems.filter(item => !item.required);
  
  const completedRequired = requiredItems.filter(item => item.isComplete).length;
  const completedOptional = optionalItems.filter(item => item.isComplete).length;
  
  const requiredProgress = (completedRequired / requiredItems.length) * 100;
  const totalProgress = (completenessItems.filter(i => i.isComplete).length / completenessItems.length) * 100;
  
  const incompleteRequired = requiredItems.filter(item => !item.isComplete);
  const incompleteOptional = optionalItems.filter(item => !item.isComplete);

  // Group incomplete items by step
  const groupByStep = (items: CompletenessItem[]) => {
    const grouped: Record<number, CompletenessItem[]> = {};
    items.forEach(item => {
      if (!grouped[item.step]) grouped[item.step] = [];
      grouped[item.step].push(item);
    });
    return grouped;
  };

  const incompleteRequiredByStep = groupByStep(incompleteRequired);
  const incompleteOptionalByStep = groupByStep(incompleteOptional);

  const isReadyToSubmit = incompleteRequired.length === 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Required Fields</span>
          <span className={cn(
            "font-medium",
            isReadyToSubmit ? "text-green-600" : "text-amber-600"
          )}>
            {completedRequired}/{requiredItems.length}
          </span>
        </div>
        <Progress value={requiredProgress} className="h-2" />
      </div>

      {/* Ready to Submit Badge */}
      {isReadyToSubmit ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-700">Ready to submit for review!</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">
            {incompleteRequired.length} required field{incompleteRequired.length !== 1 ? 's' : ''} missing
          </span>
        </div>
      )}

      {/* Incomplete Required Items */}
      {incompleteRequired.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive">Missing Required:</p>
          {Object.entries(incompleteRequiredByStep).map(([step, items]) => (
            <div key={step} className="space-y-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-between text-left h-auto py-2 px-3 hover:bg-destructive/10"
                onClick={() => onNavigateToStep(parseInt(step))}
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-xs text-muted-foreground">
                    Step {step}: {WIZARD_STEPS[parseInt(step) - 1]?.shortTitle}
                  </span>
                  <span className="text-sm">
                    {items.map(i => i.label).join(', ')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Incomplete Optional Items */}
      {showAll && incompleteOptional.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Optional (Recommended):</p>
          {Object.entries(incompleteOptionalByStep).map(([step, items]) => (
            <div key={step} className="space-y-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-between text-left h-auto py-2 px-3"
                onClick={() => onNavigateToStep(parseInt(step))}
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-xs text-muted-foreground">
                    Step {step}: {WIZARD_STEPS[parseInt(step) - 1]?.shortTitle}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {items.map(i => i.label).join(', ')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Optional Progress */}
      {showAll && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Optional Fields</span>
            <span>{completedOptional}/{optionalItems.length}</span>
          </div>
          <Progress value={(completedOptional / optionalItems.length) * 100} className="h-1.5" />
        </div>
      )}
    </div>
  );
}
