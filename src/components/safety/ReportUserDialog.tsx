/**
 * =============================================================================
 * Report User Dialog
 * =============================================================================
 * Allows users to report concerning behavior. Reports go to admin for review.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Flag, CheckCircle2, Shield } from 'lucide-react';
import { BlockUserDialog } from './BlockUserDialog';

type ReportReason = 'harassment' | 'inappropriate_content' | 'spam' | 'safety_concern' | 'false_information' | 'other';

interface ReportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
  reportedMessageId?: string;
  reportedQuestId?: string;
  displayName?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'harassment', label: 'Harassment or bullying', description: 'Threatening, intimidating, or abusive behavior' },
  { value: 'inappropriate_content', label: 'Inappropriate content', description: 'Explicit, violent, or offensive material' },
  { value: 'spam', label: 'Spam or scam', description: 'Promotional content, phishing, or fraud attempts' },
  { value: 'safety_concern', label: 'Safety concern', description: 'Behavior that makes you feel unsafe' },
  { value: 'false_information', label: 'False information', description: 'Fake profile, catfishing, or misrepresentation' },
  { value: 'other', label: 'Other', description: 'Something else that concerns you' },
];

export function ReportUserDialog({
  open,
  onOpenChange,
  reportedUserId,
  reportedMessageId,
  reportedQuestId,
  displayName,
}: ReportUserDialogProps) {
  const [step, setStep] = useState<'reason' | 'details' | 'submitted'>('reason');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const { toast } = useToast();

  const reportMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (!reason) throw new Error('Please select a reason');

      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId || null,
          reported_message_id: reportedMessageId || null,
          reported_quest_id: reportedQuestId || null,
          reason,
          description: description.trim() || null,
          priority: reason === 'safety_concern' ? 'high' : 'normal',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setStep('submitted');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to submit report',
        description: error.message,
      });
    },
  });

  const handleClose = () => {
    setStep('reason');
    setReason(null);
    setDescription('');
    onOpenChange(false);
  };

  const handleContinue = () => {
    if (!reason) {
      toast({
        variant: 'destructive',
        title: 'Please select a reason',
        description: 'Choose what best describes the issue',
      });
      return;
    }
    setStep('details');
  };

  const handleSubmit = () => {
    reportMutation.mutate();
  };

  if (step === 'submitted') {
    return (
      <>
        <Dialog open={open && !showBlockDialog} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle>Thank you for reporting this</DialogTitle>
              <DialogDescription className="text-left space-y-3">
                <p>We take safety seriously and will review your report within 24 hours.</p>
                <p>In the meantime:</p>
                <ul className="list-none space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    You can block this user (they won't see your profile or message you)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    If you feel unsafe, contact local authorities
                  </li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              {reportedUserId && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowBlockDialog(true)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Block User
                </Button>
              )}
              <Button className="w-full" onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {reportedUserId && (
          <BlockUserDialog
            open={showBlockDialog}
            onOpenChange={setShowBlockDialog}
            userId={reportedUserId}
            displayName={displayName || 'This user'}
            onBlocked={handleClose}
          />
        )}
      </>
    );
  }

  if (step === 'details') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tell us more</DialogTitle>
            <DialogDescription>
              Additional details help us review your report (optional but helpful)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Textarea
              placeholder="Describe what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Your report is confidential. We'll review it within 24 hours.
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setStep('reason')} className="w-full sm:w-auto">
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={reportMutation.isPending}
              className="w-full sm:w-auto"
            >
              {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Report {displayName || 'User'}
          </DialogTitle>
          <DialogDescription>
            What's wrong?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={reason || ''}
          onValueChange={(value) => setReason(value as ReportReason)}
          className="space-y-2 py-2"
        >
          {REPORT_REASONS.map(({ value, label, description }) => (
            <div
              key={value}
              className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
              onClick={() => setReason(value)}
            >
              <RadioGroupItem value={value} id={value} className="mt-1" />
              <Label htmlFor={value} className="cursor-pointer flex-1">
                <span className="font-medium block">{label}</span>
                <span className="text-sm text-muted-foreground">{description}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={!reason} className="w-full sm:w-auto">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
