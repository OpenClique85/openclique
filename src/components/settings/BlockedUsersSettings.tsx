/**
 * =============================================================================
 * Blocked Users Settings Component
 * =============================================================================
 * Shows list of blocked users and allows unblocking them.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Ban, Loader2, UserX } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface BlockedUser {
  id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
  blocked_profile: {
    display_name: string | null;
  } | null;
}

export function BlockedUsersSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const { data: blockedUsers, isLoading } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_blocks')
        .select(`
          id,
          blocked_id,
          reason,
          created_at,
          blocked_profile:profiles!user_blocks_blocked_id_fkey(display_name)
        `)
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BlockedUser[];
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'User unblocked',
        description: 'They can now see your profile and message you again.',
      });
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      setUnblockingId(null);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to unblock user',
        description: error.message,
      });
      setUnblockingId(null);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ban className="h-5 w-5" />
          Blocked Users
        </CardTitle>
        <CardDescription>
          Users you've blocked can't see your profile, message you, or be matched with you in quests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !blockedUsers?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserX className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>You haven't blocked anyone</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div>
                  <p className="font-medium">
                    {block.blocked_profile?.display_name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Blocked {format(new Date(block.created_at), 'MMM d, yyyy')}
                  </p>
                  {block.reason && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Reason: {block.reason}
                    </p>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Unblock
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unblock {block.blocked_profile?.display_name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        They will be able to see your profile and message you again. 
                        You can block them again at any time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          setUnblockingId(block.id);
                          unblockMutation.mutate(block.id);
                        }}
                        disabled={unblockingId === block.id}
                      >
                        {unblockingId === block.id ? 'Unblocking...' : 'Unblock'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
