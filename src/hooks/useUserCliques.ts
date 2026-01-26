import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserClique {
  id: string;
  name: string;
  member_count: number;
}

export function useUserCliques() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-cliques', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user's active clique memberships
      const { data: memberships } = await supabase
        .from('squad_members')
        .select('persistent_squad_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .not('persistent_squad_id', 'is', null);

      if (!memberships || memberships.length === 0) return [];

      const cliqueIds = memberships
        .map(m => m.persistent_squad_id)
        .filter((id): id is string => id !== null);

      if (cliqueIds.length === 0) return [];

      // Get clique details
      const { data: cliques } = await supabase
        .from('squads')
        .select('id, name')
        .in('id', cliqueIds);

      if (!cliques) return [];

      // Get member counts for each clique
      const cliquesWithCounts: UserClique[] = await Promise.all(
        cliques.map(async (clique) => {
          const { count } = await supabase
            .from('squad_members')
            .select('*', { count: 'exact', head: true })
            .eq('persistent_squad_id', clique.id)
            .eq('status', 'active');

          return {
            id: clique.id,
            name: clique.name || 'Unnamed Clique',
            member_count: count || 0,
          };
        })
      );

      return cliquesWithCounts;
    },
    enabled: !!user?.id,
  });
}
