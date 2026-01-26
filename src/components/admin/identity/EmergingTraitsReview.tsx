/**
 * =============================================================================
 * EMERGING TRAITS REVIEW - Admin review panel for AI-detected trait proposals
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Check, X, Sparkles, Users, TrendingUp, AlertCircle, Eye, Merge } from 'lucide-react';
import { toast } from 'sonner';
import { auditLog } from '@/lib/auditLog';

interface EmergingProposal {
  id: string;
  proposed_slug: string;
  proposed_category: string;
  proposed_display_name: string;
  proposed_description: string | null;
  proposed_emoji: string | null;
  detection_source: string;
  trigger_criteria: string[] | null;
  evidence_samples: any[];
  frequency_count: number;
  ai_confidence_gaps: any[];
  potential_user_count: number;
  similar_existing_traits: string[] | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  merged_into_trait_slug: string | null;
  created_trait_id: string | null;
  retroactive_drafts_created: number | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'social_energy', label: 'Social Energy' },
  { value: 'planning_style', label: 'Planning Style' },
  { value: 'conversation_style', label: 'Conversation Style' },
  { value: 'pace_intensity', label: 'Pace & Intensity' },
  { value: 'adventure_preference', label: 'Adventure Preference' },
  { value: 'risk_novelty', label: 'Risk & Novelty' },
  { value: 'group_role', label: 'Group Roles' },
];

const SOURCE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  ai_pattern: { label: 'AI Pattern', icon: <Sparkles className="h-3 w-3" /> },
  user_request: { label: 'User Request', icon: <Users className="h-3 w-3" /> },
  admin_suggestion: { label: 'Admin', icon: <Eye className="h-3 w-3" /> },
  feedback_analysis: { label: 'Feedback', icon: <TrendingUp className="h-3 w-3" /> },
};

export function EmergingTraitsReview() {
  const queryClient = useQueryClient();
  const [selectedProposal, setSelectedProposal] = useState<EmergingProposal | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [mergeIntoSlug, setMergeIntoSlug] = useState('');
  const [editedProposal, setEditedProposal] = useState<Partial<EmergingProposal>>({});

  // Fetch all proposals
  const { data: proposals, isLoading } = useQuery({
    queryKey: ['emerging-trait-proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emerging_trait_proposals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmergingProposal[];
    },
  });

  // Fetch existing traits for merge dropdown
  const { data: existingTraits } = useQuery({
    queryKey: ['trait-library-slugs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trait_library')
        .select('slug, display_name')
        .eq('is_active', true)
        .order('display_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Approve mutation - creates trait and generates retroactive drafts
  const approveMutation = useMutation({
    mutationFn: async (proposal: EmergingProposal) => {
      // 1. Create the trait in library
      const { data: newTrait, error: createError } = await supabase
        .from('trait_library')
        .insert({
          slug: editedProposal.proposed_slug || proposal.proposed_slug,
          category: editedProposal.proposed_category || proposal.proposed_category,
          display_name: editedProposal.proposed_display_name || proposal.proposed_display_name,
          description: editedProposal.proposed_description ?? proposal.proposed_description,
          emoji: editedProposal.proposed_emoji ?? proposal.proposed_emoji,
          is_active: true,
          is_negative: false,
        })
        .select('id')
        .single();

      if (createError) throw createError;

      // 2. Update proposal status
      const { error: updateError } = await supabase
        .from('emerging_trait_proposals')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
          created_trait_id: newTrait.id,
          retroactive_drafts_created: 0, // Will be updated by edge function
        })
        .eq('id', proposal.id);

      if (updateError) throw updateError;

      // 3. Audit log
      await auditLog({
        action: 'emerging_trait_approved',
        targetTable: 'emerging_trait_proposals',
        targetId: proposal.id,
        newValues: {
          proposed_slug: proposal.proposed_slug,
          created_trait_id: newTrait.id,
          review_notes: reviewNotes,
        },
      });

      // Trigger retroactive draft generation
      supabase.functions.invoke('generate-retroactive-drafts', {
        body: {
          trait_slug: proposal.proposed_slug,
          trigger_criteria: proposal.trigger_criteria || [],
        },
      }).then(({ data, error }) => {
        if (error) {
          console.error('[emerging-traits] Retroactive generation failed:', error);
        } else {
          console.log(`[emerging-traits] Generated ${data?.drafts_created || 0} retroactive drafts for ${proposal.proposed_slug}`);
        }
      });

      return newTrait;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emerging-trait-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['trait-library'] });
      toast.success('Trait approved and added to library!');
      setSelectedProposal(null);
      setReviewNotes('');
      setEditedProposal({});
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve trait: ${error.message}`);
    },
  });

  // Decline mutation
  const declineMutation = useMutation({
    mutationFn: async ({ proposal, mergeSlug }: { proposal: EmergingProposal; mergeSlug?: string }) => {
      const { error } = await supabase
        .from('emerging_trait_proposals')
        .update({
          status: mergeSlug ? 'merged' : 'declined',
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
          merged_into_trait_slug: mergeSlug || null,
        })
        .eq('id', proposal.id);

      if (error) throw error;

      await auditLog({
        action: mergeSlug ? 'emerging_trait_merged' : 'emerging_trait_declined',
        targetTable: 'emerging_trait_proposals',
        targetId: proposal.id,
        newValues: {
          proposed_slug: proposal.proposed_slug,
          merged_into: mergeSlug,
          review_notes: reviewNotes,
        },
      });
    },
    onSuccess: (_, { mergeSlug }) => {
      queryClient.invalidateQueries({ queryKey: ['emerging-trait-proposals'] });
      toast.success(mergeSlug ? 'Proposal merged into existing trait' : 'Proposal declined');
      setSelectedProposal(null);
      setReviewNotes('');
      setMergeIntoSlug('');
    },
    onError: (error: Error) => {
      toast.error(`Failed to decline: ${error.message}`);
    },
  });

  const pendingProposals = proposals?.filter(p => p.status === 'pending') || [];
  const reviewedProposals = proposals?.filter(p => p.status !== 'pending') || [];

  const getCategoryLabel = (value: string) => 
    CATEGORIES.find(c => c.value === value)?.label || value;

  const openReview = (proposal: EmergingProposal) => {
    setSelectedProposal(proposal);
    setEditedProposal({});
    setReviewNotes('');
    setMergeIntoSlug('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Emerging Traits</h2>
        <p className="text-muted-foreground">
          Review AI-detected or user-requested trait proposals
        </p>
      </div>

      {/* Pending Count Badge */}
      {pendingProposals.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary" />
            <span className="font-medium">{pendingProposals.length} proposals awaiting review</span>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingProposals.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({reviewedProposals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingProposals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending proposals. The AI will suggest new traits as patterns emerge.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingProposals.map(proposal => (
                <ProposalCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  onReview={() => openReview(proposal)} 
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="mt-4">
          {reviewedProposals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No reviewed proposals yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviewedProposals.map(proposal => (
                <ProposalCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  onReview={() => openReview(proposal)}
                  isReviewed 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!selectedProposal} onOpenChange={(open) => !open && setSelectedProposal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Trait Proposal</DialogTitle>
          </DialogHeader>
          
          {selectedProposal && (
            <div className="space-y-6">
              {/* Editable Trait Preview */}
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-start gap-3">
                  <Input
                    className="w-16 text-2xl text-center"
                    value={editedProposal.proposed_emoji ?? selectedProposal.proposed_emoji ?? ''}
                    onChange={(e) => setEditedProposal(prev => ({ ...prev, proposed_emoji: e.target.value }))}
                    placeholder="🌟"
                  />
                  <div className="flex-1 space-y-2">
                    <Input
                      value={editedProposal.proposed_display_name ?? selectedProposal.proposed_display_name}
                      onChange={(e) => setEditedProposal(prev => ({ ...prev, proposed_display_name: e.target.value }))}
                      className="font-medium"
                    />
                    <Textarea
                      value={editedProposal.proposed_description ?? selectedProposal.proposed_description ?? ''}
                      onChange={(e) => setEditedProposal(prev => ({ ...prev, proposed_description: e.target.value }))}
                      placeholder="Description..."
                      rows={2}
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-4">
                  <div className="flex-1">
                    <Label className="text-xs">Slug</Label>
                    <Input
                      value={editedProposal.proposed_slug ?? selectedProposal.proposed_slug}
                      onChange={(e) => setEditedProposal(prev => ({ ...prev, proposed_slug: e.target.value }))}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Category</Label>
                    <Select 
                      value={editedProposal.proposed_category ?? selectedProposal.proposed_category}
                      onValueChange={(v) => setEditedProposal(prev => ({ ...prev, proposed_category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Detection Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Detection Source</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {SOURCE_LABELS[selectedProposal.detection_source]?.icon}
                    <span>{SOURCE_LABELS[selectedProposal.detection_source]?.label}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Frequency</Label>
                  <p className="mt-1">{selectedProposal.frequency_count} occurrences</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Potential Users</Label>
                  <p className="mt-1">{selectedProposal.potential_user_count} users may match</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Similar Traits</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedProposal.similar_existing_traits?.map(slug => (
                      <Badge key={slug} variant="outline" className="text-xs">{slug}</Badge>
                    )) || <span className="text-muted-foreground">None detected</span>}
                  </div>
                </div>
              </div>

              {/* Evidence Samples */}
              {selectedProposal.evidence_samples?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Evidence Samples</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {selectedProposal.evidence_samples.map((sample: any, idx: number) => (
                      <div key={idx} className="text-sm bg-muted/50 rounded p-2 italic">
                        "{sample.quote || sample.text || JSON.stringify(sample)}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Notes */}
              <div>
                <Label htmlFor="review-notes">Review Notes (optional)</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={2}
                />
              </div>

              {/* Merge Option */}
              {selectedProposal.status === 'pending' && (
                <div>
                  <Label>Or merge into existing trait</Label>
                  <Select value={mergeIntoSlug} onValueChange={setMergeIntoSlug}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing trait..." />
                    </SelectTrigger>
                    <SelectContent>
                      {existingTraits?.map(trait => (
                        <SelectItem key={trait.slug} value={trait.slug}>
                          {trait.display_name} ({trait.slug})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            
            {selectedProposal?.status === 'pending' && (
              <>
                {mergeIntoSlug ? (
                  <Button 
                    variant="secondary"
                    onClick={() => selectedProposal && declineMutation.mutate({ proposal: selectedProposal, mergeSlug: mergeIntoSlug })}
                    disabled={declineMutation.isPending}
                  >
                    <Merge className="h-4 w-4 mr-2" />
                    Merge into {mergeIntoSlug}
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="destructive"
                      onClick={() => selectedProposal && declineMutation.mutate({ proposal: selectedProposal })}
                      disabled={declineMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                    <Button 
                      onClick={() => selectedProposal && approveMutation.mutate(selectedProposal)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Approve & Create Trait
                    </Button>
                  </>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProposalCardProps {
  proposal: EmergingProposal;
  onReview: () => void;
  isReviewed?: boolean;
}

function ProposalCard({ proposal, onReview, isReviewed }: ProposalCardProps) {
  const sourceInfo = SOURCE_LABELS[proposal.detection_source] || { label: proposal.detection_source, icon: null };
  
  const statusBadge = {
    pending: <Badge variant="secondary">Pending</Badge>,
    approved: <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Approved</Badge>,
    declined: <Badge variant="destructive">Declined</Badge>,
    merged: <Badge variant="outline">Merged</Badge>,
  }[proposal.status];

  return (
    <Card className={isReviewed ? 'opacity-75' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{proposal.proposed_emoji || '🌟'}</span>
            <div>
              <CardTitle className="text-base">{proposal.proposed_display_name}</CardTitle>
              <CardDescription className="font-mono text-xs">{proposal.proposed_slug}</CardDescription>
            </div>
          </div>
          {statusBadge}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {proposal.proposed_description || 'No description provided'}
        </p>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {sourceInfo.icon}
            <span>{sourceInfo.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{proposal.potential_user_count} potential</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>{proposal.frequency_count}× detected</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" size="sm" onClick={onReview} className="w-full">
          {isReviewed ? 'View Details' : 'Review'}
        </Button>
      </CardFooter>
    </Card>
  );
}
