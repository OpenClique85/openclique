import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SquadCard } from './SquadCard';

interface SquadMember {
  user_id: string;
  signup_id: string;
  display_name: string;
  austin_area?: string;
  referral_cluster?: number;
}

interface SquadSuggestion {
  suggested_name: string;
  members: SquadMember[];
  compatibility_score: number;
  referral_bonds: number;
}

interface UnassignedUser {
  user_id: string;
  signup_id: string;
  display_name: string;
}

interface SquadRecommendationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questId: string;
  questTitle: string;
  onSquadsConfirmed: () => void;
}

export function SquadRecommendationModal({
  open,
  onOpenChange,
  questId,
  questTitle,
  onSquadsConfirmed,
}: SquadRecommendationModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [squads, setSquads] = useState<SquadSuggestion[]>([]);
  const [unassigned, setUnassigned] = useState<UnassignedUser[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [confirmingSquad, setConfirmingSquad] = useState<number | null>(null);
  const [confirmedSquads, setConfirmedSquads] = useState<Set<number>>(new Set());

  const generateSquads = async () => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await supabase.functions.invoke('recommend-squads', {
        body: { quest_id: questId, squad_size: 6 },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (response.error) throw response.error;

      const data = response.data;
      setSquads(data.squads || []);
      setUnassigned(data.unassigned_users || []);
      setTotalPending(data.total_pending || 0);
      setHasGenerated(true);

      if (data.squads?.length === 0) {
        toast({
          title: 'No squads generated',
          description: 'Not enough pending signups to form squads.',
        });
      }
    } catch (error: any) {
      console.error('Failed to generate squads:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to generate squads',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSquad = async (squad: SquadSuggestion, whatsappLink: string, squadIndex: number) => {
    setConfirmingSquad(squadIndex);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      // 1. Create quest_squad record
      const { data: squadData, error: squadError } = await supabase
        .from('quest_squads')
        .insert({
          quest_id: questId,
          squad_name: squad.suggested_name,
          status: 'confirmed',
          whatsapp_link: whatsappLink || null,
          compatibility_score: squad.compatibility_score,
          confirmed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (squadError) throw squadError;

      // 2. Create squad_members records
      const memberInserts = squad.members.map(m => ({
        squad_id: squadData.id,
        user_id: m.user_id,
        signup_id: m.signup_id,
      }));

      const { error: membersError } = await supabase
        .from('squad_members')
        .insert(memberInserts);

      if (membersError) throw membersError;

      // 3. Update signups to confirmed status
      const signupIds = squad.members.map(m => m.signup_id);
      const { error: updateError } = await supabase
        .from('quest_signups')
        .update({ status: 'confirmed' })
        .in('id', signupIds);

      if (updateError) throw updateError;

      // 4. Send notifications via edge function
      const userIds = squad.members.map(m => m.user_id);
      await supabase.functions.invoke('notify-users', {
        body: {
          type: 'signup_confirmed',
          quest_id: questId,
          user_ids: userIds,
          custom_message: whatsappLink 
            ? `You've been confirmed! Join your squad's WhatsApp group.`
            : `You've been confirmed for ${questTitle}!`,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      setConfirmedSquads(prev => new Set([...prev, squadIndex]));
      
      toast({
        title: 'Squad confirmed!',
        description: `${squad.members.length} members notified.`,
      });

    } catch (error: any) {
      console.error('Failed to confirm squad:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to confirm squad',
        description: error.message,
      });
    } finally {
      setConfirmingSquad(null);
    }
  };

  const confirmAllSquads = async () => {
    for (let i = 0; i < squads.length; i++) {
      if (!confirmedSquads.has(i)) {
        await confirmSquad(squads[i], '', i);
      }
    }
    onSquadsConfirmed();
  };

  const handleClose = () => {
    if (confirmedSquads.size > 0) {
      onSquadsConfirmed();
    }
    onOpenChange(false);
    // Reset state when closing
    setHasGenerated(false);
    setSquads([]);
    setUnassigned([]);
    setConfirmedSquads(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Squad Recommendations
          </DialogTitle>
          <DialogDescription>
            Auto-generate optimal squads for "{questTitle}" based on compatibility and referral bonds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!hasGenerated ? (
            <div className="text-center py-8">
              <Button onClick={generateSquads} disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing signups...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Generate Squad Recommendations
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                This will analyze pending signups and suggest optimal groupings.
              </p>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalPending}</div>
                  <div className="text-xs text-muted-foreground">Total Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{squads.length}</div>
                  <div className="text-xs text-muted-foreground">Squads Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{unassigned.length}</div>
                  <div className="text-xs text-muted-foreground">Unassigned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{confirmedSquads.size}</div>
                  <div className="text-xs text-muted-foreground">Confirmed</div>
                </div>
              </div>

              {/* Squad cards */}
              {squads.length > 0 ? (
                <div className="space-y-4">
                  {squads.map((squad, idx) => (
                    <div key={idx} className="relative">
                      {confirmedSquads.has(idx) && (
                        <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center rounded-lg">
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="h-6 w-6" />
                            <span className="font-medium">Confirmed & Notified</span>
                          </div>
                        </div>
                      )}
                      <SquadCard
                        squad={squad}
                        squadIndex={idx}
                        onConfirm={(s, link) => confirmSquad(s, link, idx)}
                        isConfirming={confirmingSquad === idx}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Not enough pending signups to form squads.</p>
                  <p className="text-sm">Need at least 3 people per squad.</p>
                </div>
              )}

              {/* Unassigned users */}
              {unassigned.length > 0 && (
                <div className="p-4 rounded-lg border border-dashed">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Unassigned Users ({unassigned.length})
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    These users couldn't be placed in a full squad. Consider waiting for more signups or adding them manually.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unassigned.map(user => (
                      <Badge key={user.user_id} variant="secondary">
                        {user.display_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirm all button */}
              {squads.length > 0 && confirmedSquads.size < squads.length && (
                <Button 
                  onClick={confirmAllSquads} 
                  className="w-full"
                  variant="outline"
                >
                  Confirm All Remaining Squads
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
