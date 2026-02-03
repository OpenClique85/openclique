/**
 * LFGBroadcastCard - Displays an LFG broadcast with quest info and response options
 */

import { format } from 'date-fns';
import { useLFG, LFGBroadcast } from '@/hooks/useLFG';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Megaphone, 
  MapPin, 
  Calendar, 
  Clock, 
  Users,
  Hand,
  Check,
  X,
  AtSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface LFGBroadcastCardProps {
  broadcast: LFGBroadcast;
  showRespond?: boolean;
  showResponses?: boolean;
}

export function LFGBroadcastCard({ broadcast, showRespond, showResponses }: LFGBroadcastCardProps) {
  const { user } = useAuth();
  const { respondToBroadcast, cancelBroadcast } = useLFG();
  
  const isOwner = user?.id === broadcast.user_id;
  const myResponse = broadcast.responses?.find(r => r.responder_id === user?.id);
  const interestedCount = broadcast.responses?.filter(r => r.status === 'interested').length || 0;
  const confirmedCount = broadcast.responses?.filter(r => r.status === 'confirmed').length || 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {broadcast.user && (
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {broadcast.user.display_name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                {isOwner ? 'Your LFG' : `${broadcast.user?.display_name} is looking for group`}
              </CardTitle>
              {broadcast.user?.username && !isOwner && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AtSign className="h-3 w-3" />
                  {broadcast.user.username}
                </p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {broadcast.spots_available} spot{broadcast.spots_available !== 1 ? 's' : ''} open
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {/* Quest Info */}
        {broadcast.quest && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="font-medium">{broadcast.quest.title}</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {broadcast.quest.meeting_location_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {broadcast.quest.meeting_location_name}
                </span>
              )}
              {broadcast.quest.start_datetime && (
                <>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(broadcast.quest.start_datetime), 'MMM d')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(broadcast.quest.start_datetime), 'h:mm a')}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Message */}
        {broadcast.message && (
          <p className="text-sm italic text-muted-foreground">
            "{broadcast.message}"
          </p>
        )}

        {/* Response counts */}
        {(interestedCount > 0 || confirmedCount > 0) && (
          <div className="flex gap-4 text-sm">
            {interestedCount > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Hand className="h-4 w-4" />
                {interestedCount} interested
              </span>
            )}
            {confirmedCount > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="h-4 w-4" />
                {confirmedCount} confirmed
              </span>
            )}
          </div>
        )}

        {/* Response Buttons */}
        {showRespond && !isOwner && (
          <div className="flex gap-2">
            {!myResponse ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => respondToBroadcast.mutate({ broadcastId: broadcast.id, status: 'interested' })}
                  disabled={respondToBroadcast.isPending}
                >
                  <Hand className="h-4 w-4 mr-1" />
                  I'm Interested
                </Button>
                <Button
                  size="sm"
                  onClick={() => respondToBroadcast.mutate({ broadcastId: broadcast.id, status: 'confirmed' })}
                  disabled={respondToBroadcast.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Claim Spot
                </Button>
              </>
            ) : (
              <Badge variant={myResponse.status === 'confirmed' ? 'default' : 'secondary'}>
                {myResponse.status === 'confirmed' ? 'Spot Claimed!' : 'Marked Interested'}
              </Badge>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/quests/${broadcast.quest_id}`}>View Quest</Link>
            </Button>
          </div>
        )}

        {/* Owner Actions */}
        {isOwner && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => cancelBroadcast.mutate(broadcast.id)}
              disabled={cancelBroadcast.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel LFG
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/quests/${broadcast.quest_id}`}>View Quest</Link>
            </Button>
          </div>
        )}

        {/* Responses List (for owner) */}
        {showResponses && broadcast.responses && broadcast.responses.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium">Responses:</p>
            {broadcast.responses.map((response) => (
              <div 
                key={response.id}
                className="flex items-center justify-between p-2 bg-muted/30 rounded"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {response.responder?.display_name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{response.responder?.display_name}</span>
                </div>
                <Badge variant={response.status === 'confirmed' ? 'default' : 'outline'}>
                  {response.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
