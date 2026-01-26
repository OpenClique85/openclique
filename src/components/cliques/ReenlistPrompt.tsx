import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users, PartyPopper } from 'lucide-react';

interface CliqueMember {
  user_id: string;
  display_name: string;
}

interface ReenlistPromptProps {
  questId: string;
  userId: string;
  onResponse: (wantsReenlist: boolean) => void;
}

export function ReenlistPrompt({ questId, userId, onResponse }: ReenlistPromptProps) {
  const [cliqueMembers, setCliqueMembers] = useState<CliqueMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCliqueMembers = async () => {
      // Find the user's clique for this quest
      const { data: userMembership } = await supabase
        .from('squad_members')
        .select('squad_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!userMembership?.squad_id) {
        setIsLoading(false);
        return;
      }

      // Get all clique members with their profile names
      const { data: members } = await supabase
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', userMembership.squad_id);

      if (members && members.length > 0) {
        // Fetch profiles for all members
        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);

        if (profiles) {
          const membersWithNames = profiles
            .filter(p => p.id !== userId) // Exclude current user
            .map(p => ({
              user_id: p.id,
              display_name: p.display_name
            }));
          setCliqueMembers(membersWithNames);
        }
      }
      setIsLoading(false);
    };

    fetchCliqueMembers();
  }, [questId, userId]);

  const handleResponse = async (wantsReenlist: boolean) => {
    setIsSubmitting(true);
    
    // Update the signup with re-enlist intent
    await supabase
      .from('quest_signups')
      .update({
        wants_reenlist: wantsReenlist,
        reenlist_answered_at: new Date().toISOString()
      })
      .eq('quest_id', questId)
      .eq('user_id', userId);
    
    onResponse(wantsReenlist);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (cliqueMembers.length === 0) {
    return null; // Don't show if no clique found
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-primary/10">
            <PartyPopper className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Want to quest with this clique again?
            </h3>
            <p className="text-sm text-muted-foreground">
              Keep the adventure going with your clique!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-5 p-3 rounded-lg bg-background/50">
          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-foreground">
            {cliqueMembers.map((m, i) => (
              <span key={m.user_id}>
                <span className="font-medium">{m.display_name}</span>
                {i < cliqueMembers.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => handleResponse(true)}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              '🎉 Yes, let\'s do it!'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleResponse(false)}
            disabled={isSubmitting}
            className="flex-1"
          >
            Maybe next time
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
