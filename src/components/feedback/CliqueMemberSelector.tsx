/**
 * Clique Member Selector
 * 
 * Multi-select grid of clique members for feedback preferences.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CliqueMemberSelectorProps {
  questId: string;
  currentUserId: string;
  selectedMembers: string[];
  onSelectionChange: (memberIds: string[]) => void;
}

interface CliqueMember {
  id: string;
  user_id: string;
  display_name: string | null;
}

export function CliqueMemberSelector({
  questId,
  currentUserId,
  selectedMembers,
  onSelectionChange,
}: CliqueMemberSelectorProps) {
  // Fetch clique members based on quest participation
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['clique-members-feedback', questId, currentUserId],
    queryFn: async () => {
      // Find the user's squad for this quest
      const { data: membership, error: membershipError } = await supabase
        .from('squad_members')
        .select('squad_id')
        .eq('user_id', currentUserId)
        .single();

      if (membershipError || !membership) {
        // Try via quest_squads
        const { data: squads } = await supabase
          .from('quest_squads')
          .select('id')
          .eq('quest_id', questId);

        if (!squads?.length) return [];

        const squadIds = squads.map(s => s.id);
        
        // Find which squad the user is in
        const { data: userMembership } = await supabase
          .from('squad_members')
          .select('squad_id')
          .eq('user_id', currentUserId)
          .in('squad_id', squadIds)
          .single();

        if (!userMembership) return [];

        // Get all members of that squad
        const { data: squadMembers } = await supabase
          .from('squad_members')
          .select('id, user_id')
          .eq('squad_id', userMembership.squad_id)
          .neq('user_id', currentUserId)
          .neq('status', 'dropped');

        if (!squadMembers?.length) return [];

        // Get profiles
        const userIds = squadMembers.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

        return squadMembers.map(m => ({
          id: m.id,
          user_id: m.user_id,
          display_name: profileMap.get(m.user_id) || null,
        })) as CliqueMember[];
      }

      // Get all members of the squad (excluding current user)
      const { data: squadMembers, error: membersError } = await supabase
        .from('squad_members')
        .select('id, user_id')
        .eq('squad_id', membership.squad_id)
        .neq('user_id', currentUserId)
        .neq('status', 'dropped');

      if (membersError || !squadMembers?.length) return [];

      // Get profiles
      const userIds = squadMembers.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

      return squadMembers.map(m => ({
        id: m.id,
        user_id: m.user_id,
        display_name: profileMap.get(m.user_id) || null,
      })) as CliqueMember[];
    },
    enabled: !!questId && !!currentUserId,
  });

  const toggleMember = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      onSelectionChange(selectedMembers.filter(id => id !== userId));
    } else {
      onSelectionChange([...selectedMembers, userId]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No clique members found
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        Who would you like to quest with again?
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {members.map((member) => {
          const isSelected = selectedMembers.includes(member.user_id);
          const displayName = member.display_name || 'Member';
          const initials = displayName.slice(0, 2).toUpperCase();

          return (
            <button
              key={member.user_id}
              type="button"
              onClick={() => toggleMember(member.user_id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                isSelected
                  ? "bg-primary/10 border-primary"
                  : "bg-background border-border hover:border-primary/50"
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className={cn(
                  "text-sm",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm truncate",
                  isSelected && "text-primary"
                )}>
                  {displayName}
                </p>
              </div>
              <Checkbox
                checked={isSelected}
                className="pointer-events-none"
              />
            </button>
          );
        })}
      </div>
      {selectedMembers.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
