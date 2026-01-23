import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type FeatureFlag = Tables<'feature_flags'>;

export function useFeatureFlags() {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('key');
      
      if (error) throw error;
      return data as FeatureFlag[];
    },
  });
}

export function useFeatureFlag(key: string): boolean {
  const { user, profile } = useAuth();
  const { data: flags } = useFeatureFlags();
  
  if (!flags) return false;
  
  const flag = flags.find(f => f.key === key);
  if (!flag || !flag.is_enabled) return false;
  
  // Check rollout percentage
  if (flag.rollout_percentage < 100) {
    // Use user ID for consistent bucketing
    if (user?.id) {
      const hash = hashString(user.id + key);
      if (hash % 100 >= flag.rollout_percentage) {
        return false;
      }
    }
  }
  
  // Check user targeting
  if (flag.target_user_ids && flag.target_user_ids.length > 0) {
    if (user?.id && flag.target_user_ids.includes(user.id)) {
      return true;
    }
  }
  
  // If no specific targeting, flag is on for everyone
  if (
    (!flag.target_roles || flag.target_roles.length === 0) &&
    (!flag.target_org_ids || flag.target_org_ids.length === 0) &&
    (!flag.target_user_ids || flag.target_user_ids.length === 0)
  ) {
    return true;
  }
  
  return false;
}

// Simple hash function for consistent bucketing
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function useCreateFeatureFlag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (flag: { key: string; name: string; description?: string; is_enabled?: boolean; target_roles?: string[]; target_org_ids?: string[]; target_user_ids?: string[]; rollout_percentage?: number }) => {
      const { data, error } = await supabase
        .from('feature_flags')
        .insert({
          key: flag.key,
          name: flag.name,
          description: flag.description,
          is_enabled: flag.is_enabled ?? false,
          rollout_percentage: flag.rollout_percentage ?? 100,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });
}

export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FeatureFlag> & { id: string }) => {
      const { data, error } = await supabase
        .from('feature_flags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });
}

export function useDeleteFeatureFlag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });
}

export function useFeatureFlagAudit(flagId: string) {
  return useQuery({
    queryKey: ['feature-flag-audit', flagId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flag_audit')
        .select('*')
        .eq('flag_id', flagId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!flagId,
  });
}
