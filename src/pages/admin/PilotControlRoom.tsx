/**
 * Pilot Control Room
 * 
 * Admin dashboard for managing a single quest instance during a pilot run.
 * Provides overview, roster, squad management, run-of-show controls, and proof inbox.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Copy, QrCode, AlertTriangle, Pause, X } from 'lucide-react';

import { InstanceOverviewPanel } from '@/components/admin/pilot/InstanceOverviewPanel';
import { ParticipantRoster } from '@/components/admin/pilot/ParticipantRoster';
import { SquadManager } from '@/components/admin/pilot/SquadManager';
import { RunOfShowControls } from '@/components/admin/pilot/RunOfShowControls';
import { ProofInbox } from '@/components/admin/pilot/ProofInbox';

import type { Tables, Enums } from '@/integrations/supabase/types';

type QuestInstance = Tables<'quest_instances'>;
type InstanceStatus = Enums<'instance_status'>;

export default function PilotControlRoom() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch instance details
  const { data: instance, isLoading: instanceLoading, error } = useQuery({
    queryKey: ['quest-instance', instanceId],
    queryFn: async () => {
      if (!instanceId) throw new Error('No instance ID');
      const { data, error } = await supabase
        .from('quest_instances')
        .select('*')
        .eq('id', instanceId)
        .single();
      if (error) throw error;
      return data as QuestInstance;
    },
    enabled: !!instanceId && !!user && isAdmin,
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: InstanceStatus) => {
      const { error } = await supabase
        .from('quest_instances')
        .update({ status: newStatus })
        .eq('id', instanceId);
      if (error) throw error;
      
      // Log event
      await supabase.rpc('log_quest_event', {
        p_instance_id: instanceId,
        p_event_type: 'status_change',
        p_actor_type: 'admin',
        p_payload: { old_status: instance?.status, new_status: newStatus }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quest-instance', instanceId] });
      toast({ title: 'Status updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to update status', description: err.message, variant: 'destructive' });
    }
  });

  const copyQuestCardUrl = () => {
    if (!instance) return;
    const url = `${window.location.origin}/quest-card/${instance.quest_card_token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Quest Card URL copied!' });
  };

  if (authLoading || instanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required.</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Instance Not Found</h1>
          <p className="text-muted-foreground mb-4">Could not load this quest instance.</p>
          <Button onClick={() => navigate('/admin')}>Back to Admin</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                <span>{instance.icon}</span>
                {instance.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {new Date(instance.scheduled_date).toLocaleDateString('en-US', { 
                  weekday: 'long', month: 'short', day: 'numeric' 
                })} at {instance.start_time?.slice(0, 5)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyQuestCardUrl}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" size="sm">
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
            {instance.status !== 'cancelled' && instance.status !== 'archived' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-amber-600 border-amber-300"
                  onClick={() => statusMutation.mutate('cancelled')}
                  disabled={statusMutation.isPending}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (confirm('Cancel this quest? This cannot be undone.')) {
                      statusMutation.mutate('cancelled');
                    }
                  }}
                  disabled={statusMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Quest
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="squads">Squads</TabsTrigger>
            <TabsTrigger value="run-of-show">Run of Show</TabsTrigger>
            <TabsTrigger value="proofs">Proofs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <InstanceOverviewPanel instance={instance} onStatusChange={statusMutation.mutate} />
          </TabsContent>

          <TabsContent value="roster">
            <ParticipantRoster instanceId={instance.id} />
          </TabsContent>

          <TabsContent value="squads">
            <SquadManager instanceId={instance.id} targetSquadSize={instance.target_squad_size || 6} />
          </TabsContent>

          <TabsContent value="run-of-show">
            <RunOfShowControls instance={instance} />
          </TabsContent>

          <TabsContent value="proofs">
            <ProofInbox instanceId={instance.id} />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}
