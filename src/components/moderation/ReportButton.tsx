/**
 * ReportButton - Universal report/flag button for moderation
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Flag, Loader2, AlertTriangle } from 'lucide-react';

interface ReportButtonProps {
  targetType: 'user' | 'quest' | 'clique' | 'message' | 'org';
  targetId: string;
  variant?: 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'default' | 'icon';
  showLabel?: boolean;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam', description: 'Unwanted commercial content or repetitive posts' },
  { value: 'harassment', label: 'Harassment', description: 'Bullying, threats, or targeted attacks' },
  { value: 'inappropriate', label: 'Inappropriate Content', description: 'Content that violates community guidelines' },
  { value: 'safety', label: 'Safety Concern', description: 'Behavior that may endanger others' },
  { value: 'other', label: 'Other', description: 'Something else not listed above' },
];

export function ReportButton({ 
  targetType, 
  targetId, 
  variant = 'ghost',
  size = 'sm',
  showLabel = false 
}: ReportButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !selectedReason) {
      toast.error('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('moderation_flags')
        .insert({
          reporter_id: user.id,
          target_type: targetType,
          target_id: targetId,
          reason: selectedReason,
          details: details.trim() || null,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reported this');
        } else {
          throw error;
        }
      } else {
        toast.success('Report submitted. Thank you for helping keep our community safe.');
        setOpen(false);
        setSelectedReason('');
        setDetails('');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="text-muted-foreground hover:text-destructive">
          <Flag className="h-4 w-4" />
          {showLabel && <span className="ml-2">Report</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report {targetType}
          </DialogTitle>
          <DialogDescription>
            Help us understand what's wrong. All reports are reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {REPORT_REASONS.map((reason) => (
              <div key={reason.value} className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value={reason.value} id={reason.value} />
                <div className="grid gap-0.5 leading-none">
                  <Label htmlFor={reason.value} className="font-medium cursor-pointer">
                    {reason.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {reason.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              placeholder="Provide any additional context that might help us investigate..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Flag className="h-4 w-4 mr-2" />
            )}
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
