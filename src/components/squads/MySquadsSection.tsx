import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SquadCard } from './SquadCard';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';

interface SquadMember {
  user_id: string;
  display_name: string;
  role: 'leader' | 'member';
}

interface Squad {
  id: string;
  name: string;
  created_at: string;
  members: SquadMember[];
  quest_count: number;
}

interface MySquadsSectionProps {
  userId: string;
}

export function MySquadsSection({ userId }: MySquadsSectionProps) {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSquads = async () => {
      // Get all squad memberships for the current user
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

      const squadIds = memberships
        .map(m => m.persistent_squad_id)
        .filter((id): id is string => id !== null);

      if (squadIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // Fetch squad details
      const { data: squadData } = await supabase
        .from('squads')
        .select('id, name, created_at')
        .in('id', squadIds);

      if (!squadData) {
        setIsLoading(false);
        return;
      }

      // For each squad, fetch members and quest count
      const squadsWithDetails: Squad[] = await Promise.all(
        squadData.map(async (squad) => {
          // Get members
          const { data: members } = await supabase
            .from('squad_members')
            .select('user_id, role')
            .eq('persistent_squad_id', squad.id)
            .eq('status', 'active');

          // Get profiles for members
          const memberUserIds = members?.map(m => m.user_id) || [];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', memberUserIds);

          const membersWithNames: SquadMember[] = (members || []).map(m => {
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
            .eq('squad_id', squad.id)
            .eq('status', 'accepted');

          return {
            id: squad.id,
            name: squad.name,
            created_at: squad.created_at,
            members: membersWithNames,
            quest_count: questCount || 0
          };
        })
      );

      setSquads(squadsWithDetails);
      setIsLoading(false);
    };

    fetchSquads();
  }, [userId]);

  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          My Squads
        </h2>
        <Card>
          <CardContent className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (squads.length === 0) {
    return null; // Don't show section if no squads
  }

  return (
    <section className="mb-8">
      <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        My Squads ({squads.length})
      </h2>
      
      <div className="space-y-3">
        {squads.map((squad) => (
          <SquadCard
            key={squad.id}
            id={squad.id}
            name={squad.name}
            members={squad.members}
            questCount={squad.quest_count}
            createdAt={squad.created_at}
            currentUserId={userId}
          />
        ))}
      </div>
    </section>
  );
}
