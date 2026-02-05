/**
 * Proof Gallery Panel
 * 
 * Grid display of submitted proof photos for admin review.
 * Photos default to approved; admin can reject if needed.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Image as ImageIcon, 
  Check, 
  X, 
  Loader2, 
  Filter,
  ZoomIn 
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProofGalleryPanelProps {
  instanceId: string;
  cliques: Array<{ id: string; squad_name: string }>;
}

interface ProofSubmission {
  id: string;
  squad_id: string;
  sender_id: string;
  media_url: string;
  proof_status: string;
  created_at: string;
  sender_name?: string;
  clique_name?: string;
}

export function ProofGalleryPanel({ instanceId, cliques }: ProofGalleryPanelProps) {
  const queryClient = useQueryClient();
  const [filterClique, setFilterClique] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<ProofSubmission | null>(null);

  // Fetch proof submissions
  const { data: proofs = [], isLoading } = useQuery({
    queryKey: ['proof-submissions', instanceId, filterClique],
    queryFn: async () => {
      const squadIds = filterClique === 'all' 
        ? cliques.map(c => c.id) 
        : [filterClique];

      if (squadIds.length === 0) return [];

      const { data, error } = await supabase
        .from('squad_chat_messages')
        .select('id, squad_id, sender_id, media_url, proof_status, created_at')
        .in('squad_id', squadIds)
        .eq('is_proof_submission', true)
        .not('media_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with sender names and clique names
      const senderIds = [...new Set((data || []).map(d => d.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);
      const cliqueMap = new Map(cliques.map(c => [c.id, c.squad_name]));

      return (data || []).map((d) => ({
        ...d,
        sender_name: profileMap.get(d.sender_id) || 'Unknown',
        clique_name: cliqueMap.get(d.squad_id) || 'Unknown Clique',
      })) as ProofSubmission[];
    },
    enabled: cliques.length > 0,
    refetchInterval: 30000,
  });

  // Update proof status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('squad_chat_messages')
        .update({ proof_status: status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proof-submissions', instanceId] });
      toast.success('Status updated');
    },
    onError: (err: any) => {
      toast.error('Failed to update status', { description: err.message });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (cliques.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Photo Proofs ({proofs.length})
              </CardTitle>
              <CardDescription>
                Review submitted quest proof photos
              </CardDescription>
            </div>
            
            <Select value={filterClique} onValueChange={setFilterClique}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by clique" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cliques</SelectItem>
                {cliques.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.squad_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : proofs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No proof photos submitted yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {proofs.map((proof) => (
                <div
                  key={proof.id}
                  className="relative group rounded-lg overflow-hidden border bg-muted/20"
                >
                  <img
                    src={proof.media_url}
                    alt="Quest proof"
                    className="w-full aspect-square object-cover cursor-pointer transition-transform group-hover:scale-105"
                    onClick={() => setSelectedImage(proof)}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-xs font-medium truncate">
                        {proof.sender_name}
                      </p>
                      <p className="text-white/70 text-[10px]">
                        {proof.clique_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(proof.proof_status)}
                  </div>

                  <button
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/90 rounded-full"
                    onClick={() => setSelectedImage(proof)}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full-size Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Quest Proof</span>
              {selectedImage && getStatusBadge(selectedImage.proof_status)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedImage && (
            <div className="space-y-4">
              <img
                src={selectedImage.media_url}
                alt="Quest proof"
                className="w-full max-h-[60vh] object-contain rounded-lg"
              />
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium">{selectedImage.sender_name}</p>
                  <p className="text-muted-foreground text-xs">
                    {selectedImage.clique_name} · {format(new Date(selectedImage.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={selectedImage.proof_status === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: selectedImage.id, status: 'approved' })}
                    disabled={updateStatusMutation.isPending}
                    className="gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant={selectedImage.proof_status === 'rejected' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: selectedImage.id, status: 'rejected' })}
                    disabled={updateStatusMutation.isPending}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
