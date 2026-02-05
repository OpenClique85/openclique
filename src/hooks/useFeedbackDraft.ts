/**
 * Feedback Draft Hook
 * 
 * Provides localStorage-based auto-save for feedback forms.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface FeedbackDraft {
  // Step 1
  rating?: number;
  repeatIntent?: string;
  feelings?: string[];
  npsScore?: number;
  wouldInviteFriend?: boolean | null;
  
  // Step 2
  workedWell?: string[];
  workedPoorly?: string[];
  lengthRating?: string;
  confusionNotes?: string;
  comfortScore?: number;
  groupFit?: string;
  reconnectIntent?: string;
  preferredCliqueMembers?: string[];
  
  // Step 3
  pricingModelPreference?: string;
  tooCheapPrice?: string;
  fairPrice?: string;
  expensivePrice?: string;
  tooExpensivePrice?: string;
  valueDrivers?: string[];
  
  // Step 4
  testimonialText?: string;
  recommendationText?: string;
  consentType?: 'anonymous' | 'first_name_city' | null;
  interviewOptIn?: boolean;
  
  // Meta
  currentStep?: number;
  lastSaved?: string;
}

const STORAGE_KEY_PREFIX = 'feedback_draft_';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export function useFeedbackDraft(questId: string | undefined) {
  const [draft, setDraft] = useState<FeedbackDraft | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const draftRef = useRef<FeedbackDraft | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // Load draft on mount
  useEffect(() => {
    if (!questId) return;
    
    const key = `${STORAGE_KEY_PREFIX}${questId}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as FeedbackDraft;
        setDraft(parsed);
      }
    } catch (error) {
      console.warn('Failed to load feedback draft:', error);
    }
    setIsLoaded(true);
  }, [questId]);

  // Save to localStorage
  const saveDraft = useCallback((updates: Partial<FeedbackDraft>) => {
    if (!questId) return;
    
    const key = `${STORAGE_KEY_PREFIX}${questId}`;
    const newDraft = {
      ...draftRef.current,
      ...updates,
      lastSaved: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(newDraft));
      setDraft(newDraft);
    } catch (error) {
      console.warn('Failed to save feedback draft:', error);
    }
  }, [questId]);

  // Clear draft (on successful submission)
  const clearDraft = useCallback(() => {
    if (!questId) return;
    
    const key = `${STORAGE_KEY_PREFIX}${questId}`;
    try {
      localStorage.removeItem(key);
      setDraft(null);
    } catch (error) {
      console.warn('Failed to clear feedback draft:', error);
    }
  }, [questId]);

  // Auto-save interval
  useEffect(() => {
    if (!questId || !isLoaded) return;

    autoSaveRef.current = setInterval(() => {
      if (draftRef.current && Object.keys(draftRef.current).length > 0) {
        saveDraft({}); // Trigger save with current data
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [questId, isLoaded, saveDraft]);

  return {
    draft,
    isLoaded,
    saveDraft,
    clearDraft,
    hasDraft: !!draft && Object.keys(draft).length > 0,
  };
}
