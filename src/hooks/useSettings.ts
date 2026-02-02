/**
 * =============================================================================
 * useSettings Hook - Manage user privacy and notification preferences
 * =============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { 
  NotificationPreferences, 
  PrivacySettings, 
  DeletionRequest 
} from '@/types/settings';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_PRIVACY_SETTINGS
} from '@/types/settings';

export function useSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current settings from profile
  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences, privacy_settings')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      // Safely parse JSONB with defaults
      const notificationPrefs = typeof data.notification_preferences === 'object' && data.notification_preferences !== null
        ? { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(data.notification_preferences as Record<string, unknown>) }
        : DEFAULT_NOTIFICATION_PREFERENCES;
      
      const privacySettings = typeof data.privacy_settings === 'object' && data.privacy_settings !== null
        ? { ...DEFAULT_PRIVACY_SETTINGS, ...(data.privacy_settings as Record<string, unknown>) }
        : DEFAULT_PRIVACY_SETTINGS;
      
      return {
        notifications: notificationPrefs as NotificationPreferences,
        privacy: privacySettings as PrivacySettings,
      };
    },
    enabled: !!user?.id,
  });

  // Update notification preferences
  const updateNotifications = useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const current = settings?.notifications || {};
      const updated = { ...current, ...preferences };
      
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: updated })
        .eq('id', user.id);
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      toast.error('Failed to update preferences');
      console.error(error);
    },
  });

  // Update privacy settings
  const updatePrivacy = useMutation({
    mutationFn: async (newSettings: Partial<PrivacySettings>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: current } = await supabase
        .from('profiles')
        .select('privacy_settings')
        .eq('id', user.id)
        .single();
      
      const currentSettings = typeof current?.privacy_settings === 'object' && current.privacy_settings !== null
        ? current.privacy_settings as Record<string, unknown>
        : {};
      
      const updated = { ...currentSettings, ...newSettings };
      
      const { error } = await supabase
        .from('profiles')
        .update({ privacy_settings: updated })
        .eq('id', user.id);
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast.success('Privacy settings updated');
    },
    onError: (error) => {
      toast.error('Failed to update settings');
      console.error(error);
    },
  });

  // Fetch active deletion request
  const { data: deletionRequest } = useQuery({
    queryKey: ['deletion-request', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('account_deletion_requests_safe')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as DeletionRequest | null;
    },
    enabled: !!user?.id,
  });

  // Cancel deletion request
  const cancelDeletion = useMutation({
    mutationFn: async (reason?: string) => {
      if (!user?.id || !deletionRequest?.id) throw new Error('No active deletion request');
      
      const { error } = await supabase
        .from('account_deletion_requests')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason || 'User cancelled',
          processed_at: new Date().toISOString()
        })
        .eq('id', deletionRequest.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-request'] });
      toast.success('Account deletion cancelled');
    },
    onError: (error) => {
      toast.error('Failed to cancel deletion');
      console.error(error);
    },
  });

  return {
    settings,
    isLoading,
    updateNotifications: updateNotifications.mutate,
    updatePrivacy: updatePrivacy.mutate,
    isUpdating: updateNotifications.isPending || updatePrivacy.isPending,
    deletionRequest,
    cancelDeletion: cancelDeletion.mutate,
    isCancellingDeletion: cancelDeletion.isPending,
  };
}
