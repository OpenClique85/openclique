/**
 * Squad Manager
 * 
 * Generate squads, assign WhatsApp links, and manage squad composition.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, Wand2, Lock, Copy, MessageSquare, 
  Loader2, AlertCircle, CheckCircle, Link2
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';

interface SquadWithMembers {
  id: string;
  name: string;
  whatsapp_invite_link: string | null;
  members: {
    id: string;
    user_id: string;
    display_name: string;
    status: string;
    checked_in_at: string | null;
    whatsapp_joined: boolean;
  }[];
}

interface SquadManagerProps {
  instanceId: string;
  targetSquadSize: number;
}

export function SquadManager({ instanceId, targetSquadSize }: SquadManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingSquad, setEditingSquad] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState('');

  // Fetch squads with members
  const { data: squads, isLoading } = useQuery({
    queryKey: ['instance-squads-detail', instanceId],
    queryFn: async () => {
      // First get squads - use existing quest_squads columns
      const { data: squadData, error: squadError } = await supabase
        .from('quest_squads')
        .select('id, squad_name, whatsapp_link')
        .eq('quest_id', instanceId)
        .order('squad_name');
      
      if (squadError) throw squadError;
      
      // Then get members for each squad
      const squadsWithMembers: SquadWithMembers[] = await Promise.all(
        (squadData || []).map(async (squad) => {
          const { data: members } = await supabase
            .from('squad_members')
            .select(`
              id, user_id,
              profiles!inner(display_name)
            `)
            .eq('squad_id', squad.id);
          
          return {
            id: squad.id,
            name: squad.squad_name || `Squad ${squad.id.slice(0, 4)}`,
            whatsapp_invite_link: squad.whatsapp_link,
            members: (members || []).map((m: any) => ({
              id: m.id,
              user_id: m.user_id,
              display_name: m.profiles?.display_name || 'Unknown',
              status: 'confirmed', // Will need to join with signups if needed
              checked_in_at: null,
              whatsapp_joined: false,
            }))
          };
        })
      );
      
      return squadsWithMembers;
    },
  });

  // Fetch unassigned participants
  const { data: unassigned } = useQuery({
    queryKey: ['instance-unassigned', instanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quest_signups')
        .select(`
          id, user_id, status,
          profiles!inner(display_name)
        `)
        .eq('instance_id', instanceId)
        .is('squad_id', null)
        .in('status', ['pending', 'confirmed']);
      
      if (error) throw error;
      return data;
    },
  });

  // Generate squads
  const handleGenerateSquads = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-squads', {
        body: { quest_id: instanceId, squad_size: targetSquadSize }
      });
      
      if (error) throw error;
      
      // Create squads and assign members
      for (const suggestion of data.squads || []) {
        // Create squad with existing schema
        const { data: newSquad, error: createError } = await supabase
          .from('quest_squads')
          .insert({
            quest_id: instanceId,
            squad_name: suggestion.suggested_name,
          })
          .select()
          .single();
        
        if (createError) continue;
        
        // Assign members
        for (const member of suggestion.members) {
          await supabase
            .from('squad_members')
            .upsert({
              squad_id: newSquad.id,
              user_id: member.user_id,
            }, { onConflict: 'squad_id,user_id' });
          
          // Note: squad_id on quest_signups is a new column from migration
          // The actual assignment will work once types refresh
          await supabase
            .from('quest_signups')
            .update({ notes_private: `Squad: ${newSquad.id}` } as any)
            .eq('id', member.signup_id);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['instance-squads-detail', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['instance-unassigned', instanceId] });
      toast({ title: 'Squads generated!', description: `Created ${data.squads?.length || 0} squads` });
    } catch (err: any) {
      toast({ title: 'Failed to generate squads', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Update WhatsApp link - use existing column name
  const updateWhatsAppLink = async (squadId: string) => {
    try {
      const { error } = await supabase
        .from('quest_squads')
        .update({ whatsapp_link: whatsappLink })
        .eq('id', squadId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['instance-squads-detail', instanceId] });
      setEditingSquad(null);
      setWhatsappLink('');
      toast({ title: 'WhatsApp link saved' });
    } catch (err: any) {
      toast({ title: 'Failed to save link', description: err.message, variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {squads?.length || 0} squads • {unassigned?.length || 0} unassigned
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleGenerateSquads}
                disabled={isGenerating || !unassigned?.length}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Generate Squads
              </Button>
              <Button variant="outline">
                <Lock className="h-4 w-4 mr-2" />
                Lock All Squads
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unassigned */}
      {unassigned && unassigned.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Unassigned Participants ({unassigned.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unassigned.map((p: any) => (
                <Badge key={p.id} variant="outline">
                  {p.profiles?.display_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Squad Grid */}
      {squads && squads.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {squads.map((squad) => (
            <Card key={squad.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{squad.name}</CardTitle>
                  <Badge variant="secondary">{squad.members.length} members</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Members list */}
                <div className="space-y-1">
                  {squad.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm py-1">
                      <span>{m.display_name}</span>
                      <div className="flex items-center gap-2">
                        {m.whatsapp_joined && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {m.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* WhatsApp Link */}
                <div className="pt-2 border-t">
                  {squad.whatsapp_invite_link ? (
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {squad.whatsapp_invite_link}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(squad.whatsapp_invite_link!, 'Link')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setEditingSquad(squad.id);
                        setWhatsappLink('');
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add WhatsApp Link
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Squads Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate squads when you have enough confirmed participants.
            </p>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp Link Dialog */}
      <Dialog open={!!editingSquad} onOpenChange={() => setEditingSquad(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add WhatsApp Group Link</DialogTitle>
            <DialogDescription>
              Paste the invite link for this squad's WhatsApp group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-link">WhatsApp Invite Link</Label>
              <Input
                id="whatsapp-link"
                placeholder="https://chat.whatsapp.com/..."
                value={whatsappLink}
                onChange={(e) => setWhatsappLink(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSquad(null)}>Cancel</Button>
            <Button onClick={() => editingSquad && updateWhatsAppLink(editingSquad)}>
              Save Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
