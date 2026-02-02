/**
 * =============================================================================
 * Onboarding Flow Component
 * =============================================================================
 * Multi-step onboarding that includes:
 * 1. Age verification
 * 2. Terms & Privacy agreement
 * 3. Safety guidelines (first-time)
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, FileText, Shield, Loader2 } from 'lucide-react';
import { AgeVerification } from '@/components/safety/AgeVerification';
import { SafetyGuidelines } from '@/components/safety/SafetyGuidelines';
import { BRAND } from '@/constants/content';
import { Link } from 'react-router-dom';

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
}

type OnboardingStep = 'age' | 'terms' | 'safety' | 'complete';

export function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('age');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveAgeVerification = useMutation({
    mutationFn: async (dateOfBirth: Date) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          date_of_birth: dateOfBirth.toISOString().split('T')[0],
          age_verified_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      setStep('terms');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to save',
        description: error.message,
      });
    },
  });

  const saveTermsAgreement = useMutation({
    mutationFn: async () => {
      // Log consent
      const { error } = await supabase
        .from('user_consent_log')
        .insert({
          user_id: userId,
          consent_type: 'terms_and_privacy',
          consent_given: true,
          consent_version: '2025-02',
        });

      if (error) throw error;

      // Update profile consent timestamp
      await supabase
        .from('profiles')
        .update({
          consent_given_at: new Date().toISOString(),
        })
        .eq('id', userId);
    },
    onSuccess: () => {
      setStep('safety');
      setShowSafetyModal(true);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to save',
        description: error.message,
      });
    },
  });

  const handleAgeVerified = (dob: Date) => {
    saveAgeVerification.mutate(dob);
  };

  const handleTermsAccepted = () => {
    if (!termsAccepted) {
      toast({
        variant: 'destructive',
        title: 'Agreement required',
        description: 'Please agree to the Terms of Service and Privacy Policy to continue.',
      });
      return;
    }
    saveTermsAgreement.mutate();
  };

  const handleSafetyAcknowledged = () => {
    setShowSafetyModal(false);
    setStep('complete');
    onComplete();
  };

  // Age Verification Step
  if (step === 'age') {
    return (
      <div className="flex items-center justify-center p-4">
        <AgeVerification onVerified={handleAgeVerified} />
      </div>
    );
  }

  // Terms Agreement Step
  if (step === 'terms') {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display">Quick Legal Stuff</CardTitle>
            <CardDescription className="text-base">
              To use {BRAND.name}, you need to agree to our terms.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Terms Summary */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Terms of Service
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• You're responsible for your own safety at quests</li>
                  <li>• We don't conduct background checks on users</li>
                  <li>• Meet in public places and trust your instincts</li>
                </ul>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy Policy
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• We only collect data needed to run the service</li>
                  <li>• You control your data (view, download, delete anytime)</li>
                  <li>• We never sell your information</li>
                </ul>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <Checkbox
                id="terms-agree"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              />
              <Label htmlFor="terms-agree" className="text-sm cursor-pointer leading-relaxed">
                I confirm I'm 18+ and agree to the{' '}
                <Link to="/terms" target="_blank" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button 
              className="w-full" 
              onClick={handleTermsAccepted}
              disabled={saveTermsAgreement.isPending}
            >
              {saveTermsAgreement.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'I Agree'
              )}
            </Button>
          </CardContent>
        </Card>

        <SafetyGuidelines
          open={showSafetyModal}
          onOpenChange={setShowSafetyModal}
          onAcknowledge={handleSafetyAcknowledged}
          showDontShowAgain={false}
        />
      </div>
    );
  }

  // Safety Step (shown as modal)
  if (step === 'safety') {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading safety guidelines...</p>
          </CardContent>
        </Card>

        <SafetyGuidelines
          open={showSafetyModal}
          onOpenChange={setShowSafetyModal}
          onAcknowledge={handleSafetyAcknowledged}
          showDontShowAgain={false}
        />
      </div>
    );
  }

  return null;
}
