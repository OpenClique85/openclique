/**
 * =============================================================================
 * Onboarding Flow Component
 * =============================================================================
 * Multi-step onboarding that includes:
 * 1. Age verification
 * 2. Terms & Privacy agreement (with scroll requirement)
 * 3. Safety guidelines (first-time)
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AgeVerification } from '@/components/safety/AgeVerification';
import { SafetyGuidelines } from '@/components/safety/SafetyGuidelines';
import { TermsConsentStep } from './TermsConsentStep';

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
}

type OnboardingStep = 'age' | 'terms' | 'safety' | 'complete';

export function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('age');
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
      // Log consent for all required sections
      const consentEntries = [
        { consent_type: 'terms_of_service', consent_version: '2025-02' },
        { consent_type: 'privacy_policy', consent_version: '2025-02' },
        { consent_type: 'community_guidelines', consent_version: '2025-02' },
        { consent_type: 'safety_acknowledgment', consent_version: '2025-02' },
      ];

      for (const entry of consentEntries) {
        const { error } = await supabase
          .from('user_consent_log')
          .insert({
            user_id: userId,
            consent_given: true,
            ...entry,
          });
        if (error) throw error;
      }

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

  // Terms Agreement Step (with scroll requirement)
  if (step === 'terms') {
    return (
      <>
        <TermsConsentStep 
          onAccept={handleTermsAccepted}
          isSubmitting={saveTermsAgreement.isPending}
        />
        <SafetyGuidelines
          open={showSafetyModal}
          onOpenChange={setShowSafetyModal}
          onAcknowledge={handleSafetyAcknowledged}
          showDontShowAgain={false}
        />
      </>
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
