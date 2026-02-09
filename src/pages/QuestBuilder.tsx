import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import { saveQuestRelatedData, parseManualObjectives } from '@/lib/questDataSaver';

import {
  WizardProgress,
  QuestFormData,
  defaultFormData,
  WIZARD_STEPS,
} from '@/components/quest-builder';

import {
  BasicsStep,
  TimingStep,
  ConstraintsStep,
  AIDraftStep,
  ExperienceStep,
  ObjectivesStep,
  ExpectationsStep,
  SafetyStep,
  CapacityStep,
  MediaStep,
  ReviewStep,
} from '@/components/quest-builder/steps';

// Helper to format Eventbrite address
const formatEventbriteAddress = (address: any): string => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return address.localized_address_display || 
         [address.address_1, address.city, address.region].filter(Boolean).join(', ');
};

// Helper to calculate duration in minutes from start/end times
const calculateDurationMinutes = (start: string | null, end: string | null): number => {
  if (!start || !end) return 120;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.max(30, Math.round(diffMs / (1000 * 60)));
};

export default function QuestBuilder() {
  const { questId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get Eventbrite data from navigation state (if coming from import)
  const eventbriteData = location.state?.eventbriteData;

  // Use sessionStorage to persist step across potential remounts
  const getInitialStep = () => {
    const storageKey = `quest-builder-step-${questId || 'new'}`;
    const saved = sessionStorage.getItem(storageKey);
    return saved ? parseInt(saved, 10) : 1;
  };
  
  const [currentStep, setCurrentStep] = useState(getInitialStep);
  const [formData, setFormData] = useState<QuestFormData>(defaultFormData);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Track component mount to detect remounts (debug only)
  const mountCount = useRef(0);
  mountCount.current += 1;
  
  // Persist step to sessionStorage whenever it changes
  useEffect(() => {
    const storageKey = `quest-builder-step-${questId || 'new'}`;
    sessionStorage.setItem(storageKey, String(currentStep));
  }, [currentStep, questId]);
  
  // Clear session storage when component unmounts intentionally (navigation away)
  useEffect(() => {
    return () => {
      // Only clear if navigating away, not on remount
      // We detect this by checking if the window is still on the same route
      setTimeout(() => {
        if (!window.location.pathname.includes('/creator/quests')) {
          const storageKey = `quest-builder-step-${questId || 'new'}`;
          sessionStorage.removeItem(storageKey);
        }
      }, 100);
    };
  }, [questId]);

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

  // Populate form with existing quest data OR Eventbrite import data
  useEffect(() => {
    if (existingQuest) {
      setFormData({
        ...defaultFormData,
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
        duration_notes: existingQuest.duration_notes || '',
        duration_steps: Array.isArray(existingQuest.duration_steps) 
          ? (existingQuest.duration_steps as Array<{ label: string; minutes: number }>)
          : [{ label: '', minutes: 30 }],
        default_duration_minutes: existingQuest.default_duration_minutes || 120,
        full_description: existingQuest.full_description || '',
        highlights: (existingQuest.highlights as string[] | null) || [],
        objectives: existingQuest.objectives || '',
        success_criteria: existingQuest.success_criteria || '',
        what_to_bring: existingQuest.what_to_bring || '',
        dress_code: existingQuest.dress_code || '',
        physical_requirements: existingQuest.physical_requirements || '',
        safety_notes: existingQuest.safety_notes || '',
        emergency_contact: existingQuest.emergency_contact || '',
        age_restriction: existingQuest.age_restriction || '',
        capacity_total: existingQuest.capacity_total || 6,
        default_squad_size: existingQuest.default_squad_size || 4,
        cost_description: existingQuest.cost_description || 'Free',
        rewards: existingQuest.rewards || '',
        is_repeatable: existingQuest.is_repeatable || false,
        image_url: existingQuest.image_url || '',
        meeting_location_name: existingQuest.meeting_location_name || '',
        meeting_address: existingQuest.meeting_address || '',
        
        // Load constraint values from quest_constraints table or use defaults
        safety_level: (existingQuest.safety_level as QuestFormData['safety_level']) || 'public_only',
        ai_generated: existingQuest.ai_generated || false,
        ai_version: existingQuest.ai_version || '',
      });
    } else if (eventbriteData && !questId) {
      // Pre-populate from Eventbrite import data
      const durationMinutes = calculateDurationMinutes(
        eventbriteData.start_datetime,
        eventbriteData.end_datetime
      );
      
      setFormData({
        ...defaultFormData,
        // Step 1: Basics - Title, description, etc.
        title: eventbriteData.name || '',
        short_description: eventbriteData.description?.slice(0, 280) || '',
        
        // Step 2: Timing - Dates and duration
        start_datetime: eventbriteData.start_datetime 
          ? new Date(eventbriteData.start_datetime).toISOString().slice(0, 16) 
          : '',
        end_datetime: eventbriteData.end_datetime 
          ? new Date(eventbriteData.end_datetime).toISOString().slice(0, 16) 
          : '',
        default_duration_minutes: durationMinutes,
        
        // Step 3: Experience - Full description
        full_description: eventbriteData.description || '',
        
        // Step 7: Capacity
        capacity_total: eventbriteData.capacity || 24,
        cost_description: eventbriteData.is_free ? 'Free' : 'See Eventbrite for pricing',
        
        // Step 8: Media & Location
        image_url: eventbriteData.image_url || '',
        meeting_location_name: eventbriteData.venue_name || '',
        meeting_address: formatEventbriteAddress(eventbriteData.venue_address),
      });
      
      // Mark first few steps as completed since we have data
      setCompletedSteps([1, 2, 3, 8]);
    }
  }, [existingQuest, eventbriteData, questId]);

  const updateFormData = useCallback((updates: Partial<QuestFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
  };

  // Helper to save related quest data after main quest is saved
  const saveRelatedDataAfterQuestSave = async (questId: string, data: QuestFormData) => {
    // Prepare objectives from manual entry if AI draft wasn't used
    let dataToSave = { ...data };
    if ((!data.ai_draft_objectives || data.ai_draft_objectives.length === 0) && data.objectives) {
      dataToSave.ai_draft_objectives = parseManualObjectives(data.objectives);
    }
    
    const result = await saveQuestRelatedData(questId, dataToSave);
    if (!result.success) {
      console.warn('Some related data may not have been saved:', result.error);
    } else {
      console.log('Related data saved:', result.savedCounts);
    }
  };

  // Save quest mutation
  const saveMutation = useMutation({
    mutationFn: async (submitForReview: boolean) => {
      if (!user) throw new Error('Not authenticated');
      
      const slug = formData.slug || generateSlug(formData.title) + '-' + Date.now().toString(36);
      
      const questData: Record<string, unknown> = {
        title: formData.title.trim(),
        slug,
        icon: formData.icon,
        theme: formData.theme || null,
        progression_tree: formData.progression_tree || null,
        tags: formData.tags,
        short_description: formData.short_description || null,
        start_datetime: formData.start_datetime || null,
        end_datetime: formData.end_datetime || null,
        duration_notes: formData.duration_notes || null,
        duration_steps: formData.duration_steps && formData.duration_steps.length > 0 ? formData.duration_steps : null,
        default_duration_minutes: formData.default_duration_minutes || 120,
        full_description: formData.full_description || null,
        highlights: formData.highlights.length > 0 ? formData.highlights : null,
        objectives: formData.objectives || null,
        success_criteria: formData.success_criteria || null,
        what_to_bring: formData.what_to_bring || null,
        dress_code: formData.dress_code || null,
        physical_requirements: formData.physical_requirements || null,
        safety_notes: formData.safety_notes || null,
        emergency_contact: formData.emergency_contact || null,
        age_restriction: formData.age_restriction || null,
        capacity_total: formData.capacity_total,
        default_squad_size: formData.default_squad_size || 4,
        cost_description: formData.cost_description || 'Free',
        rewards: formData.rewards || null,
        is_repeatable: formData.is_repeatable || false,
        image_url: formData.image_url || null,
        meeting_location_name: formData.meeting_location_name || null,
        meeting_address: formData.meeting_address || null,
        creator_id: user.id,
        creator_type: 'community' as const,
        review_status: submitForReview ? 'pending_review' as const : 'draft' as const,
        submitted_at: submitForReview ? new Date().toISOString() : null,
        status: 'draft' as const,
      };
      
      // Include Eventbrite data if this is an import
      if (eventbriteData && !formData.id) {
        questData.eventbrite_event_id = eventbriteData.eventbrite_event_id;
        questData.created_via = 'eventbrite';
        questData.external_ticket_url = eventbriteData.ticket_url;
        questData.is_ticketed = !eventbriteData.is_free;
      }

      if (formData.id) {
        // Update existing
        const { data, error } = await supabase
          .from('quests')
          .update(questData as any)
          .eq('id', formData.id)
          .eq('creator_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        
        // Save related data (constraints, objectives, roles, affinities)
        await saveRelatedDataAfterQuestSave(data.id, formData);
        
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('quests')
          .insert(questData as any)
          .select()
          .single();
        
        if (error) throw error;
        
        // Save related data (constraints, objectives, roles, affinities)
        await saveRelatedDataAfterQuestSave(data.id, formData);
        
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
    onError: (error: any) => {
      console.error('Save error full:', JSON.stringify(error, null, 2));
      console.error('Save error message:', error?.message);
      console.error('Save error details:', error?.details);
      console.error('Save error hint:', error?.hint);
      console.error('Save error code:', error?.code);
      toast({
        title: 'Save Failed',
        description: error?.message || 'Could not save your quest. Please try again.',
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

  // Auto-save as draft when navigating away from a step (debounced)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  
  const autoSave = useCallback(async () => {
    // Only auto-save if there's a title and user is authenticated
    if (!formData.title.trim() || !user) return;
    
    // Serialize current form data to check for changes
    const currentDataString = JSON.stringify({
      title: formData.title,
      short_description: formData.short_description,
      full_description: formData.full_description,
      progression_tree: formData.progression_tree,
      objectives: formData.objectives,
      success_criteria: formData.success_criteria,
      what_to_bring: formData.what_to_bring,
      dress_code: formData.dress_code,
      physical_requirements: formData.physical_requirements,
      safety_notes: formData.safety_notes,
      rewards: formData.rewards,
    });
    
    // Skip if no changes
    if (currentDataString === lastSavedDataRef.current) return;
    
    try {
      await saveMutation.mutateAsync(false);
      lastSavedDataRef.current = currentDataString;
    } catch (error) {
      // Silent fail for auto-save - user can manually save
      console.warn('Auto-save failed:', error);
    }
  }, [formData, user, saveMutation]);

  const goToStep = useCallback((step: number) => {
    // Trigger auto-save when navigating
    if (formData.title.trim()) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 1500); // Debounce 1.5 seconds
    }
    
    setCurrentStep(prevStep => {
      if (step > prevStep) {
        setCompletedSteps(prev => 
          prev.includes(prevStep) ? prev : [...prev, prevStep]
        );
      }
      return step;
    });
  }, [formData.title, autoSave]);

  const nextStep = useCallback(() => {
    // Trigger auto-save when navigating
    if (formData.title.trim()) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 1500);
    }
    
    setCurrentStep(prev => {
      if (prev < WIZARD_STEPS.length) {
        setCompletedSteps(completed => 
          completed.includes(prev) ? completed : [...completed, prev]
        );
        return prev + 1;
      }
      return prev;
    });
  }, [formData.title, autoSave]);

  const prevStep = useCallback(() => {
    // Trigger auto-save when navigating
    if (formData.title.trim()) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 1500);
    }
    
    setCurrentStep(prev => prev > 1 ? prev - 1 : prev);
  }, [formData.title, autoSave]);
  
  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicsStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <TimingStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <ConstraintsStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <AIDraftStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <ExperienceStep formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <ObjectivesStep formData={formData} updateFormData={updateFormData} />;
      case 7:
        return <ExpectationsStep formData={formData} updateFormData={updateFormData} />;
      case 8:
        return <SafetyStep formData={formData} updateFormData={updateFormData} />;
      case 9:
        return <CapacityStep formData={formData} updateFormData={updateFormData} />;
      case 10:
        return <MediaStep formData={formData} updateFormData={updateFormData} />;
      case 11:
        return <ReviewStep formData={formData} completedSteps={completedSteps} onNavigateToStep={goToStep} />;
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
          
          {/* Live Quest Warning Banner */}
          {existingQuest && ['open', 'closed'].includes(existingQuest.status || '') && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 text-xl">⚠️</span>
                <div>
                  <p className="font-medium text-amber-600 dark:text-amber-400">Editing a Live Quest</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Some fields are locked to protect participants who have already signed up.
                    You can still update descriptions, images, meeting details, and what to bring.
                    For date or capacity changes, please contact support.
                  </p>
                </div>
              </div>
            </div>
          )}
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
