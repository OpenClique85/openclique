/**
 * KeepCliquePrompt - Inline prompt shown after feedback completion
 * 
 * Allows users to express interest in keeping their quest clique together.
 * Premium feature - shows upsell for non-premium users.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Users, Crown, Loader2, Heart, Check } from 'lucide-react';
import { KeepCliqueModal } from './KeepCliqueModal';

interface CliqueProps {
  squadId: string;
  instanceId: string;
  onComplete?: () => void;
}

interface SquadMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

export function KeepCliquePrompt({ squadId, instanceId, onComplete }: CliqueProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hasPersonalPremium, shouldShowPremiumUpsell } = useEntitlements();
  const [showModal, setShowModal] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Check if user already submitted a request
  const { data: existingRequest } = useQuery({
    queryKey: ['clique-save-request', instanceId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('clique_save_requests')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('requester_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !!instanceId,
  });

  // Fetch squad members
  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['squad-members-for-clique', squadId],
    queryFn: async () => {
      if (!squadId || !user?.id) return [];
      
      const { data, error } = await supabase
        .from('squad_members')
        .select(`
          user_id,
          profiles:user_id(id, display_name, avatar_url)
        `)
        .eq('squad_id', squadId)
        .eq('status', 'active')
        .neq('user_id', user.id);

      if (error) throw error;

      return (data || []).map((m: any) => ({
        user_id: m.user_id,
        display_name: m.profiles?.display_name || 'Unknown',
        avatar_url: m.profiles?.avatar_url,
      })) as SquadMember[];
    },
    enabled: !!squadId && !!user?.id,
  });

  if (existingRequest || hasSubmitted) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 text-primary">
            <Check className="h-5 w-5" />
            <div>
              <p className="font-medium">Clique request submitted!</p>
              <p className="text-sm text-muted-foreground">
                We'll notify you when others want to keep the clique too.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingMembers || members.length === 0) {
    return null;
  }

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleComplete = () => {
    setHasSubmitted(true);
    setShowModal(false);
    onComplete?.();
    queryClient.invalidateQueries({ queryKey: ['clique-save-request'] });
  };

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Keep Your Clique?
            </CardTitle>
            <Badge variant="secondary" className="gap-1">
              <Crown className="h-3 w-3" />
              Premium
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Want to quest with these people again? Select who you'd like to stay connected with.
          </p>
          
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member) => (
              <Avatar key={member.user_id} className="border-2 border-background h-10 w-10">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-muted">
                  {member.display_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {members.length > 4 && (
              <div className="h-10 w-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                +{members.length - 4}
              </div>
            )}
          </div>

          <Button onClick={handleOpenModal} className="w-full gap-2">
            <Users className="h-4 w-4" />
            Select Members to Keep
          </Button>
          
          {shouldShowPremiumUpsell() && (
            <p className="text-xs text-center text-muted-foreground">
              🎁 Free during pilot — normally a Premium feature
            </p>
          )}
        </CardContent>
      </Card>

      <KeepCliqueModal
        open={showModal}
        onOpenChange={setShowModal}
        squadId={squadId}
        instanceId={instanceId}
        members={members}
        onComplete={handleComplete}
      />
    </>
  );
}
