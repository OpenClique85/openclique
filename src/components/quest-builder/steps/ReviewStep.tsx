import { QuestFormData, PROGRESSION_TREES, WIZARD_STEPS } from '../types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, AlertCircle, Calendar, MapPin, Users, DollarSign, Gift } from 'lucide-react';

interface ReviewStepProps {
  formData: QuestFormData;
  completedSteps: number[];
}

export function ReviewStep({ formData, completedSteps }: ReviewStepProps) {
  const progressionTree = PROGRESSION_TREES.find(t => t.value === formData.progression_tree);
  
  const missingRequired = [];
  if (!formData.title) missingRequired.push('Quest Title');
  if (!formData.progression_tree) missingRequired.push('Progression Path');
  if (!formData.short_description) missingRequired.push('Short Description');
  if (!formData.start_datetime) missingRequired.push('Start Date');

  const isComplete = missingRequired.length === 0;

  return (
    <div className="space-y-6">
      {/* Completion Status */}
      <div className={`rounded-lg p-4 ${isComplete ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
        <div className="flex items-start gap-3">
          {isComplete ? (
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          )}
          <div>
            <p className="font-medium">
              {isComplete ? 'Ready to Submit!' : 'Almost There!'}
            </p>
            {!isComplete && (
              <p className="text-sm text-muted-foreground mt-1">
                Missing required fields: {missingRequired.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quest Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{formData.icon}</span>
            <div>
              <CardTitle className="text-xl">{formData.title || 'Untitled Quest'}</CardTitle>
              {progressionTree && (
                <Badge variant="secondary" className="mt-1">
                  {progressionTree.emoji} {progressionTree.label}
                </Badge>
              )}
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

          {/* Rewards */}
          {formData.rewards && (
            <div className="flex items-start gap-2 pt-2 text-sm">
              <Gift className="w-4 h-4 text-amber-500 mt-0.5" />
              <span className="text-muted-foreground">{formData.rewards}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step Completion Summary */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Step Completion</p>
        <div className="grid grid-cols-3 gap-2">
          {WIZARD_STEPS.slice(0, 8).map((step) => (
            <div 
              key={step.id}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                completedSteps.includes(step.id) 
                  ? 'bg-green-500/10 text-green-600' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {completedSteps.includes(step.id) ? (
                <Check className="w-3 h-3" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-current" />
              )}
              {step.shortTitle}
            </div>
          ))}
        </div>
      </div>

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
