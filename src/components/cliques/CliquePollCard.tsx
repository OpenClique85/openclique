/**
 * CliquePollCard - Display and interact with a poll
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Check, Clock, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Poll } from '@/hooks/useCliquePolls';

interface CliquePollCardProps {
  poll: Poll;
  onVote: (optionIndex: number) => void;
  onClose?: () => void;
  isVoting?: boolean;
  isLeader?: boolean;
}

export function CliquePollCard({ 
  poll, 
  onVote, 
  onClose,
  isVoting,
  isLeader 
}: CliquePollCardProps) {
  const isClosed = !!poll.closed_at || (poll.expires_at && new Date(poll.expires_at) <= new Date());
  const hasVoted = poll.user_vote !== null && poll.user_vote !== undefined;
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <Card className={isClosed ? 'opacity-75' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{poll.question}</CardTitle>
          </div>
          {isClosed && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Closed
            </Badge>
          )}
        </div>
        {poll.expires_at && !isClosed && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Expires {formatDistanceToNow(new Date(poll.expires_at), { addSuffix: true })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {poll.options.map((option, index) => {
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const isSelected = poll.user_vote === index;

          if (hasVoted || isClosed) {
            // Show results view
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    {option.label}
                    {isSelected && <Check className="h-3 w-3 text-primary" />}
                  </span>
                  <span className="text-muted-foreground">
                    {option.votes} vote{option.votes !== 1 ? 's' : ''} ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          }

          // Voting view
          return (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onVote(index)}
              disabled={isVoting}
            >
              {option.label}
            </Button>
          );
        })}

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
          </p>
          {isLeader && !isClosed && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close Poll
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
