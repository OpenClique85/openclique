/**
 * Proof Inbox
 * 
 * Review and approve participant proof submissions.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { 
  CheckCircle, XCircle, AlertTriangle, RotateCcw, 
  Image, Video, FileText, Loader2, Inbox
} from 'lucide-react';
import type { Tables, Enums } from '@/integrations/supabase/types';

type ProofStatus = Enums<'proof_status'>;

interface ProofWithUser {
  id: string;
  user_id: string;
  proof_type: string;
  file_url: string | null;
  text_content: string | null;
  status: ProofStatus;
  admin_notes: string | null;
  created_at: string;
  profiles: {
    display_name: string | null;
  } | null;
}

const STATUS_CONFIG: Record<ProofStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-amber-500/20 text-amber-700', icon: Inbox },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-700', icon: CheckCircle },
  flagged: { label: 'Flagged', color: 'bg-destructive/20 text-destructive', icon: XCircle },
  resubmit_requested: { label: 'Resubmit', color: 'bg-purple-500/20 text-purple-700', icon: RotateCcw },
};

interface ProofInboxProps {
  instanceId: string;
}

export function ProofInbox({ instanceId }: ProofInboxProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedProof, setSelectedProof] = useState<ProofWithUser | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch proofs
  const { data: proofs, isLoading } = useQuery({
    queryKey: ['instance-proofs', instanceId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('participant_proofs')
        .select(`
          id, user_id, proof_type, file_url, text_content, 
          status, admin_notes, created_at,
          profiles!inner(display_name)
        `)
        .eq('instance_id', instanceId)
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as ProofStatus);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ProofWithUser[];
    },
  });

  // Update proof status
  const updateProofMutation = useMutation({
    mutationFn: async ({ proofId, newStatus, notes }: { 
      proofId: string; 
      newStatus: ProofStatus; 
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('participant_proofs')
        .update({ 
          status: newStatus,
          admin_notes: notes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', proofId);
      
      if (error) throw error;

      // If approved, mark participant as completed and award XP
      if (newStatus === 'approved') {
        const proof = proofs?.find(p => p.id === proofId);
        if (proof) {
          // Update signup status
          const { error: signupError } = await supabase
            .from('quest_signups')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('instance_id', instanceId)
            .eq('user_id', proof.user_id);
          
          if (signupError) console.error('Failed to update signup:', signupError);

          // Award XP (using the existing RPC)
          const { data: questData } = await supabase
            .from('quest_instances')
            .select('id')
            .eq('id', instanceId)
            .single();
          
          if (questData) {
            // Note: We'd need to adapt award_quest_xp for instances
            // For now, log the completion event
            await supabase.rpc('log_quest_event', {
              p_instance_id: instanceId,
              p_event_type: 'completion',
              p_actor_type: 'admin',
              p_target_user_id: proof.user_id,
              p_payload: { proof_id: proofId }
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instance-proofs', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['instance-signups', instanceId] });
      setSelectedProof(null);
      setAdminNotes('');
      toast({ title: 'Proof updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to update', description: err.message, variant: 'destructive' });
    },
  });

  // Bulk approve pending
  const bulkApproveMutation = useMutation({
    mutationFn: async () => {
      const pendingProofs = proofs?.filter(p => p.status === 'pending') || [];
      for (const proof of pendingProofs) {
        await updateProofMutation.mutateAsync({ 
          proofId: proof.id, 
          newStatus: 'approved' 
        });
      }
    },
    onSuccess: () => {
      toast({ title: 'All pending proofs approved!' });
    },
  });

  const getProofIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const pendingCount = proofs?.filter(p => p.status === 'pending').length || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Proofs</SelectItem>
                  <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="resubmit_requested">Resubmit Requested</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {proofs?.length || 0} proofs
              </span>
            </div>
            
            {pendingCount > 0 && (
              <Button 
                onClick={() => bulkApproveMutation.mutate()}
                disabled={bulkApproveMutation.isPending}
              >
                {bulkApproveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve All Pending ({pendingCount})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Proof Grid */}
      {proofs && proofs.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {proofs.map((proof) => {
            const config = STATUS_CONFIG[proof.status];
            const StatusIcon = config.icon;
            
            return (
              <Card 
                key={proof.id} 
                className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                onClick={() => {
                  setSelectedProof(proof);
                  setAdminNotes(proof.admin_notes || '');
                }}
              >
                {/* Proof Media */}
                <div className="aspect-square bg-muted relative">
                  {proof.proof_type === 'photo' && proof.file_url ? (
                    <img 
                      src={proof.file_url} 
                      alt="Proof" 
                      className="w-full h-full object-cover"
                    />
                  ) : proof.proof_type === 'video' && proof.file_url ? (
                    <video 
                      src={proof.file_url} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground p-4">
                      <p className="text-sm line-clamp-6">{proof.text_content}</p>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <Badge className={`absolute top-2 right-2 ${config.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>

                {/* Info */}
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getProofIcon(proof.proof_type)}
                      <span className="text-sm font-medium">
                        {proof.profiles?.display_name || 'Unknown'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(proof.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Proofs Yet</h3>
            <p className="text-sm text-muted-foreground">
              Participant proof submissions will appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Proof Detail Dialog */}
      <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Proof</DialogTitle>
          </DialogHeader>
          
          {selectedProof && (
            <div className="space-y-4">
              {/* Media Preview */}
              <div className="bg-muted rounded-lg overflow-hidden">
                {selectedProof.proof_type === 'photo' && selectedProof.file_url ? (
                  <img 
                    src={selectedProof.file_url} 
                    alt="Proof" 
                    className="w-full max-h-96 object-contain"
                  />
                ) : selectedProof.proof_type === 'video' && selectedProof.file_url ? (
                  <video 
                    src={selectedProof.file_url} 
                    controls
                    className="w-full max-h-96"
                  />
                ) : (
                  <div className="p-6">
                    <p className="whitespace-pre-wrap">{selectedProof.text_content}</p>
                  </div>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{selectedProof.profiles?.display_name}</span>
                  <span className="text-muted-foreground"> • {selectedProof.proof_type}</span>
                </div>
                <span className="text-muted-foreground">
                  Submitted {new Date(selectedProof.created_at).toLocaleString()}
                </span>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes (optional)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this submission..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => updateProofMutation.mutate({ 
                proofId: selectedProof!.id, 
                newStatus: 'resubmit_requested',
                notes: adminNotes
              })}
              disabled={updateProofMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Request Resubmit
            </Button>
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => updateProofMutation.mutate({ 
                proofId: selectedProof!.id, 
                newStatus: 'flagged',
                notes: adminNotes
              })}
              disabled={updateProofMutation.isPending}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Flag
            </Button>
            <Button
              onClick={() => updateProofMutation.mutate({ 
                proofId: selectedProof!.id, 
                newStatus: 'approved',
                notes: adminNotes
              })}
              disabled={updateProofMutation.isPending}
            >
              {updateProofMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
