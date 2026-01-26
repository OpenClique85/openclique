/**
 * ReadyCheckCard - Display and respond to a ready check
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Clock, Check, X, HelpCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ReadyCheck } from '@/hooks/useCliqueReadyChecks';

interface ReadyCheckCardProps {
  check: ReadyCheck;
  onRespond: (response: 'go' | 'maybe' | 'no') => void;
  isResponding?: boolean;
  memberCount: number;
}

export function ReadyCheckCard({ 
  check, 
  onRespond, 
  isResponding,
  memberCount 
}: ReadyCheckCardProps) {
  const isExpired = new Date(check.expires_at) <= new Date();
  const hasResponded = !!check.user_response;

  const goCount = check.responses.filter(r => r.response === 'go').length;
  const maybeCount = check.responses.filter(r => r.response === 'maybe').length;
  const noCount = check.responses.filter(r => r.response === 'no').length;
  const responseRate = memberCount > 0 ? Math.round((check.responses.length / memberCount) * 100) : 0;

  return (
    <Card className={isExpired ? 'opacity-75' : 'border-primary/50'}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{check.title}</CardTitle>
          </div>
          {isExpired ? (
            <Badge variant="secondary">Expired</Badge>
          ) : (
            <Badge variant="default" className="animate-pulse">Active</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Started by {check.triggered_by_name}
        </p>
        {!isExpired && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Expires {formatDistanceToNow(new Date(check.expires_at), { addSuffix: true })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Response summary */}
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <Check className="h-4 w-4" />
            {goCount} Go
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <HelpCircle className="h-4 w-4" />
            {maybeCount} Maybe
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <X className="h-4 w-4" />
            {noCount} No
          </span>
        </div>

        {/* Response rate */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{check.responses.length} of {memberCount} responded</span>
            <span>{responseRate}%</span>
          </div>
          <Progress value={responseRate} className="h-2" />
        </div>

        {/* Response buttons */}
        {!isExpired && (
          <div className="flex gap-2">
            <Button
              variant={check.user_response === 'go' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => onRespond('go')}
              disabled={isResponding}
            >
              <Check className="h-4 w-4 mr-1" />
              Go
            </Button>
            <Button
              variant={check.user_response === 'maybe' ? 'secondary' : 'outline'}
              className="flex-1"
              onClick={() => onRespond('maybe')}
              disabled={isResponding}
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Maybe
            </Button>
            <Button
              variant={check.user_response === 'no' ? 'destructive' : 'outline'}
              className="flex-1"
              onClick={() => onRespond('no')}
              disabled={isResponding}
            >
              <X className="h-4 w-4 mr-1" />
              No
            </Button>
          </div>
        )}

        {hasResponded && !isExpired && (
          <p className="text-xs text-center text-muted-foreground">
            You can change your response anytime
          </p>
        )}
      </CardContent>
    </Card>
  );
}
