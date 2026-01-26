import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CliqueCard } from './CliqueCard';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';

interface CliqueMember {
  user_id: string;
  display_name: string;
  role: 'leader' | 'member';
}

interface Clique {
  id: string;
  name: string;
  created_at: string;
  members: CliqueMember[];
  quest_count: number;
}

interface MyCliquesSectionProps {
  userId: string;
}

export function MyCliquesSection({ userId }: MyCliquesSectionProps) {
  const [cliques, setCliques] = useState<Clique[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCliques = async () => {
      // Get all clique memberships for the current user
      const { data: memberships } = await supabase
        .from('squad_members')
        .select('persistent_squad_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .not('persistent_squad_id', 'is', null);

      if (!memberships || memberships.length === 0) {
        setIsLoading(false);
        return;
      }

      const cliqueIds = memberships
        .map(m => m.persistent_squad_id)
        .filter((id): id is string => id !== null);

      if (cliqueIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // Fetch clique details
      const { data: cliqueData } = await supabase
        .from('squads')
        .select('id, name, created_at')
        .in('id', cliqueIds);

      if (!cliqueData) {
        setIsLoading(false);
        return;
      }

      // For each clique, fetch members and quest count
      const cliquesWithDetails: Clique[] = await Promise.all(
        cliqueData.map(async (clique) => {
          // Get members
          const { data: members } = await supabase
            .from('squad_members')
            .select('user_id, role')
            .eq('persistent_squad_id', clique.id)
            .eq('status', 'active');

          // Get profiles for members
          const memberUserIds = members?.map(m => m.user_id) || [];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', memberUserIds);

          const membersWithNames: CliqueMember[] = (members || []).map(m => {
            const profile = profiles?.find(p => p.id === m.user_id);
            return {
              user_id: m.user_id,
              display_name: profile?.display_name || 'Unknown',
              role: (m.role as 'leader' | 'member') || 'member'
            };
          });

          // Count quests (via squad_quest_invites with status accepted)
          const { count: questCount } = await supabase
            .from('squad_quest_invites')
            .select('id', { count: 'exact', head: true })
            .eq('squad_id', clique.id)
            .eq('status', 'accepted');

          return {
            id: clique.id,
            name: clique.name,
            created_at: clique.created_at,
            members: membersWithNames,
            quest_count: questCount || 0
          };
        })
      );

      setCliques(cliquesWithDetails);
      setIsLoading(false);
    };

    fetchCliques();
  }, [userId]);

  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          My Cliques
        </h2>
        <Card>
          <CardContent className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (cliques.length === 0) {
    return null; // Don't show section if no cliques
  }

  return (
    <section className="mb-8">
      <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        My Cliques ({cliques.length})
      </h2>
      
      <div className="space-y-3">
        {cliques.map((clique) => (
          <CliqueCard
            key={clique.id}
            id={clique.id}
            name={clique.name}
            members={clique.members}
            questCount={clique.quest_count}
            createdAt={clique.created_at}
            currentUserId={userId}
          />
        ))}
      </div>
    </section>
  );
}
