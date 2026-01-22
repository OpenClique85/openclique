import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronLeft, ChevronRight, Save, Send, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import {
  WizardProgress,
  QuestFormData,
  defaultFormData,
  WIZARD_STEPS,
} from '@/components/quest-builder';

import {
  BasicsStep,
  TimingStep,
  ExperienceStep,
  ObjectivesStep,
  ExpectationsStep,
  SafetyStep,
  CapacityStep,
  MediaStep,
  ReviewStep,
} from '@/components/quest-builder/steps';

export default function QuestBuilder() {
  const { questId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<QuestFormData>(defaultFormData);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Check if user is a creator
  const { data: creatorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['creator-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user,
  });

  // Load existing quest if editing
  const { data: existingQuest, isLoading: questLoading } = useQuery({
    queryKey: ['quest-edit', questId],
    queryFn: async () => {
      if (!questId) return null;
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('id', questId)
        .single();
      
      if (error) {
        console.error('Error fetching quest:', error);
        return null;
      }
      return data;
    },
    enabled: !!questId && !!user,
  });

  // Populate form with existing quest data
  useEffect(() => {
    if (existingQuest) {
      setFormData({
        id: existingQuest.id,
        slug: existingQuest.slug,
        review_status: existingQuest.review_status || 'draft',
        title: existingQuest.title || '',
        icon: existingQuest.icon || '🎯',
        theme: existingQuest.theme || '',
        progression_tree: (existingQuest.progression_tree as QuestFormData['progression_tree']) || '',
        tags: existingQuest.tags || [],
        short_description: existingQuest.short_description || '',
        start_datetime: existingQuest.start_datetime 
          ? new Date(existingQuest.start_datetime).toISOString().slice(0, 16) 
          : '',
        end_datetime: existingQuest.end_datetime 
          ? new Date(existingQuest.end_datetime).toISOString().slice(0, 16) 
          : '',
        duration_notes: '',
        full_description: '',
        highlights: [],
        objectives: existingQuest.objectives || '',
        success_criteria: existingQuest.success_criteria || '',
        what_to_bring: '',
        dress_code: '',
        physical_requirements: '',
        safety_notes: '',
        emergency_contact: '',
        age_restriction: '',
        capacity_total: existingQuest.capacity_total || 6,
        cost_description: existingQuest.cost_description || 'Free',
        rewards: existingQuest.rewards || '',
        image_url: existingQuest.image_url || '',
        meeting_location_name: existingQuest.meeting_location_name || '',
        meeting_address: existingQuest.meeting_address || '',
        whatsapp_invite_link: existingQuest.whatsapp_invite_link || '',
      });
    }
  }, [existingQuest]);

  const updateFormData = (updates: Partial<QuestFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
  };

  // Save quest mutation
  const saveMutation = useMutation({
    mutationFn: async (submitForReview: boolean) => {
      if (!user) throw new Error('Not authenticated');
      
      const slug = formData.slug || generateSlug(formData.title) + '-' + Date.now().toString(36);
      
      const questData = {
        title: formData.title.trim(),
        slug,
        icon: formData.icon,
        theme: formData.theme || null,
        progression_tree: formData.progression_tree || null,
        tags: formData.tags,
        short_description: formData.short_description || null,
        start_datetime: formData.start_datetime || null,
        end_datetime: formData.end_datetime || null,
        objectives: formData.objectives || null,
        success_criteria: formData.success_criteria || null,
        capacity_total: formData.capacity_total,
        cost_description: formData.cost_description || 'Free',
        rewards: formData.rewards || null,
        image_url: formData.image_url || null,
        meeting_location_name: formData.meeting_location_name || null,
        meeting_address: formData.meeting_address || null,
        whatsapp_invite_link: formData.whatsapp_invite_link || null,
        creator_id: user.id,
        creator_type: 'community' as const,
        review_status: submitForReview ? 'pending_review' as const : 'draft' as const,
        submitted_at: submitForReview ? new Date().toISOString() : null,
        status: 'draft' as const,
      };

      if (formData.id) {
        // Update existing
        const { data, error } = await supabase
          .from('quests')
          .update(questData)
          .eq('id', formData.id)
          .eq('creator_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('quests')
          .insert(questData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data, submitForReview) => {
      queryClient.invalidateQueries({ queryKey: ['creator-quest-stats'] });
      
      if (submitForReview) {
        toast({
          title: 'Quest Submitted!',
          description: 'Your quest has been submitted for review. We\'ll notify you when it\'s approved.',
        });
        navigate('/creator');
      } else {
        toast({
          title: 'Draft Saved',
          description: 'Your quest has been saved as a draft.',
        });
        // Update form with new ID if it was a create
        if (!formData.id && data?.id) {
          setFormData(prev => ({ ...prev, id: data.id, slug: data.slug }));
        }
      }
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save your quest. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = async (submitForReview = false) => {
    if (!formData.title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please add a title before saving.',
        variant: 'destructive',
      });
      setCurrentStep(1);
      return;
    }

    setIsSaving(true);
    try {
      await saveMutation.mutateAsync(submitForReview);
    } finally {
      setIsSaving(false);
    }
  };

  const goToStep = (step: number) => {
    // Mark current step as completed when moving forward
    if (step > currentStep && !completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicsStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <TimingStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <ExperienceStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <ObjectivesStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <ExpectationsStep formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <SafetyStep formData={formData} updateFormData={updateFormData} />;
      case 7:
        return <CapacityStep formData={formData} updateFormData={updateFormData} />;
      case 8:
        return <MediaStep formData={formData} updateFormData={updateFormData} />;
      case 9:
        return <ReviewStep formData={formData} completedSteps={completedSteps} />;
      default:
        return null;
    }
  };

  // Loading state
  if (authLoading || profileLoading || questLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-creator" />
        </main>
        <Footer />
      </div>
    );
  }

  // Not a creator
  if (!creatorProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You need a creator account to build quests.
          </p>
          <Button asChild>
            <Link to="/creators/quest-creators">Learn About Becoming a Creator</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Check quest ownership if editing
  if (existingQuest && existingQuest.creator_id !== user?.id) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You can only edit quests you've created.
          </p>
          <Button asChild>
            <Link to="/creator">Back to Dashboard</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const currentStepData = WIZARD_STEPS[currentStep - 1];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {/* Back link */}
        <Link 
          to="/creator"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {questId ? 'Edit Quest' : 'Create New Quest'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Design an adventure that brings people together.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <WizardProgress 
            currentStep={currentStep} 
            completedSteps={completedSteps}
            onStepClick={goToStep}
          />
        </div>

        {/* Current Step Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentStepData.icon}</span>
              <div>
                <CardTitle>{currentStepData.title}</CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 pb-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            {/* Save Draft */}
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving || !formData.title}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Draft
            </Button>

            {currentStep === WIZARD_STEPS.length ? (
              /* Submit for Review */
              <Button
                onClick={() => handleSave(true)}
                disabled={isSaving || !formData.title || !formData.progression_tree || !formData.short_description}
                className="gap-2 bg-creator hover:bg-creator/90"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit for Review
              </Button>
            ) : (
              /* Next Step */
              <Button onClick={nextStep} className="gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
