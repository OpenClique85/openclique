import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, Bot, Users, MessageSquare, CheckCircle2, Award, 
  Play, XCircle, ExternalLink, Trash2, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SimulationMember {
  userId: string;
  name: string;
  isBot: boolean;
}

interface SimulationData {
  squadId: string;
  squadName: string;
  instanceId: string;
  questId: string;
  members: SimulationMember[];
}

export function SoloSquadSimulator() {
  const [botCount, setBotCount] = useState<string>('2');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<SimulationData | null>(null);

  const getAuthHeaders = async (): Promise<Record<string, string> | null> => {
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Failed to get session:', error);
      return null;
    }
    const token = sessionData.session?.access_token;
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const createSimulation = async () => {
    setIsCreating(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        toast.error('Please sign in to use Solo Simulator');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-solo-simulation', {
        body: { botCount: parseInt(botCount) },
        headers,
      });

      if (error) {
        console.error('Create simulation error:', error);
        toast.error('Failed to create simulation', { description: error.message });
        return;
      }

      if (data?.success) {
        setSimulation(data);
        toast.success('Solo simulation created!', {
          description: `Squad "${data.squadName}" with ${data.members.length} members`,
        });
      } else {
        toast.error('Failed to create simulation', { description: data?.error });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to create simulation');
    } finally {
      setIsCreating(false);
    }
  };

  const triggerBotReply = async () => {
    if (!simulation) return;
    
    setIsLoading('reply');
    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        toast.error('Please sign in to use Solo Simulator');
        return;
      }

      const { data, error } = await supabase.functions.invoke('simulate-bot-reply', {
        body: { 
          squadId: simulation.squadId,
          triggerMessage: 'Hey everyone!',
        },
        headers,
      });

      if (error) {
        toast.error('Failed to trigger bot reply', { description: error.message });
        return;
      }

      if (data?.success && data.replies?.length > 0) {
        const reply = data.replies[0];
        toast.success(`${reply.botName} replied`, { description: reply.message });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to trigger bot reply');
    } finally {
      setIsLoading(null);
    }
  };

  const checkInAll = async () => {
    if (!simulation) return;
    
    setIsLoading('checkin');
    try {
      // Update all signups to completed status (checked_in is not a valid status)
      const { error } = await supabase
        .from('quest_signups')
        .update({ 
          status: 'completed' as const,
        })
        .eq('instance_id', simulation.instanceId);

      if (error) {
        toast.error('Failed to check in members', { description: error.message });
        return;
      }

      toast.success('All members checked in!');
      
      // Trigger a bot message about checking in
      const headers = await getAuthHeaders();
      if (!headers) return;
      await supabase.functions.invoke('simulate-bot-reply', {
        body: { 
          squadId: simulation.squadId,
          triggerMessage: 'Just checked in!',
        },
        headers,
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to check in members');
    } finally {
      setIsLoading(null);
    }
  };

  const awardXP = async () => {
    if (!simulation) return;
    
    setIsLoading('xp');
    try {
      // Award XP to all members
      const xpAmount = 50;
      
      for (const member of simulation.members) {
        await supabase
          .from('xp_transactions')
          .insert({
            user_id: member.userId,
            amount: xpAmount,
            source: 'quest_completion',
            source_id: simulation.questId,
            description: 'Solo simulation quest completion',
          });
      }

      toast.success(`Awarded ${xpAmount} XP to all members!`);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to award XP');
    } finally {
      setIsLoading(null);
    }
  };

  const completeQuest = async () => {
    if (!simulation) return;
    
    setIsLoading('complete');
    try {
      // Update squad status
      const { error: squadError } = await supabase
        .from('quest_squads')
        .update({ status: 'completed' })
        .eq('id', simulation.squadId);

      if (squadError) {
        toast.error('Failed to complete quest', { description: squadError.message });
        return;
      }

      // Update instance status
      await supabase
        .from('quest_instances')
        .update({ status: 'completed' })
        .eq('id', simulation.instanceId);

      // Update signups
      await supabase
        .from('quest_signups')
        .update({ status: 'completed' })
        .eq('instance_id', simulation.instanceId);

      toast.success('Quest completed!');
      
      // Trigger farewell messages
      const headers = await getAuthHeaders();
      if (!headers) return;
      await supabase.functions.invoke('simulate-bot-reply', {
        body: { 
          squadId: simulation.squadId,
          triggerMessage: 'That was great!',
        },
        headers,
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to complete quest');
    } finally {
      setIsLoading(null);
    }
  };

  const endSimulation = async () => {
    if (!simulation) return;
    
    setIsLoading('end');
    try {
      // Archive the squad
      await supabase
        .from('quest_squads')
        .update({ status: 'archived' })
        .eq('id', simulation.squadId);

      setSimulation(null);
      toast.success('Simulation ended and archived');
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to end simulation');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Card className="border-dashed border-purple-500/50 bg-purple-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-500" />
          <CardTitle className="text-lg">Solo Squad Simulator</CardTitle>
        </div>
        <CardDescription>
          Test the complete squad experience solo with AI bot personas. Chat, check-in, and 
          complete quests without logging into multiple accounts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!simulation ? (
          <>
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Bot Count</label>
                <Select value={botCount} onValueChange={setBotCount}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Bot</SelectItem>
                    <SelectItem value="2">2 Bots</SelectItem>
                    <SelectItem value="3">3 Bots</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-background">
                🌙 Luna Martinez
              </Badge>
              <Badge variant="outline" className="bg-background">
                ⛰️ Max Chen
              </Badge>
              <Badge variant="outline" className="bg-background">
                📚 Riley Kim
              </Badge>
            </div>

            <Button
              onClick={createSimulation}
              disabled={isCreating}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Create Solo Simulation
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            {/* Active Simulation Info */}
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-purple-700 dark:text-purple-300">
                    {simulation.squadName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Active simulation • {simulation.members.length} members
                  </p>
                </div>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  🟢 Active
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {simulation.members.map((member) => (
                  <Badge 
                    key={member.userId} 
                    variant="outline"
                    className={member.isBot ? 'bg-purple-500/10' : 'bg-primary/10'}
                  >
                    {member.isBot ? '🤖' : '👤'} {member.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/squad/${simulation.squadId}`} target="_blank">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Open Squad Chat
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/admin`} onClick={() => {}}>
                  <Users className="h-4 w-4 mr-2" />
                  View in Pilot
                </Link>
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Quick Actions</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerBotReply}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'reply' ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-1" />
                  )}
                  Bot Reply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkInAll}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'checkin' ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  Check-in All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={awardXP}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'xp' ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Award className="h-4 w-4 mr-1" />
                  )}
                  Award XP
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={completeQuest}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'complete' ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Complete
                </Button>
              </div>
            </div>

            {/* End Simulation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  disabled={isLoading !== null}
                >
                  {isLoading === 'end' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  End Simulation
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End simulation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will archive the simulation squad. You can create a new simulation afterward.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={endSimulation} className="bg-destructive text-destructive-foreground">
                    End Simulation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
