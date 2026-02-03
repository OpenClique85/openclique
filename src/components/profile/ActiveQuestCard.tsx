/**
 * =============================================================================
 * ActiveQuestCard - Rich card for today/upcoming quests with live stats
 * =============================================================================
 * 
 * Displays:
 * - Quest info with icon and dates
 * - Live signup/squad counts
 * - Journey timeline
 * - Action buttons (Invite, View Details, Cancel)
 */

import { Link, useNavigate } from 'react-router-dom';
import { useQuestStats } from '@/hooks/useQuestStats';
import { QuestJourneyTimeline } from '@/components/quests';
import { RecruitFriendButton } from '@/components/quests/RecruitFriendButton';
import ShareQuestButton from '@/components/ShareQuestButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Sparkles,
  Flame,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { format, isToday, formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;

interface SignupWithJourney {
  id: string;
  quest_id: string;
  status: string | null;
  quest: Quest & {
    sponsor_profiles?: { id: string; name: string } | null;
  };
  squadId?: string | null;
  squadStatus?: string | null;
  squadName?: string | null;
  questCardToken?: string | null;
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  standby: { label: 'Standby', variant: 'outline' },
  dropped: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'destructive' },
  completed: { label: 'Completed', variant: 'default' },
};

interface ActiveQuestCardProps {
  signup: SignupWithJourney;
  isLive?: boolean;
  onCancelClick: (signup: SignupWithJourney) => void;
}

export function ActiveQuestCard({ signup, isLive = false, onCancelClick }: ActiveQuestCardProps) {
  const navigate = useNavigate();
  const { data: stats } = useQuestStats(signup.quest.id);
  
  const startDate = signup.quest.start_datetime ? new Date(signup.quest.start_datetime) : null;
  const endDate = signup.quest.end_datetime ? new Date(signup.quest.end_datetime) : null;
  
  // Format date display
  const getDateDisplay = () => {
    if (!startDate) return 'Date TBD';
    
    const isSameDay = endDate && startDate.toDateString() === endDate.toDateString();
    
    if (isToday(startDate)) {
      if (endDate && !isSameDay) {
        return `Today → ${format(endDate, 'MMM d')}`;
      }
      return `Today @ ${format(startDate, 'h:mm a')}`;
    }
    
    if (endDate && !isSameDay) {
      return `${format(startDate, 'MMM d')} → ${format(endDate, 'MMM d')}`;
    }
    
    return format(startDate, 'EEEE, MMMM d @ h:mm a');
  };

  // Time until quest starts
  const getTimeUntil = () => {
    if (!startDate) return null;
    if (startDate <= new Date()) return null; // Already started
    return formatDistanceToNow(startDate, { addSuffix: true });
  };

  const timeUntil = getTimeUntil();
  const isPopular = (stats?.signupCount || 0) >= 5;
  
  return (
    <Card className={`overflow-hidden ${isLive ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{signup.quest.icon || '🎯'}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="font-display text-lg">
                  {signup.quest.title}
                </CardTitle>
                {signup.quest.is_sponsored && (
                  <Badge variant="outline" className="text-sunset border-sunset text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Sponsored
                  </Badge>
                )}
                {isPopular && (
                  <Badge variant="secondary" className="text-xs">
                    <Flame className="h-3 w-3 mr-1 text-orange-500" />
                    Popular
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{getDateDisplay()}</span>
                {timeUntil && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-primary font-medium">{timeUntil}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Badge variant={STATUS_BADGES[signup.status || 'pending'].variant}>
            {STATUS_BADGES[signup.status || 'pending'].label}
          </Badge>
        </div>
      </CardHeader>
      
      {/* Live Stats */}
      <CardContent className="py-3 border-y bg-muted/30">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium">{stats?.signupCount || 0}</span>
            <span className="text-muted-foreground">signed up</span>
          </div>
          {(stats?.squadCount || 0) > 0 && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{stats?.squadCount}</span>
                <span className="text-muted-foreground">
                  {stats?.squadCount === 1 ? 'squad' : 'squads'} forming
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      {/* Journey Timeline */}
      <CardContent className="py-4 bg-muted/20">
        <QuestJourneyTimeline
          signupStatus={signup.status as 'pending' | 'confirmed' | 'standby' | 'dropped' | 'no_show' | 'completed'}
          squadId={signup.squadId}
          squadStatus={signup.squadStatus}
          questCardToken={signup.questCardToken}
          questStartDate={startDate}
        />
      </CardContent>
      
      {/* Location & Actions */}
      <CardContent className="pt-0">
        {signup.status === 'confirmed' && signup.quest.meeting_location_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4" />
            <span>{signup.quest.meeting_location_name}</span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/quests/${signup.quest.slug ?? signup.quest.id}`}>
              <ExternalLink className="h-4 w-4 mr-1" />
              View Details
            </Link>
          </Button>
          
          {(signup.status === 'pending' || signup.status === 'confirmed' || signup.status === 'standby') && (
            <>
              <ShareQuestButton quest={signup.quest} variant="outline" />
              <RecruitFriendButton 
                questId={signup.quest.id} 
                questTitle={signup.quest.title}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onCancelClick(signup)}
              >
                I Can't Go
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
