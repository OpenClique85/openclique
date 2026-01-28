/**
 * =============================================================================
 * FRIEND INVITE HOOK
 * =============================================================================
 * 
 * Purpose: Manage friend invite codes for quest referrals.
 *          Allows users to invite friends to sign up for a specific quest.
 * 
 * Database Dependencies:
 *   - friend_invites: Stores invite codes and tracks redemptions
 *   - get_or_create_friend_invite RPC: Generates or retrieves codes
 *   - redeem_friend_invite RPC: Handles redemption flow
 * 
 * XP Rewards:
 *   - 50 XP per successful friend recruit
 *   - Achievement unlocks at 1, 5, and 10 recruits
 * 
 * @module hooks/useFriendInvite
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { PUBLISHED_URL } from '@/lib/config';

export interface FriendInvite {
  id: string;
  code: string;
  referrer_user_id: string;
  quest_id: string;
  referred_user_id: string | null;
  created_at: string;
  redeemed_at: string | null;
}

export function useFriendInvite(questId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCopied, setIsCopied] = useState(false);

  // Get or create invite code for this quest
  const { data: inviteData, isLoading, refetch } = useQuery({
    queryKey: ['friend-invite', questId, user?.id],
    queryFn: async () => {
      if (!user?.id || !questId) return null;
      
      const { data, error } = await supabase
        .rpc('get_or_create_friend_invite', { p_quest_id: questId });
      
      if (error) throw error;
      
      // RPC returns array, get first item
      const result = Array.isArray(data) ? data[0] : data;
      return result as { code: string; created: boolean } | null;
    },
    enabled: !!user?.id && !!questId,
  });

  // Get user's successful recruit count
  const { data: recruitStats } = useQuery({
    queryKey: ['friend-recruit-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, forQuest: 0 };
      
      const { data, error } = await supabase
        .from('friend_invites')
        .select('id, quest_id, redeemed_at')
        .eq('referrer_user_id', user.id)
        .not('redeemed_at', 'is', null);
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const forQuest = data?.filter(i => i.quest_id === questId).length || 0;
      
      return { total, forQuest };
    },
    enabled: !!user?.id,
  });

  const code = inviteData?.code || '';
  const shareLink = code ? `${PUBLISHED_URL}/auth?invite=${code}` : '';

  const copyCode = async () => {
    if (!code) return;
    
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast({
        title: 'Code copied!',
        description: 'Share this code with your friend.',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyLink = async () => {
    if (!shareLink) return;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share this link with your friend.',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareNative = async () => {
    if (!shareLink || !navigator.share) return;
    
    try {
      await navigator.share({
        title: 'Join me on OpenClique!',
        text: 'I signed up for a quest on OpenClique. Use my invite code to join me!',
        url: shareLink,
      });
    } catch (err) {
      // User cancelled or share failed - fall back to copy
      if ((err as Error).name !== 'AbortError') {
        await copyLink();
      }
    }
  };

  const canShare = typeof navigator.share === 'function';

  return {
    code,
    shareLink,
    isLoading,
    isCopied,
    copyCode,
    copyLink,
    shareNative,
    canShare,
    recruitStats: recruitStats || { total: 0, forQuest: 0 },
    refetch,
  };
}

/**
 * Hook for redeeming friend invite codes during signup
 */
export function useRedeemFriendInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, userId }: { code: string; userId: string }) => {
      const { data, error } = await supabase
        .rpc('redeem_friend_invite', {
          p_code: code,
          p_new_user_id: userId,
        });
      
      if (error) throw error;
      return data as {
        success: boolean;
        error?: string;
        quest_id?: string;
        referrer_id?: string;
        recruit_count?: number;
        achievements?: Array<{ achievement_name: string; xp_reward: number }>;
      };
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['friend-invite'] });
        queryClient.invalidateQueries({ queryKey: ['quest-signups'] });
      }
    },
  });
}
