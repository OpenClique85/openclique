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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Copy, QrCode, Pause, Play, X, Archive } from 'lucide-react';

import { InstanceOverviewPanel } from '@/components/admin/pilot/InstanceOverviewPanel';
import { InstanceNotificationPanel } from '@/components/admin/pilot/InstanceNotificationPanel';
import { ParticipantRoster } from '@/components/admin/pilot/ParticipantRoster';
import { SquadManager } from '@/components/admin/pilot/SquadManager';
import { SquadWarmUpTab } from '@/components/admin/pilot/SquadWarmUpTab';
import { RunOfShowControls } from '@/components/admin/pilot/RunOfShowControls';
import { ProofInbox } from '@/components/admin/pilot/ProofInbox';
import { 
  transitionInstanceStatus, 
  pauseInstance, 
  resumeInstance, 
  cancelInstance,
  archiveInstance,
  canTransition,
  STATUS_DISPLAY,
  type InstanceStatus 
} from '@/lib/instanceLifecycle';

import type { Tables } from '@/integrations/supabase/types';

type QuestInstance = Tables<'quest_instances'>;

export default function PilotControlRoom() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelConfirmation, setCancelConfirmation] = useState('');

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
      const result = await transitionInstanceStatus(instanceId!, newStatus);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quest-instance', instanceId] });
      toast({ title: 'Status updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to update status', description: err.message, variant: 'destructive' });
    }
  });

  // Pause mutation
  const handlePause = async () => {
    if (!pauseReason.trim()) {
      toast({ title: 'Please provide a reason for pausing', variant: 'destructive' });
      return;
    }
    
    const result = await pauseInstance(instanceId!, pauseReason);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['quest-instance', instanceId] });
      toast({ title: 'Instance paused', description: 'Users have been notified.' });
      setIsPauseModalOpen(false);
      setPauseReason('');
    } else {
      toast({ title: 'Failed to pause', description: result.error, variant: 'destructive' });
    }
  };

  // Resume mutation
  const handleResume = async () => {
    const result = await resumeInstance(instanceId!);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['quest-instance', instanceId] });
      toast({ title: 'Instance resumed' });
    } else {
      toast({ title: 'Failed to resume', description: result.error, variant: 'destructive' });
    }
  };

  // Cancel mutation
  const handleCancel = async () => {
    if (cancelConfirmation !== 'CANCEL') {
      toast({ title: 'Please type CANCEL to confirm', variant: 'destructive' });
      return;
    }
    
    const result = await cancelInstance(instanceId!, cancelReason);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['quest-instance', instanceId] });
      toast({ title: 'Instance cancelled', description: 'Users have been notified.' });
      setIsCancelModalOpen(false);
      setCancelReason('');
      setCancelConfirmation('');
    } else {
      toast({ title: 'Failed to cancel', description: result.error, variant: 'destructive' });
    }
  };

  // Archive mutation
  const handleArchive = async () => {
    const result = await archiveInstance(instanceId!);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['quest-instance', instanceId] });
      toast({ title: 'Instance archived' });
      navigate('/admin');
    } else {
      toast({ title: 'Failed to archive', description: result.error, variant: 'destructive' });
    }
  };

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

  const currentStatus = instance.status as InstanceStatus;
  const statusDisplay = STATUS_DISPLAY[currentStatus];
  const isPaused = currentStatus === 'paused';
  const canPause = canTransition(currentStatus, 'paused');
  const canCancel = canTransition(currentStatus, 'cancelled');
  const canArchive = canTransition(currentStatus, 'archived');

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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                  <span>{instance.icon}</span>
                  {instance.title}
                </h1>
                <Badge className={statusDisplay.color}>
                  {statusDisplay.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(instance.scheduled_date).toLocaleDateString('en-US', { 
                  weekday: 'long', month: 'short', day: 'numeric' 
                })} at {instance.start_time?.slice(0, 5)}
                {instance.paused_reason && (
                  <span className="ml-2 text-orange-600">• Paused: {instance.paused_reason}</span>
                )}
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
            
            {/* Status Actions */}
            {isPaused && (
              <Button 
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleResume}
                disabled={statusMutation.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            
            {canPause && !isPaused && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                onClick={() => setIsPauseModalOpen(true)}
                disabled={statusMutation.isPending}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            
            {canCancel && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                disabled={statusMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Quest
              </Button>
            )}
            
            {canArchive && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleArchive}
                disabled={statusMutation.isPending}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            )}
          </div>
        </div>

        {/* Notification Panel */}
        <InstanceNotificationPanel 
          instance={instance}
          onFormSquads={() => setActiveTab('squads')}
          onOpenSquadTab={() => setActiveTab('squads')}
        />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="squads">Squads</TabsTrigger>
            <TabsTrigger value="warm-up">Warm-Up</TabsTrigger>
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
            <SquadManager 
              instanceId={instance.id} 
              instanceTitle={instance.title}
              targetSquadSize={instance.target_squad_size || 6} 
            />
          </TabsContent>

          <TabsContent value="warm-up">
            <SquadWarmUpTab instanceId={instance.id} />
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

      {/* Pause Modal */}
      <Dialog open={isPauseModalOpen} onOpenChange={setIsPauseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-orange-500" />
              Pause Quest Instance
            </DialogTitle>
            <DialogDescription>
              Pausing will temporarily halt progression and notify all signed-up users.
              You can resume at any time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pause-reason">Reason for pausing (required)</Label>
              <Textarea
                id="pause-reason"
                placeholder="e.g., Weather conditions, venue issue, need more signups..."
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPauseModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handlePause}
              disabled={!pauseReason.trim()}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause Instance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <X className="h-5 w-5" />
              Cancel Quest Instance
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All signed-up users will be notified
              that the quest has been cancelled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
              <Textarea
                id="cancel-reason"
                placeholder="e.g., Not enough signups, venue unavailable..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancel-confirm">
                Type <span className="font-mono font-bold">CANCEL</span> to confirm
              </Label>
              <input
                id="cancel-confirm"
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="CANCEL"
                value={cancelConfirmation}
                onChange={(e) => setCancelConfirmation(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              Go Back
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelConfirmation !== 'CANCEL'}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Quest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
