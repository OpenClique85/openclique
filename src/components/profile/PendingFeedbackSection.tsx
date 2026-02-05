/**
 * Pending Feedback Section
 * 
 * Shows active feedback requests for the user with XP rewards and expiry.
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Zap, Clock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PendingFeedbackSectionProps {
  userId: string;
}

interface FeedbackRequest {
  id: string;
  quest_id: string;
  status: string;
  expires_at: string | null;
  xp_basic: number;
  xp_extended: number;
  xp_pricing: number;
  xp_testimonial: number;
  quest: {
    title: string;
    icon: string | null;
  } | null;
}

export function PendingFeedbackSection({ userId }: PendingFeedbackSectionProps) {
  const { data: pendingRequests = [], isLoading } = useQuery({
    queryKey: ['pending-feedback-requests', userId],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('feedback_requests')
        .select(`
          id,
          quest_id,
          status,
          expires_at,
          xp_basic,
          xp_extended,
          xp_pricing,
          xp_testimonial,
          quest:quests(title, icon)
        `)
        .eq('user_id', userId)
        .neq('status', 'full_complete')
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []) as FeedbackRequest[];
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Give Feedback</h3>
        <Badge variant="secondary" className="text-xs">
          {pendingRequests.length} pending
        </Badge>
      </div>

      <div className="grid gap-3">
        {pendingRequests.map((request) => {
          const maxXP = (request.xp_basic || 0) + (request.xp_extended || 0) + 
                       (request.xp_pricing || 0) + (request.xp_testimonial || 0);
          
          const daysRemaining = request.expires_at 
            ? formatDistanceToNow(new Date(request.expires_at), { addSuffix: true })
            : null;

          return (
            <Card key={request.id} className="overflow-hidden hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <Link to={`/feedback/${request.quest_id}`} className="flex items-center gap-4">
                  <span className="text-3xl">{request.quest?.icon || '🎯'}</span>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {request.quest?.title || 'Quest Feedback'}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <Zap className="h-3.5 w-3.5" />
                        Up to {maxXP} XP
                      </span>
                      {daysRemaining && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Expires {daysRemaining}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
