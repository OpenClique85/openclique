/**
 * =============================================================================
 * usePricingAnalytics Hook - Track pricing page interactions
 * =============================================================================
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

type EventType = 'page_view' | 'tier_view' | 'cta_click' | 'demo_request' | 'application_start' | 'application_submit';
type AccountTier = 'city' | 'enterprise' | 'organization' | 'individual_free' | 'individual_premium';
type EnterpriseType = 'company' | 'university' | 'military' | 'program';

interface TrackEventParams {
  eventType: EventType;
  tierClicked?: AccountTier;
  enterpriseTypeClicked?: EnterpriseType;
  ctaLabel?: string;
  metadata?: Json;
}

// Generate a session ID for anonymous tracking
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('pricing_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('pricing_session_id', sessionId);
  }
  return sessionId;
};

export function usePricingAnalytics() {
  const { user } = useAuth();

  const trackEventMutation = useMutation({
    mutationFn: async (params: TrackEventParams) => {
      const { eventType, tierClicked, enterpriseTypeClicked, ctaLabel, metadata } = params;
      
      const { error } = await supabase
        .from('pricing_page_events')
        .insert([{
          user_id: user?.id || null,
          session_id: getSessionId(),
          event_type: eventType,
          tier_clicked: tierClicked || null,
          enterprise_type_clicked: enterpriseTypeClicked || null,
          cta_label: ctaLabel || null,
          metadata: metadata || null,
        }]);
      
      if (error) {
        console.error('Error tracking pricing event:', error);
        throw error;
      }
    },
  });

  /**
   * Track a page view
   */
  const trackPageView = () => {
    trackEventMutation.mutate({ eventType: 'page_view' });
  };

  /**
   * Track when user views a specific tier
   */
  const trackTierView = (tier: AccountTier, enterpriseType?: EnterpriseType) => {
    trackEventMutation.mutate({
      eventType: 'tier_view',
      tierClicked: tier,
      enterpriseTypeClicked: enterpriseType,
    });
  };

  /**
   * Track CTA button clicks
   */
  const trackCTAClick = (
    tier: AccountTier,
    ctaLabel: string,
    enterpriseType?: EnterpriseType
  ) => {
    trackEventMutation.mutate({
      eventType: 'cta_click',
      tierClicked: tier,
      enterpriseTypeClicked: enterpriseType,
      ctaLabel,
    });
  };

  /**
   * Track demo request
   */
  const trackDemoRequest = (tier: AccountTier, enterpriseType?: EnterpriseType) => {
    trackEventMutation.mutate({
      eventType: 'demo_request',
      tierClicked: tier,
      enterpriseTypeClicked: enterpriseType,
    });
  };

  /**
   * Track application start
   */
  const trackApplicationStart = (tier: AccountTier, enterpriseType?: EnterpriseType) => {
    trackEventMutation.mutate({
      eventType: 'application_start',
      tierClicked: tier,
      enterpriseTypeClicked: enterpriseType,
    });
  };

  /**
   * Track application submission
   */
  const trackApplicationSubmit = (
    tier: AccountTier,
    enterpriseType?: EnterpriseType,
    metadata?: Json
  ) => {
    trackEventMutation.mutate({
      eventType: 'application_submit',
      tierClicked: tier,
      enterpriseTypeClicked: enterpriseType,
      metadata,
    });
  };

  return {
    trackPageView,
    trackTierView,
    trackCTAClick,
    trackDemoRequest,
    trackApplicationStart,
    trackApplicationSubmit,
    isTracking: trackEventMutation.isPending,
  };
}
