import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAwardXP } from '@/hooks/useUserXP';
import { XPAwardToast, useXPToast } from '@/components/XPAwardToast';
import {
  FeedbackProgress,
  FeedbackStep1,
  FeedbackStep2,
  FeedbackStep3,
  FeedbackStep4,
  FeedbackComplete,
} from '@/components/feedback';

interface FeedbackRequest {
  id: string;
  xp_basic: number;
  xp_extended: number;
  xp_pricing: number;
  xp_testimonial: number;
  status: string;
}

interface XPBreakdown {
  source: string;
  amount: number;
  label: string;
}

export default function FeedbackFlow() {
  const { questId } = useParams<{ questId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const awardXP = useAwardXP();
  const { toastState, showXPToast, hideXPToast } = useXPToast();

  const [quest, setQuest] = useState<{ title: string; icon: string } | null>(null);
  const [feedbackRequest, setFeedbackRequest] = useState<FeedbackRequest | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [xpBreakdown, setXpBreakdown] = useState<XPBreakdown[]>([]);
  const [totalXPEarned, setTotalXPEarned] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Default XP values if no feedback_request exists
  const xpBasic = feedbackRequest?.xp_basic ?? 25;
  const xpExtended = feedbackRequest?.xp_extended ?? 50;
  const xpPricing = feedbackRequest?.xp_pricing ?? 50;
  const xpTestimonial = feedbackRequest?.xp_testimonial ?? 100;

  useEffect(() => {
    const fetchData = async () => {
      if (!questId || !user) return;

      // Fetch quest details
      const { data: questData } = await supabase
        .from('quests')
        .select('title, icon')
        .eq('id', questId)
        .maybeSingle();

      if (questData) {
        setQuest({ title: questData.title, icon: questData.icon || '🎯' });
      }

      // Check for feedback_request
      const { data: requestData } = await supabase
        .from('feedback_requests')
        .select('*')
        .eq('quest_id', questId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (requestData) {
        setFeedbackRequest(requestData as FeedbackRequest);
      }

      // Check if already submitted basic feedback
      const { data: existingFeedback } = await supabase
        .from('feedback')
        .select('id')
        .eq('quest_id', questId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingFeedback) {
        setAlreadySubmitted(true);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [questId, user]);

  // Step 1: Quick Pulse
  const handleStep1Submit = async (data: {
    rating: number;
    repeatIntent: string;
    feelings: string[];
  }) => {
    if (!questId || !user) return;
    setIsSubmitting(true);

    try {
      // Insert feedback record
      const { data: feedbackData, error } = await supabase
        .from('feedback')
        .insert({
          quest_id: questId,
          user_id: user.id,
          rating_1_5: data.rating,
          would_do_again: data.repeatIntent === 'yes' ? true : data.repeatIntent === 'no' ? false : null,
          feelings: data.feelings,
        })
        .select('id')
        .single();

      if (error) throw error;

      setFeedbackId(feedbackData.id);

      // Award XP
      await awardXP.mutateAsync({
        amount: xpBasic,
        source: 'feedback_basic',
        sourceId: feedbackData.id,
      });

      // Update feedback_request status if exists
      if (feedbackRequest) {
        await supabase
          .from('feedback_requests')
          .update({ status: 'basic_complete' })
          .eq('id', feedbackRequest.id);
      }

      setCompletedSteps([...completedSteps, 1]);
      setXpBreakdown([...xpBreakdown, { source: 'feedback_basic', amount: xpBasic, label: 'Quick Pulse' }]);
      setTotalXPEarned(totalXPEarned + xpBasic);
      showXPToast(xpBasic, 'Quick Pulse');
      setCurrentStep(2);
    } catch (error) {
      console.error('Failed to submit step 1:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save feedback',
        description: 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Quest & Group Feedback
  const handleStep2Submit = async (data: {
    workedWell: string[];
    workedPoorly: string[];
    lengthRating: string;
    confusionNotes: string;
    comfortScore: number;
    groupFit: string;
    reconnectIntent: string;
  }) => {
    if (!feedbackId || !user) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('feedback_quest_design')
        .insert({
          feedback_id: feedbackId,
          worked_well: data.workedWell,
          worked_poorly: data.workedPoorly,
          length_rating: data.lengthRating || null,
          confusion_notes: data.confusionNotes.trim() || null,
          comfort_score: data.comfortScore,
          group_fit: data.groupFit || null,
          reconnect_intent: data.reconnectIntent || null,
        });

      if (error) throw error;

      // Award XP
      await awardXP.mutateAsync({
        amount: xpExtended,
        source: 'feedback_extended',
        sourceId: feedbackId,
      });

      // Update feedback_request status
      if (feedbackRequest) {
        await supabase
          .from('feedback_requests')
          .update({ status: 'extended_complete' })
          .eq('id', feedbackRequest.id);
      }

      setCompletedSteps([...completedSteps, 2]);
      setXpBreakdown([...xpBreakdown, { source: 'feedback_extended', amount: xpExtended, label: 'Quest Insights' }]);
      setTotalXPEarned(totalXPEarned + xpExtended);
      showXPToast(xpExtended, 'Quest Insights');
      setCurrentStep(3);
    } catch (error) {
      console.error('Failed to submit step 2:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save feedback',
        description: 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Pricing Insights
  const handleStep3Submit = async (data: {
    pricingModelPreference: string;
    tooCheapPrice: string;
    fairPrice: string;
    expensivePrice: string;
    tooExpensivePrice: string;
    valueDrivers: string[];
  }) => {
    if (!feedbackId || !user) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('feedback_pricing')
        .insert({
          feedback_id: feedbackId,
          pricing_model_preference: data.pricingModelPreference || null,
          too_cheap_price: data.tooCheapPrice || null,
          fair_price: data.fairPrice || null,
          expensive_price: data.expensivePrice || null,
          too_expensive_price: data.tooExpensivePrice || null,
          value_drivers: data.valueDrivers,
        });

      if (error) throw error;

      // Award XP
      await awardXP.mutateAsync({
        amount: xpPricing,
        source: 'feedback_pricing',
        sourceId: feedbackId,
      });

      // Update feedback_request status
      if (feedbackRequest) {
        await supabase
          .from('feedback_requests')
          .update({ status: 'pricing_complete' })
          .eq('id', feedbackRequest.id);
      }

      setCompletedSteps([...completedSteps, 3]);
      setXpBreakdown([...xpBreakdown, { source: 'feedback_pricing', amount: xpPricing, label: 'Pricing Survey' }]);
      setTotalXPEarned(totalXPEarned + xpPricing);
      showXPToast(xpPricing, 'Pricing Survey');
      setCurrentStep(4);
    } catch (error) {
      console.error('Failed to submit step 3:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save feedback',
        description: 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Testimonial
  const handleStep4Submit = async (data: {
    testimonialText: string;
    recommendationText: string;
    consentType: 'anonymous' | 'first_name_city' | null;
    interviewOptIn: boolean;
  }) => {
    if (!feedbackId || !user) return;
    setIsSubmitting(true);

    try {
      // Update feedback record with testimonial data
      const { error } = await supabase
        .from('feedback')
        .update({
          testimonial_text: data.testimonialText || null,
          recommendation_text: data.recommendationText || null,
          consent_type: data.consentType,
          interview_opt_in: data.interviewOptIn,
        })
        .eq('id', feedbackId);

      if (error) throw error;

      // Award XP if testimonial text was provided
      let earnedTestimonialXP = 0;
      if (data.testimonialText || data.recommendationText) {
        await awardXP.mutateAsync({
          amount: xpTestimonial,
          source: 'feedback_testimonial',
          sourceId: feedbackId,
        });
        earnedTestimonialXP = xpTestimonial;
        setXpBreakdown([...xpBreakdown, { source: 'feedback_testimonial', amount: xpTestimonial, label: 'Testimonial' }]);
        showXPToast(xpTestimonial, 'Testimonial');
      }

      // Update feedback_request status
      if (feedbackRequest) {
        await supabase
          .from('feedback_requests')
          .update({ status: 'full_complete', completed_at: new Date().toISOString() })
          .eq('id', feedbackRequest.id);
      }

      setCompletedSteps([...completedSteps, 4]);
      setTotalXPEarned(totalXPEarned + earnedTestimonialXP);
      setIsComplete(true);
    } catch (error) {
      console.error('Failed to submit step 4:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save feedback',
        description: 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Quest not found</h1>
          <Button asChild>
            <Link to="/my-quests">Back to My Quests</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-lg">
          <Card className="text-center">
            <CardContent className="py-12">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-display font-bold mb-2">Already submitted</h1>
              <p className="text-muted-foreground mb-6">
                You've already submitted feedback for this quest.
              </p>
              <Button asChild>
                <Link to="/my-quests">Back to My Quests</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* XP Toast */}
      {toastState && (
        <XPAwardToast
          key={toastState.key}
          amount={toastState.amount}
          label={toastState.label}
          onComplete={hideXPToast}
        />
      )}

      <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
        {!isComplete && (
          <Link
            to="/my-quests"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Quests
          </Link>
        )}

        {isComplete ? (
          <FeedbackComplete
            totalXPEarned={totalXPEarned}
            xpBreakdown={xpBreakdown}
            questTitle={quest.title}
            questId={questId}
          />
        ) : (
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="text-4xl mb-2">{quest.icon}</div>
              <CardTitle className="font-display">How was {quest.title}?</CardTitle>
              <CardDescription>
                {currentStep === 1 && 'Quick pulse check — takes 30 seconds'}
                {currentStep === 2 && 'Help us improve future quests'}
                {currentStep === 3 && 'Help us design fair pricing'}
                {currentStep === 4 && 'Share your story with others'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Progress indicator */}
              <FeedbackProgress
                currentStep={currentStep}
                totalSteps={4}
                completedSteps={completedSteps}
              />

              {/* Step content */}
              {currentStep === 1 && (
                <FeedbackStep1
                  onSubmit={handleStep1Submit}
                  isSubmitting={isSubmitting}
                  xpReward={xpBasic}
                />
              )}

              {currentStep === 2 && (
                <FeedbackStep2
                  onSubmit={handleStep2Submit}
                  onSkip={handleSkipStep}
                  isSubmitting={isSubmitting}
                  xpReward={xpExtended}
                />
              )}

              {currentStep === 3 && (
                <FeedbackStep3
                  onSubmit={handleStep3Submit}
                  onSkip={handleSkipStep}
                  isSubmitting={isSubmitting}
                  xpReward={xpPricing}
                />
              )}

              {currentStep === 4 && (
                <FeedbackStep4
                  onSubmit={handleStep4Submit}
                  onSkip={handleSkipStep}
                  isSubmitting={isSubmitting}
                  xpReward={xpTestimonial}
                />
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
