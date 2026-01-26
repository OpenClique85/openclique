/**
 * =============================================================================
 * TutorialProvider - Context and state for first-time user tutorial
 * =============================================================================
 * 
 * Enhanced tutorial system with action-based steps that require user interaction:
 * - Update profile
 * - Sign up for a quest  
 * - Send a message in squad chat
 * 
 * Awards XP for completing tutorial milestones.
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type TutorialAction = 
  | 'navigate'
  | 'click' 
  | 'observe'
  | 'profile_update'
  | 'quest_signup'
  | 'squad_chat';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  route?: string;
  action?: TutorialAction;
  xpReward?: number;
  requiresCompletion?: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to OpenClique!',
    description: "I'm Buggs 🐰, and I'll show you around. Let's find your people!",
  },
  {
    id: 'profile-setup',
    title: 'Set Up Your Profile',
    description: 'First, tell us a bit about yourself. Click "Edit Profile" to get started and earn 25 XP!',
    route: '/profile?tab=me',
    targetSelector: '[data-tutorial="edit-profile-btn"]',
    action: 'profile_update',
    xpReward: 25,
    requiresCompletion: true,
  },
  {
    id: 'quests-browse',
    title: 'Browse Quests',
    description: 'Quests are real-world experiences you can join. Each one is a structured adventure with new people.',
    route: '/quests',
    targetSelector: '[data-tutorial="quests-list"]',
  },
  {
    id: 'quest-signup',
    title: 'Join Your First Quest',
    description: 'Click any quest that interests you and sign up. This will earn you 15 XP and match you with a squad!',
    route: '/quests',
    targetSelector: '[data-tutorial="quest-card"]',
    action: 'quest_signup',
    xpReward: 15,
    requiresCompletion: true,
  },
  {
    id: 'profile-hub',
    title: 'Your Hub',
    description: 'This is your home base. Track your quests, cliques, and personalize how we match you.',
    route: '/profile',
    targetSelector: '[data-tutorial="profile-tabs"]',
  },
  {
    id: 'algorithm',
    title: 'Your Algorithm',
    description: 'Tell us how you like to connect. This helps us match you with compatible squadmates.',
    route: '/profile?tab=me',
    targetSelector: '[data-tutorial="algorithm-section"]',
  },
  {
    id: 'cliques',
    title: 'Your Cliques',
    description: "After completing quests, you'll form cliques – your recurring adventure crews!",
    route: '/profile?tab=cliques',
    targetSelector: '[data-tutorial="cliques-tab"]',
  },
  {
    id: 'squad-chat-intro',
    title: 'Squad Chat',
    description: 'Once you\'re matched to a squad, you can chat with your teammates. Send a message to earn 10 XP!',
    targetSelector: '[data-tutorial="squad-chat"]',
    action: 'squad_chat',
    xpReward: 10,
    requiresCompletion: true,
  },
  {
    id: 'gamification',
    title: 'Earn XP & Badges',
    description: 'Complete quests, give feedback, and explore paths to level up and unlock achievements.',
    targetSelector: '[data-tutorial="xp-badge"]',
  },
  {
    id: 'notifications',
    title: 'Stay in the Loop',
    description: "We'll notify you about squad updates, upcoming quests, and new opportunities.",
    targetSelector: '[data-tutorial="notification-bell"]',
  },
  {
    id: 'support',
    title: 'Need Help?',
    description: "Questions or feedback? We're always here to help. Click Get Help anytime.",
    targetSelector: '[data-tutorial="support-button"]',
  },
  {
    id: 'complete',
    title: "You're Ready!",
    description: 'Go find your first quest and meet your people. Adventure awaits! 🎯',
  },
];

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  completedActions: Set<TutorialAction>;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  shouldShowTutorial: boolean;
  markActionComplete: (action: TutorialAction) => void;
  canProceed: boolean;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

interface TutorialProviderProps {
  children: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const { user, profile } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [shouldShowTutorial, setShouldShowTutorial] = useState(false);
  const [completedActions, setCompletedActions] = useState<Set<TutorialAction>>(new Set());

  // Check if user should see tutorial (new user, hasn't completed)
  useEffect(() => {
    if (profile && !profile.tutorial_completed_at) {
      setShouldShowTutorial(true);
      
      // Load previously completed steps from profile
      if (profile.tutorial_steps_completed && Array.isArray(profile.tutorial_steps_completed)) {
        const actions = new Set<TutorialAction>();
        if (profile.tutorial_steps_completed.includes('profile-setup')) {
          actions.add('profile_update');
        }
        if (profile.tutorial_steps_completed.includes('quest-signup')) {
          actions.add('quest_signup');
        }
        if (profile.tutorial_steps_completed.includes('squad-chat-intro')) {
          actions.add('squad_chat');
        }
        setCompletedActions(actions);
      }
    } else {
      setShouldShowTutorial(false);
    }
  }, [profile]);

  const step = TUTORIAL_STEPS[currentStep];
  
  // Check if current step requires completion and if that action is done
  const canProceed = !step?.requiresCompletion || 
    (step.action && completedActions.has(step.action));

  const startTutorial = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const markActionComplete = useCallback(async (action: TutorialAction) => {
    if (completedActions.has(action)) return;
    
    setCompletedActions(prev => new Set([...prev, action]));
    
    // Save step completion to database
    if (user) {
      const stepId = TUTORIAL_STEPS.find(s => s.action === action)?.id;
      if (stepId) {
        // Get current steps as array, handling various JSON types
        const rawSteps = profile?.tutorial_steps_completed;
        const currentSteps: string[] = Array.isArray(rawSteps) 
          ? rawSteps.filter((s): s is string => typeof s === 'string')
          : [];
        const newSteps = [...new Set([...currentSteps, stepId])];
        
        await supabase
          .from('profiles')
          .update({ tutorial_steps_completed: newSteps })
          .eq('id', user.id);
      }
    }
  }, [user, profile, completedActions]);

  const nextStep = () => {
    // Don't proceed if step requires completion and action not done
    if (step?.requiresCompletion && step.action && !completedActions.has(step.action)) {
      return;
    }
    
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipTutorial = async () => {
    setIsActive(false);
    await markTutorialComplete();
  };

  const completeTutorial = async () => {
    setIsActive(false);
    await markTutorialComplete();
  };

  const markTutorialComplete = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        tutorial_completed_at: new Date().toISOString(),
        tutorial_steps_completed: TUTORIAL_STEPS.map(s => s.id)
      })
      .eq('id', user.id);

    if (!error) {
      setShouldShowTutorial(false);
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        steps: TUTORIAL_STEPS,
        completedActions,
        startTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        completeTutorial,
        shouldShowTutorial,
        markActionComplete,
        canProceed,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}
