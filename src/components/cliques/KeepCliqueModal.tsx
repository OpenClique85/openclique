/**
 * KeepCliqueModal - Modal for selecting clique members to keep
 * 
 * Premium-gated feature for persisting quest squads.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Crown, Users, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SquadMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface KeepCliqueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  squadId: string;
  instanceId: string;
  members: SquadMember[];
  onComplete: () => void;
}

export function KeepCliqueModal({
  open,
  onOpenChange,
  squadId,
  instanceId,
  members,
  onComplete,
}: KeepCliqueModalProps) {
  const { user } = useAuth();
  const { hasPersonalPremium, shouldShowPremiumUpsell } = useEntitlements();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [acknowledgedPremium, setAcknowledgedPremium] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('clique_save_requests')
        .insert({
          instance_id: instanceId,
          squad_id: squadId,
          requester_id: user.id,
          selected_member_ids: selectedMembers,
          wants_to_save: true,
          premium_acknowledged: acknowledgedPremium || hasPersonalPremium(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Clique preference saved!', {
        description: "We'll notify you when others want to keep the clique too.",
      });
      onComplete();
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.info('You already submitted a clique request for this quest.');
        onComplete();
      } else {
        toast.error('Failed to save preference', { description: error.message });
      }
    },
  });

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAll = () => {
    setSelectedMembers(members.map((m) => m.user_id));
  };

  const handleSubmit = () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }
    submitMutation.mutate();
  };

  const isPremiumRequired = shouldShowPremiumUpsell();
  const canSubmit = selectedMembers.length > 0 && (!isPremiumRequired || acknowledgedPremium);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Keep Your Clique
          </DialogTitle>
          <DialogDescription>
            Select the members you'd like to stay connected with. If they select you too, 
            you'll be matched into a persistent clique!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {selectedMembers.length} of {members.length} selected
            </span>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select All
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members.map((member) => (
              <div
                key={member.user_id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedMembers.includes(member.user_id)
                    ? 'bg-primary/10 border-primary/50'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => toggleMember(member.user_id)}
              >
                <Checkbox
                  checked={selectedMembers.includes(member.user_id)}
                  onCheckedChange={() => toggleMember(member.user_id)}
                />
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-muted">
                    {member.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{member.display_name}</span>
                {selectedMembers.includes(member.user_id) && (
                  <Check className="h-4 w-4 text-primary ml-auto" />
                )}
              </div>
            ))}
          </div>

          {isPremiumRequired && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Crown className="h-4 w-4 text-amber-500" />
                Premium Feature
              </div>
              <p className="text-sm text-muted-foreground">
                Persistent cliques are normally a Premium feature. During pilot, you can 
                try it free!
              </p>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="premium-ack"
                  checked={acknowledgedPremium}
                  onCheckedChange={(checked) => setAcknowledgedPremium(checked as boolean)}
                />
                <label htmlFor="premium-ack" className="text-sm cursor-pointer">
                  I understand this is a Premium feature (free during pilot)
                </label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitMutation.isPending}
            className="gap-2"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Preference
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
