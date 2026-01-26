/**
 * =============================================================================
 * useEntitlements Hook - Cached entitlement checking for multi-tenant system
 * =============================================================================
 * 
 * OpenClique is multi-tenant, not cascading. Each payer is independent.
 * This hook provides cached entitlement lookups without RPC spam.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables } from '@/integrations/supabase/types';

type EntitlementScope = 'city_scope' | 'org_scope' | 'personal_scope';
type SourceType = 'org_membership' | 'personal_subscription' | 'admin_grant';

interface UserEntitlement {
  id: string;
  user_id: string;
  scope: EntitlementScope;
  source_type: SourceType;
  source_org_id: string | null;
  is_active: boolean;
  granted_at: string;
  expires_at: string | null;
  created_at: string;
  source_org?: {
    id: string;
    name: string;
    slug: string | null;
    account_tier: string | null;
    billing_status: string | null;
  } | null;
}

export function useEntitlements() {
  const { user } = useAuth();

  // Single cached fetch - avoid RPC spam
  const { data: entitlements = [], isLoading, refetch } = useQuery({
    queryKey: ['user-entitlements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_entitlements')
        .select(`
          id,
          user_id,
          scope,
          source_type,
          source_org_id,
          is_active,
          granted_at,
          expires_at,
          created_at,
          source_org:organizations(id, name, slug, account_tier, billing_status)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching entitlements:', error);
        return [];
      }
      
      return (data || []) as UserEntitlement[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  /**
   * Check if user has premium features WITHIN a specific org
   * This is scoped - org payment only covers that org's spaces
   */
  const hasOrgPremium = (orgId: string): boolean => {
    return entitlements.some(
      e => e.scope === 'org_scope' && e.source_org_id === orgId
    );
  };

  /**
   * Check if user has personal premium (cross-org features)
   * This covers: social mapping, personal cliques, algorithm controls, wrapped
   */
  const hasPersonalPremium = (): boolean => {
    return entitlements.some(e => e.scope === 'personal_scope');
  };

  /**
   * Check city admin access (NOT city residency - that was removed)
   * City access is by admin membership, not residency
   */
  const hasCityAccess = (cityOrgId?: string): boolean => {
    if (cityOrgId) {
      return entitlements.some(
        e => e.scope === 'city_scope' && e.source_org_id === cityOrgId
      );
    }
    return entitlements.some(e => e.scope === 'city_scope');
  };

  /**
   * Get list of org IDs where user has premium access
   */
  const premiumOrgIds = (): string[] => {
    return entitlements
      .filter(e => e.scope === 'org_scope' && e.source_org_id)
      .map(e => e.source_org_id as string);
  };

  /**
   * Get all orgs with their premium status for user
   */
  const getOrgEntitlements = () => {
    return entitlements
      .filter(e => e.scope === 'org_scope')
      .map(e => ({
        orgId: e.source_org_id,
        orgName: e.source_org?.name,
        billingStatus: e.source_org?.billing_status,
        grantedAt: e.granted_at,
        expiresAt: e.expires_at,
      }));
  };

  /**
   * Check if user should see premium upsell in a given context
   * Suppress prompts in sponsored org spaces, show elsewhere
   */
  const shouldShowPremiumUpsell = (orgId?: string): boolean => {
    // If viewing within a sponsored org, suppress payment prompt
    if (orgId && hasOrgPremium(orgId)) {
      return false; // Don't prompt - they already have premium here
    }
    
    // If user already has personal premium, no upsell needed
    if (hasPersonalPremium()) {
      return false;
    }
    
    return true; // Show upsell for personal premium
  };

  return {
    // Data
    entitlements,
    isLoading,
    refetch,
    
    // Scope checks (cached, no RPC)
    hasOrgPremium,
    hasPersonalPremium,
    hasCityAccess,
    
    // Helpers
    premiumOrgIds,
    getOrgEntitlements,
    shouldShowPremiumUpsell,
    
    // Counts
    totalEntitlements: entitlements.length,
    orgEntitlementCount: entitlements.filter(e => e.scope === 'org_scope').length,
  };
}
