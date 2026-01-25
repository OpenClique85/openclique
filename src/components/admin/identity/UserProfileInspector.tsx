/**
 * =============================================================================
 * USER PROFILE INSPECTOR - Admin tool to view/manage user trait state
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, User, Brain, Trash2, Plus, RotateCcw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { auditLog } from '@/lib/auditLog';
import type { Tables, Json } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type UserTrait = Tables<'user_traits'>;
type DraftTrait = Tables<'draft_traits'>;
type TraitLibrary = Tables<'trait_library'>;

interface ProfileWithTraits extends Profile {
  user_traits: (UserTrait & { trait_library: TraitLibrary })[];
  draft_traits: (DraftTrait & { trait_library: TraitLibrary })[];
}

export function UserProfileInspector() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [addTraitOpen, setAddTraitOpen] = useState(false);
  const [addTraitSlug, setAddTraitSlug] = useState('');
  const [addTraitReason, setAddTraitReason] = useState('');

  // Search users
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, created_at')
        .or(`display_name.ilike.%${searchQuery}%,id.eq.${searchQuery}`)
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: searchQuery.length >= 2,
  });

  // Fetch selected user's full profile with traits
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile-inspector', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', selectedUserId)
        .single();
      
      if (profileError) throw profileError;

      const { data: userTraits, error: traitsError } = await supabase
        .from('user_traits')
        .select('*, trait_library(*)')
        .eq('user_id', selectedUserId);
      
      if (traitsError) throw traitsError;

      const { data: draftTraits, error: draftsError } = await supabase
        .from('draft_traits')
        .select('*, trait_library(*)')
        .eq('user_id', selectedUserId)
        .order('created_at', { ascending: false });
      
      if (draftsError) throw draftsError;

      return {
        ...profile,
        user_traits: userTraits || [],
        draft_traits: draftTraits || [],
      } as ProfileWithTraits;
    },
    enabled: !!selectedUserId,
  });

  // Fetch trait library for add trait dropdown
  const { data: traitLibrary } = useQuery({
    queryKey: ['trait-library-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trait_library')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('display_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Remove trait mutation
  const removeTraitMutation = useMutation({
    mutationFn: async ({ traitId, reason }: { traitId: string; reason: string }) => {
      const trait = userProfile?.user_traits.find(t => t.id === traitId);
      if (!trait) throw new Error('Trait not found');

      const { error } = await supabase
        .from('user_traits')
        .delete()
        .eq('id', traitId);
      
      if (error) throw error;

      await auditLog({
        action: 'user_trait_remove',
        targetTable: 'user_traits',
        targetId: traitId,
        oldValues: { trait_slug: trait.trait_slug, user_id: trait.user_id },
        newValues: { reason } as unknown as Record<string, Json>,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile-inspector', selectedUserId] });
      toast.success('Trait removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove trait: ${error.message}`);
    },
  });

  // Add trait mutation
  const addTraitMutation = useMutation({
    mutationFn: async ({ slug, reason }: { slug: string; reason: string }) => {
      if (!selectedUserId) throw new Error('No user selected');

      const { error } = await supabase
        .from('user_traits')
        .insert({
          user_id: selectedUserId,
          trait_slug: slug,
          source: 'admin_assigned',
          visibility: 'public',
        });
      
      if (error) throw error;

      await auditLog({
        action: 'user_trait_add',
        targetTable: 'user_traits',
        targetId: selectedUserId,
        newValues: { trait_slug: slug, reason } as unknown as Record<string, Json>,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile-inspector', selectedUserId] });
      toast.success('Trait added');
      setAddTraitOpen(false);
      setAddTraitSlug('');
      setAddTraitReason('');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add trait: ${error.message}`);
    },
  });

  // Reset AI state mutation
  const resetAIMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error('No user selected');

      // Expire all pending drafts
      const { error: draftsError } = await supabase
        .from('draft_traits')
        .update({ status: 'expired' })
        .eq('user_id', selectedUserId)
        .eq('status', 'pending');
      
      if (draftsError) throw draftsError;

      await auditLog({
        action: 'ai_state_reset',
        targetTable: 'draft_traits',
        targetId: selectedUserId,
        newValues: { action: 'expired_all_pending_drafts' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile-inspector', selectedUserId] });
      toast.success('AI state reset - all pending drafts expired');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset AI state: ${error.message}`);
    },
  });

  const pendingDrafts = userProfile?.draft_traits.filter(d => d.status === 'pending') || [];
  const acceptedDrafts = userProfile?.draft_traits.filter(d => d.status === 'accepted') || [];
  const rejectedDrafts = userProfile?.draft_traits.filter(d => d.status === 'rejected') || [];

  // Get existing trait slugs to filter available traits
  const existingTraitSlugs = new Set(userProfile?.user_traits.map(t => t.trait_slug) || []);
  const availableTraits = traitLibrary?.filter(t => !existingTraitSlugs.has(t.slug)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">User Profile Inspector</h2>
        <p className="text-muted-foreground">
          View and manage any user's trait state, AI drafts, and decision history
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by display name or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {isSearching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {searchResults && searchResults.length > 0 && (
            <div className="mt-2 space-y-1">
              {searchResults.map(user => (
                <Button
                  key={user.id}
                  variant={selectedUserId === user.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <User className="h-4 w-4 mr-2" />
                  {user.display_name || 'Unnamed User'}
                  <span className="ml-auto text-xs text-muted-foreground font-mono">
                    {user.id.slice(0, 8)}...
                  </span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Profile Panel */}
      {selectedUserId && (
        <>
          {isLoadingProfile ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userProfile ? (
            <div className="space-y-6">
              {/* User Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold">
                        {userProfile.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <CardTitle>{userProfile.display_name || 'Unnamed User'}</CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {userProfile.id}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddTraitOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Trait
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetAIMutation.mutate()}
                        disabled={resetAIMutation.isPending || pendingDrafts.length === 0}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset AI State
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="traits">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="traits">
                    Accepted Traits ({userProfile.user_traits.length})
                  </TabsTrigger>
                  <TabsTrigger value="drafts">
                    Pending ({pendingDrafts.length})
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    Draft History
                  </TabsTrigger>
                  <TabsTrigger value="preferences">
                    Preferences
                  </TabsTrigger>
                </TabsList>

                {/* Accepted Traits */}
                <TabsContent value="traits" className="mt-4">
                  <Card>
                    <CardContent className="pt-4">
                      {userProfile.user_traits.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No accepted traits yet
                        </p>
                      ) : (
                        <div className="grid gap-3">
                          {userProfile.user_traits.map(trait => (
                            <div
                              key={trait.id}
                              className="flex items-center justify-between p-3 border border-border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{trait.trait_library?.emoji}</span>
                                <div>
                                  <p className="font-medium">{trait.trait_library?.display_name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {trait.trait_library?.category}
                                    </Badge>
                                    <Badge 
                                      variant={trait.visibility === 'public' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {trait.visibility}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Importance: {trait.importance}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {trait.source.replace('_', ' ')}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    const reason = prompt('Reason for removing this trait (required):');
                                    if (reason) {
                                      removeTraitMutation.mutate({ traitId: trait.id, reason });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pending Drafts */}
                <TabsContent value="drafts" className="mt-4">
                  <Card>
                    <CardContent className="pt-4">
                      {pendingDrafts.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No pending draft traits
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {pendingDrafts.map(draft => (
                            <DraftTraitCard key={draft.id} draft={draft} />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Draft History */}
                <TabsContent value="history" className="mt-4">
                  <Card>
                    <CardContent className="pt-4">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3 pr-4">
                          {userProfile.draft_traits.map(draft => (
                            <DraftTraitCard key={draft.id} draft={draft} showStatus />
                          ))}
                          {userProfile.draft_traits.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">
                              No draft history
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Preferences (raw intake data) */}
                <TabsContent value="preferences" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Raw Preferences (Intake Source)</CardTitle>
                      <CardDescription>
                        This data from profiles.preferences is used as input for AI trait inference
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                        {JSON.stringify(userProfile.preferences, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                User not found
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Trait Dialog */}
      <Dialog open={addTraitOpen} onOpenChange={setAddTraitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Trait Manually</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Manual trait assignment should be rare. This action is logged for audit.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Trait</Label>
              <Select value={addTraitSlug} onValueChange={setAddTraitSlug}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a trait..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTraits.map(trait => (
                    <SelectItem key={trait.slug} value={trait.slug}>
                      {trait.emoji} {trait.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (required)</Label>
              <Textarea
                value={addTraitReason}
                onChange={(e) => setAddTraitReason(e.target.value)}
                placeholder="Why are you manually assigning this trait?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => addTraitMutation.mutate({ slug: addTraitSlug, reason: addTraitReason })}
              disabled={!addTraitSlug || !addTraitReason || addTraitMutation.isPending}
            >
              {addTraitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Trait
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DraftTraitCardProps {
  draft: DraftTrait & { trait_library: TraitLibrary };
  showStatus?: boolean;
}

function DraftTraitCard({ draft, showStatus }: DraftTraitCardProps) {
  const getStatusIcon = () => {
    switch (draft.status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Brain className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="p-3 border border-border rounded-lg bg-card">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{draft.trait_library?.emoji}</span>
          <div>
            <p className="font-medium">{draft.trait_library?.display_name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {draft.explanation || 'No explanation provided'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">{draft.source}</Badge>
              {draft.confidence && (
                <span className="text-xs text-muted-foreground">
                  Confidence: {Math.round((draft.confidence as unknown as number) * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>
        {showStatus && (
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge 
              variant={
                draft.status === 'accepted' ? 'default' : 
                draft.status === 'rejected' ? 'destructive' : 
                'secondary'
              }
            >
              {draft.status}
            </Badge>
          </div>
        )}
      </div>
      {draft.decision_trace && (
        <details className="mt-3">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            View decision trace
          </summary>
          <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto max-h-32">
            {JSON.stringify(draft.decision_trace, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
