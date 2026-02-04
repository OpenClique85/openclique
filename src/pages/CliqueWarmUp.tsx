/**
 * Clique Warm-Up Page
 * 
 * Dedicated page for clique warm-up phase where members:
 * - Chat with their clique
 * - Answer warm-up prompts
 * - Confirm readiness
 * 
 * Accessed via /cliques/:cliqueId/warmup - requires authentication.
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CliqueWarmUpRoom } from '@/components/cliques/CliqueWarmUpRoom';
import { GetHelpButton } from '@/components/support';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, AlertCircle, Lock, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function CliqueWarmUp() {
  const { cliqueId } = useParams<{ cliqueId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Fetch clique data and verify membership
  const { data, isLoading, error } = useQuery({
    queryKey: ['clique-warmup', cliqueId, user?.id],
    queryFn: async () => {
      if (!cliqueId || !user) throw new Error('Not authenticated');

      // Get clique with instance info
      const { data: clique, error: cliqueError } = await supabase
        .from('quest_squads')
        .select(`
          id,
          squad_name,
          status,
          quest_instances(
            id,
            title,
            icon,
            scheduled_date,
            start_time,
            warm_up_prompt_id,
            warm_up_required,
            quest_card_token
          )
        `)
        .eq('id', cliqueId)
        .single();

      if (cliqueError) throw cliqueError;

      // Check if user is a member
      const { data: membership, error: memberError } = await supabase
        .from('squad_members')
        .select('id, role')
        .eq('squad_id', cliqueId)
        .eq('user_id', user.id)
        .neq('status', 'dropped')
        .limit(1)
        .maybeSingle();

      if (memberError || !membership) {
        throw new Error('You are not a member of this clique');
      }

      const instance = clique.quest_instances as any;

      return {
        clique,
        membership,
        instance,
      };
    },
    enabled: !!cliqueId && !!user && !authLoading,
  });

  // Loading states
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground mb-4">
                You need to be signed in to access the clique warm-up room.
              </p>
              <Button onClick={() => navigate('/auth')}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Error or not a member
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                {error?.message || 'Unable to access this clique warm-up room.'}
              </p>
              <Button variant="outline" onClick={() => navigate('/profile?tab=cliques')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Cliques
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const { clique, instance } = data;
  const cliqueStatus = clique.status as string;

  // Clique already approved - redirect to quest card
  if (cliqueStatus === 'approved' || cliqueStatus === 'active' || cliqueStatus === 'completed') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Clique Approved!</h2>
              <p className="text-muted-foreground mb-4">
                Your clique has been approved. You can now view the full quest details.
              </p>
              <Button onClick={() => navigate(`/quest-card/${instance?.quest_card_token}`)}>
                View Quest Details
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Not in warm-up phase
  if (cliqueStatus !== 'warming_up' && cliqueStatus !== 'ready_for_review') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Warm-Up Not Available</h2>
              <p className="text-muted-foreground mb-4">
                This clique is not currently in the warm-up phase.
              </p>
              <Badge variant="outline" className="mb-4">
                Status: {cliqueStatus}
              </Badge>
              <div>
                <Button variant="outline" onClick={() => navigate('/profile?tab=cliques')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to My Cliques
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="flex-1 container max-w-4xl mx-auto py-4 sm:py-6 px-4 pb-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Link 
              to="/profile?tab=cliques" 
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to My Cliques</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <GetHelpButton
              variant="link"
              contextQuestId={instance?.id}
              contextQuestTitle={instance?.title}
              contextSquadId={cliqueId}
              contextSquadName={clique.squad_name}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">{instance?.icon}</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{instance?.title}</h1>
              <p className="text-sm text-muted-foreground">
                Clique: {clique.squad_name}
              </p>
            </div>
          </div>
        </div>

        {/* Warm-Up Room */}
        <CliqueWarmUpRoom cliqueId={cliqueId!} />
      </main>

      <Footer />
    </div>
  );
}
