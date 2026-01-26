import { QuestFormData, PROGRESSION_TREES, WIZARD_STEPS } from '../types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Check, AlertCircle, Calendar, MapPin, Users, DollarSign, Gift, Sparkles } from 'lucide-react';
import { CompletenessHelper } from '../CompletenessHelper';

interface ReviewStepProps {
  formData: QuestFormData;
  completedSteps: number[];
  attestationChecked?: boolean;
  onAttestationChange?: (checked: boolean) => void;
  onNavigateToStep?: (step: number) => void;
}

export function ReviewStep({ 
  formData, 
  completedSteps, 
  attestationChecked = false, 
  onAttestationChange,
  onNavigateToStep 
}: ReviewStepProps) {
  const progressionTree = PROGRESSION_TREES.find(t => t.value === formData.progression_tree);
  
  const missingRequired = [];
  if (!formData.title) missingRequired.push('Quest Title');
  if (!formData.progression_tree) missingRequired.push('Progression Path');
  if (!formData.short_description) missingRequired.push('Short Description');
  if (!formData.start_datetime) missingRequired.push('Start Date');
  if (!formData.meeting_location_name) missingRequired.push('Meeting Location');
  if (!formData.meeting_address) missingRequired.push('Meeting Address');
  if (!formData.emergency_contact) missingRequired.push('Emergency Contact');

  const isComplete = missingRequired.length === 0;

  return (
    <div className="space-y-6">
      {/* Completeness Helper with Navigation */}
      {onNavigateToStep && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quest Completeness</CardTitle>
          </CardHeader>
          <CardContent>
            <CompletenessHelper
              formData={formData}
              onNavigateToStep={onNavigateToStep}
              showAll={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Quest Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{formData.icon}</span>
            <div>
              <CardTitle className="text-xl">{formData.title || 'Untitled Quest'}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {progressionTree && (
                  <Badge variant="secondary">
                    {progressionTree.emoji} {progressionTree.label}
                  </Badge>
                )}
                {formData.ai_generated && (
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI-Assisted
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image preview */}
          {formData.image_url && (
            <img 
              src={formData.image_url} 
              alt="Quest preview" 
              className="w-full h-40 object-cover rounded-lg"
            />
          )}

          {/* Short description */}
          <p className="text-muted-foreground">
            {formData.short_description || 'No description provided.'}
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-creator" />
              <span>
                {formData.start_datetime 
                  ? new Date(formData.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Date TBD'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-creator" />
              <span>{formData.capacity_total} spots</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-creator" />
              <span>{formData.cost_description || 'Free'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-creator" />
              <span>{formData.meeting_location_name || 'Location TBD'}</span>
            </div>
          </div>

          {/* Tags */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* AI-generated tags */}
          {formData.ai_draft_suggested_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.ai_draft_suggested_tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs gap-1">
                  <Sparkles className="w-3 h-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Rewards */}
          {formData.rewards && (
            <div className="flex items-start gap-2 pt-2 text-sm">
              <Gift className="w-4 h-4 text-amber-500 mt-0.5" />
              <span className="text-muted-foreground whitespace-pre-wrap">{formData.rewards}</span>
            </div>
          )}

          {/* Objectives preview */}
          {formData.ai_draft_objectives.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Objectives:</p>
              <ul className="space-y-1">
                {formData.ai_draft_objectives.slice(0, 3).map((obj, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    {obj.objective_text}
                  </li>
                ))}
                {formData.ai_draft_objectives.length > 3 && (
                  <li className="text-sm text-muted-foreground">
                    +{formData.ai_draft_objectives.length - 3} more objectives
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step Completion Summary */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Step Completion</p>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {WIZARD_STEPS.slice(0, -1).map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => onNavigateToStep?.(step.id)}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                completedSteps.includes(step.id) 
                  ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {completedSteps.includes(step.id) ? (
                <Check className="w-3 h-3" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-current" />
              )}
              {step.shortTitle}
            </button>
          ))}
        </div>
      </div>

      {/* Attestation Checkbox */}
      {onAttestationChange && (
        <div className="flex items-start space-x-3 rounded-lg border p-4 bg-muted/50">
          <Checkbox
            id="attestation"
            checked={attestationChecked}
            onCheckedChange={(checked) => onAttestationChange(checked === true)}
            disabled={!isComplete}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="attestation" className="text-sm font-medium cursor-pointer">
              I reviewed this quest and it reflects my intent.
            </Label>
            <p className="text-xs text-muted-foreground">
              {isComplete 
                ? 'By checking this, you confirm the information is accurate and ready for admin review.'
                : 'Complete all required fields above before you can submit for review.'}
            </p>
          </div>
        </div>
      )}

      {/* Submission info */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">What happens next?</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Your quest will be saved as a <strong>Draft</strong></li>
          <li>Click "Submit for Review" when you're ready for our team to review it</li>
          <li>We'll provide feedback or approve it for publishing</li>
        </ul>
      </div>
    </div>
  );
}
