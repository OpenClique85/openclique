/**
 * =============================================================================
 * usePilotMode Hook - Per-tenant pilot status checking
 * =============================================================================
 * 
 * Pilot status is per-tenant via organizations.billing_status.
 * The global flag only affects new tenant defaults.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type BillingStatus = 'pilot_active' | 'negotiating' | 'converted' | 'past_due' | 'churned';

export function usePilotMode() {
  // Global default for new tenants (cached)
  const { data: globalDefault } = useQuery({
    queryKey: ['feature-flag', 'pilot_mode_default'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('is_enabled')
        .eq('key', 'pilot_mode_default')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching pilot mode flag:', error);
        return true; // Default to pilot mode if error
      }
      
      return data?.is_enabled ?? true;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 60 * 60 * 1000,
  });

  /**
   * Check if specific org is in pilot phase
   */
  const isOrgInPilot = (billingStatus?: string | null): boolean => {
    return billingStatus === 'pilot_active';
  };

  /**
   * Check if org has access to features (pilot OR converted)
   */
  const hasOrgFeatures = (billingStatus?: string | null): boolean => {
    return ['pilot_active', 'converted'].includes(billingStatus ?? '');
  };

  /**
   * Check if org is in grace period (negotiating)
   */
  const isOrgInGracePeriod = (billingStatus?: string | null): boolean => {
    return billingStatus === 'negotiating';
  };

  /**
   * Check if org has billing issues
   */
  const hasOrgBillingIssue = (billingStatus?: string | null): boolean => {
    return ['past_due', 'churned'].includes(billingStatus ?? '');
  };

  /**
   * Get display label for billing status
   */
  const getBillingStatusLabel = (billingStatus?: string | null): string => {
    switch (billingStatus) {
      case 'pilot_active':
        return 'Pilot (Free)';
      case 'negotiating':
        return 'Negotiating';
      case 'converted':
        return 'Active';
      case 'past_due':
        return 'Past Due';
      case 'churned':
        return 'Churned';
      default:
        return 'Unknown';
    }
  };

  /**
   * Get display color for billing status
   */
  const getBillingStatusColor = (billingStatus?: string | null): string => {
    switch (billingStatus) {
      case 'pilot_active':
        return 'text-blue-600 bg-blue-100';
      case 'negotiating':
        return 'text-amber-600 bg-amber-100';
      case 'converted':
        return 'text-green-600 bg-green-100';
      case 'past_due':
        return 'text-red-600 bg-red-100';
      case 'churned':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return {
    // Global pilot default (for new tenants)
    globalPilotDefault: globalDefault ?? true,
    
    // Per-tenant status checks
    isOrgInPilot,
    hasOrgFeatures,
    isOrgInGracePeriod,
    hasOrgBillingIssue,
    
    // Display helpers
    getBillingStatusLabel,
    getBillingStatusColor,
  };
}
