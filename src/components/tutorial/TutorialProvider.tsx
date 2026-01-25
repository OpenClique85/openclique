/**
 * =============================================================================
 * TutorialProvider - Context and state for first-time user tutorial
 * =============================================================================
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  route?: string;
  action?: 'navigate' | 'click' | 'observe';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to OpenClique!',
    description: "I'm Buggs 🐰, and I'll show you around. Let's find your people!",
  },
  {
    id: 'quests-page',
    title: 'Browse Quests',
    description: 'This is where you find real-world experiences to join. Each quest is a structured adventure.',
    route: '/quests',
    targetSelector: '[data-tutorial="quests-list"]',
  },
  {
    id: 'quest-card',
    title: 'Quest Cards',
    description: 'Click any quest to see details: when, where, what to expect, and who else might join.',
    targetSelector: '[data-tutorial="quest-card"]',
    action: 'click',
  },
  {
    id: 'profile',
    title: 'Your Profile Hub',
    description: 'This is your home base. Track your cliques, quests, and personalize your algorithm.',
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
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  shouldShowTutorial: boolean;
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

  // Check if user should see tutorial (new user, hasn't completed)
  useEffect(() => {
    if (profile && !profile.tutorial_completed_at) {
      setShouldShowTutorial(true);
    } else {
      setShouldShowTutorial(false);
    }
  }, [profile]);

  const startTutorial = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
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
        startTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        completeTutorial,
        shouldShowTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}
