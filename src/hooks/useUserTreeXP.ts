/**
 * =============================================================================
 * USER TREE XP HOOK - Track XP per progression tree (culture, wellness, connector)
 * =============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TreeXP {
  tree_id: string;
  tree_xp: number;
}

export interface UserTreeXPData {
  culture: number;
  wellness: number;
  connector: number;
  [key: string]: number;
}

export function useUserTreeXP() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-tree-xp', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_tree_xp')
        .select('tree_id, tree_xp')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as TreeXP[];
    },
    enabled: !!user?.id,
  });

  // Convert array to object for easy access
  const treeXP: UserTreeXPData = {
    culture: 0,
    wellness: 0,
    connector: 0,
  };

  data?.forEach((item) => {
    treeXP[item.tree_id] = item.tree_xp;
  });

  return {
    treeXP,
    rawData: data ?? [],
    isLoading,
  };
}

// Get tree name for display
export function getTreeDisplayName(treeId: string): string {
  const names: Record<string, string> = {
    culture: '🎨 Culture & Arts',
    wellness: '🏃 Wellness & Fitness',
    connector: '🤝 Social & Networking',
  };
  return names[treeId] || treeId;
}

// Get tree icon
export function getTreeIcon(treeId: string): string {
  const icons: Record<string, string> = {
    culture: '🎨',
    wellness: '🏃',
    connector: '🤝',
  };
  return icons[treeId] || '⭐';
}
