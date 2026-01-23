/**
 * SchoolVerificationModal - Verify school email for star badge
 * Sends verification code to school email, user enters code to verify
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, CheckCircle, Sparkles } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

const codeSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

interface SchoolVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  schoolDomain: string;
  onVerified: () => void;
}

export function SchoolVerificationModal({
  isOpen,
  onClose,
  schoolId,
  schoolDomain,
  onVerified,
}: SchoolVerificationModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  });

  const isUT = schoolId === 'ut_austin';

  const handleSendCode = async (values: z.infer<typeof emailSchema>) => {
    // Validate email domain
    const domain = values.email.split('@')[1]?.toLowerCase();
    if (domain !== schoolDomain) {
      emailForm.setError('email', {
        message: `Please use your @${schoolDomain} email address`,
      });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-school-email', {
        body: { action: 'send', email: values.email },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to send code');
      }

      setEmail(values.email);
      setStep('code');
      toast({
        title: 'Code sent!',
        description: `Check your ${values.email} inbox for the verification code.`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send code',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async (values: z.infer<typeof codeSchema>) => {
    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-school-email', {
        body: { action: 'verify', email, code: values.code },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Invalid code');
      }

      setStep('success');
      toast({
        title: data.message || 'Verified!',
        description: isUT ? '🤘🐂 You now have the star badge!' : 'Your school has been verified!',
      });

      setTimeout(() => {
        onVerified();
        onClose();
      }, 2000);
    } catch (error: any) {
      codeForm.setError('code', { message: error.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    emailForm.reset();
    codeForm.reset();
    setEmail('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUT ? (
              <>
                <span className="text-[#BF5700]">🤘</span>
                Verify Your UT Email
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                Verify Your School Email
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'email' && (
              <>
                Enter your @{schoolDomain} email to get{' '}
                {isUT ? 'the ⭐ verified star badge' : 'your verified badge'}!
              </>
            )}
            {step === 'code' && (
              <>We sent a 6-digit code to {email}. Enter it below.</>
            )}
            {step === 'success' && (
              <>You're all set!</>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 'email' && (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleSendCode)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`you@${schoolDomain}`}
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      We'll send a verification code to this email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Code
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {step === 'code' && (
          <Form {...codeForm}>
            <form onSubmit={codeForm.handleSubmit(handleVerifyCode)} className="space-y-4">
              <FormField
                control={codeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <InputOTP
                        maxLength={6}
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('email')}
                >
                  ← Back
                </Button>
                <Button type="submit" disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className={`text-6xl mb-4 ${isUT ? 'animate-bounce' : ''}`}>
              {isUT ? '🤘⭐🐂' : '✅🎓'}
            </div>
            <p className="text-lg font-semibold mb-2">
              {isUT ? "Hook 'em!" : 'Verified!'}
            </p>
            <p className="text-muted-foreground">
              {isUT
                ? 'You now have the verified Longhorn star badge!'
                : 'Your school email has been verified!'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
