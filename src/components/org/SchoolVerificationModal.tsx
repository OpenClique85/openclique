/**
 * SchoolVerificationModal - Modal for verifying university email addresses
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Mail, CheckCircle, GraduationCap } from 'lucide-react';

interface SchoolVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  orgName: string;
  allowedDomains: string[];
  onVerified?: () => void;
}

export function SchoolVerificationModal({
  open,
  onOpenChange,
  orgId,
  orgName,
  allowedDomains,
  onVerified,
}: SchoolVerificationModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'input' | 'sent'>('input');
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return allowedDomains.some(
      (allowed) => domain === allowed || domain?.endsWith(`.${allowed}`)
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError(null);

    if (!email.trim()) {
      setError('Please enter your university email');
      return;
    }

    if (!validateEmail(email)) {
      setError(`Email must be from one of: ${allowedDomains.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Call edge function to send verification email
      const { error: fnError } = await supabase.functions.invoke('verify-school-email', {
        body: {
          email: email.toLowerCase(),
          org_id: orgId,
          user_id: user.id,
        },
      });

      if (fnError) throw new Error(fnError.message);

      setStep('sent');
      toast.success('Verification email sent!');
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to send verification email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setEmail('');
    setStep('input');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Join {orgName}
          </DialogTitle>
          <DialogDescription>
            Verify your university email to join this organization.
          </DialogDescription>
        </DialogHeader>

        {step === 'input' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="university-email">University Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="university-email"
                  type="email"
                  placeholder={`your.name@${allowedDomains[0] || 'university.edu'}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Accepted domains: {allowedDomains.join(', ')}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Verification
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="font-semibold mb-2">Check your inbox!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We sent a verification link to <strong>{email}</strong>.
              Click the link to complete verification.
            </p>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
