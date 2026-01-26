/**
 * =============================================================================
 * DeleteAccountModal - Multi-step account deletion flow with feedback
 * =============================================================================
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Download, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DELETION_REASONS, type DeletionFeedback } from '@/types/settings';

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'inform' | 'feedback' | 'export' | 'confirm';

export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const { user, profile, signOut } = useAuth();
  const [step, setStep] = useState<Step>('inform');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dataExported, setDataExported] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  const [feedback, setFeedback] = useState<DeletionFeedback>({
    reasons: [],
    other_reason: '',
    feedback: '',
    would_return: undefined,
    data_exported: false,
  });

  const handleReasonToggle = (reasonId: string) => {
    setFeedback(prev => ({
      ...prev,
      reasons: prev.reasons.includes(reasonId)
        ? prev.reasons.filter(r => r !== reasonId)
        : [...prev.reasons, reasonId],
    }));
  };

  const handleExportData = async () => {
    if (!user?.id) return;
    
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data', {
        body: { userId: user.id }
      });

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openclique-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDataExported(true);
      setFeedback(prev => ({ ...prev, data_exported: true }));
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || confirmText !== 'DELETE') return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: {
          userId: user.id,
          userEmail: user.email,
          displayName: profile?.display_name,
          feedback: {
            ...feedback,
            data_exported: dataExported,
          },
        }
      });

      if (error) throw error;

      toast.success('Account deletion scheduled. Check your email for confirmation.');
      await signOut();
      onClose();
    } catch (error) {
      console.error('Deletion error:', error);
      toast.error('Failed to delete account. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('inform');
    setConfirmText('');
    setFeedback({
      reasons: [],
      other_reason: '',
      feedback: '',
      would_return: undefined,
      data_exported: false,
    });
    setDataExported(false);
    onClose();
  };

  const nextStep = () => {
    const steps: Step[] = ['inform', 'feedback', 'export', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['inform', 'feedback', 'export', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            Step {['inform', 'feedback', 'export', 'confirm'].indexOf(step) + 1} of 4
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Inform */}
        {step === 'inform' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action is irreversible after the grace period ends.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 text-sm">
              <h4 className="font-medium">What happens when you delete your account:</h4>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Your profile and all personal data will be permanently deleted</li>
                <li>Your quest history and signups will be removed</li>
                <li>Your squad memberships will be terminated</li>
                <li>Your XP, badges, and achievements will be lost</li>
                <li>You will be removed from any upcoming quests</li>
              </ul>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">7-Day Grace Period</h4>
              <p className="text-sm text-muted-foreground">
                After requesting deletion, you have 7 days to change your mind. 
                You can cancel the deletion by logging back in and visiting Settings.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={nextStep}>
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Feedback */}
        {step === 'feedback' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Help us improve by sharing why you're leaving (optional)
            </p>

            <div className="space-y-3">
              <Label>Why are you leaving?</Label>
              <div className="space-y-2">
                {DELETION_REASONS.map((reason) => (
                  <div key={reason.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={reason.id}
                      checked={feedback.reasons.includes(reason.id)}
                      onCheckedChange={() => handleReasonToggle(reason.id)}
                    />
                    <label htmlFor={reason.id} className="text-sm cursor-pointer">
                      {reason.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {feedback.reasons.includes('other') && (
              <div className="space-y-2">
                <Label htmlFor="other-reason">Please specify</Label>
                <Input
                  id="other-reason"
                  value={feedback.other_reason}
                  onChange={(e) => setFeedback(prev => ({ ...prev, other_reason: e.target.value }))}
                  placeholder="Tell us more..."
                />
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="feedback">What could we have done better?</Label>
              <Textarea
                id="feedback"
                value={feedback.feedback}
                onChange={(e) => setFeedback(prev => ({ ...prev, feedback: e.target.value }))}
                placeholder="Your feedback helps us improve..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Would you consider returning in the future?</Label>
              <RadioGroup 
                value={feedback.would_return} 
                onValueChange={(value) => setFeedback(prev => ({ ...prev, would_return: value as DeletionFeedback['would_return'] }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="cursor-pointer">Yes, maybe someday</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="maybe" id="maybe" />
                  <Label htmlFor="maybe" className="cursor-pointer">Not sure</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="cursor-pointer">No, this isn't for me</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={nextStep}>
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Export */}
        {step === 'export' && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Download className="h-4 w-4" />
                Download Your Data
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Before you go, you can download a copy of all your data.
              </p>
              
              {dataExported ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Data downloaded successfully</span>
                </div>
              ) : (
                <Button 
                  variant="secondary" 
                  onClick={handleExportData}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download My Data
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={nextStep} variant="destructive">
                Continue to delete
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This is your final warning. Type <strong>DELETE</strong> to confirm.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="confirm">Type DELETE to confirm</Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                className="font-mono"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              A confirmation email will be sent to <strong>{user?.email}</strong>. 
              You have 7 days to cancel this request.
            </p>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={confirmText !== 'DELETE' || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete My Account'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
