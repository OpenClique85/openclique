/**
 * =============================================================================
 * SQUAD DETAIL DRAWER - Detailed view of a squad with tabs for members/feedback
 * =============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Star, MessageSquare, Activity, Lock, Calendar,
  MapPin, ThumbsUp
} from 'lucide-react';

interface SquadDetailDrawerProps {
  squadId: string | null;
  onClose: () => void;
}

export function SquadDetailDrawer({ squadId, onClose }: SquadDetailDrawerProps) {
  // Fetch squad details
  const { data: squad, isLoading } = useQuery({
    queryKey: ['squad-detail', squadId],
    queryFn: async () => {
      if (!squadId) return null;

      // Get squad
      const { data: squadData, error: squadError } = await supabase
        .from('quest_squads')
        .select('*')
        .eq('id', squadId)
        .single();

      if (squadError) throw squadError;

      // Get quest/instance info
      let questInfo: { title: string; scheduled_date: string | null; start_time: string | null; meeting_point_name: string | null } | null = null;
      
      if (squadData.quest_id) {
        // Try quest_instances first
        const { data: instance } = await supabase
          .from('quest_instances')
          .select('title, scheduled_date, start_time, meeting_point_name')
          .eq('id', squadData.quest_id)
          .single();
        
        if (instance) {
          questInfo = instance;
        } else {
          // Fall back to quests table
          const { data: quest } = await supabase
            .from('quests')
            .select('title, start_datetime, meeting_location_name')
            .eq('id', squadData.quest_id)
            .single();
          
          if (quest) {
            questInfo = {
              title: quest.title || 'Unknown',
              scheduled_date: quest.start_datetime,
              start_time: null,
              meeting_point_name: quest.meeting_location_name,
            };
          }
        }
      }

      // Get members
      const { data: members } = await supabase
        .from('squad_members')
        .select(`
          id,
          user_id,
          status,
          role,
          added_at,
          profiles(display_name, city, avatar_url)
        `)
        .eq('squad_id', squadId);

      // Get feedback for this quest
      const { data: feedback } = await supabase
        .from('feedback')
        .select('*')
        .eq('quest_id', squadData.quest_id);

      // Get event log
      const { data: events } = await supabase
        .from('quest_event_log')
        .select('*')
        .eq('instance_id', squadData.quest_id)
        .order('created_at', { ascending: false })
        .limit(20);

      return {
        ...squadData,
        questInfo,
        members: members || [],
        feedback: feedback || [],
        events: events || [],
      };
    },
    enabled: !!squadId,
  });

  const formationReason = squad?.formation_reason as Record<string, unknown> | null;

  // Calculate feedback stats
  const feedbackStats = {
    avgRating: squad?.feedback.length 
      ? squad.feedback.reduce((sum: number, f: any) => sum + (f.rating_1_5 || 0), 0) / squad.feedback.filter((f: any) => f.rating_1_5).length
      : null,
    wouldDoAgain: squad?.feedback.filter((f: any) => f.would_do_again === true).length || 0,
    testimonials: squad?.feedback.filter((f: any) => f.testimonial_text && f.is_testimonial_approved).length || 0,
  };

  return (
    <Drawer open={!!squadId} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <DrawerTitle>{squad?.squad_name || 'Squad Details'}</DrawerTitle>
            {squad?.locked_at && (
              <Badge variant="secondary">
                <Lock className="h-3 w-3 mr-1" />
                Locked
              </Badge>
            )}
          </div>
          <DrawerDescription>
            {squad?.questInfo?.title || 'Unknown Quest'} • {squad?.questInfo?.scheduled_date 
              ? format(new Date(squad.questInfo.scheduled_date), 'MMMM d, yyyy')
              : 'No date'}
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="h-[calc(85vh-120px)] px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{squad?.members.length}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                      <p className="text-2xl font-bold">
                        {feedbackStats.avgRating?.toFixed(1) || '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg Rating</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">{feedbackStats.testimonials}</p>
                      <p className="text-xs text-muted-foreground">Testimonials</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quest Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quest Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {squad?.questInfo?.scheduled_date 
                          ? format(new Date(squad.questInfo.scheduled_date), 'EEEE, MMMM d, yyyy')
                          : 'No date'}
                        {squad?.questInfo?.start_time && ` at ${squad.questInfo.start_time}`}
                      </span>
                    </div>
                    {squad?.questInfo?.meeting_point_name && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{squad.questInfo.meeting_point_name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Formation Reason */}
                {formationReason && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Formation Reasoning</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Primary Factor</span>
                        <Badge variant="outline">
                          {String(formationReason.primary_factor || 'Unknown')}
                        </Badge>
                      </div>
                      {squad?.referral_bonds && squad.referral_bonds > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Referral Bonds</span>
                          <span className="font-medium">{squad.referral_bonds}</span>
                        </div>
                      )}
                      {squad?.compatibility_score && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Compatibility Score</span>
                          <span className="font-medium">
                            {(Number(squad.compatibility_score) * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-3 mt-4">
                {squad?.members.map((member: any) => {
                  const profile = member.profiles;
                  return (
                    <Card key={member.id}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              {profile?.avatar_url ? (
                                <img 
                                  src={profile.avatar_url} 
                                  alt="" 
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <Users className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{profile?.display_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">
                                {profile?.city || 'No location'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.role === 'leader' && (
                              <Badge variant="default">Leader</Badge>
                            )}
                            <Badge variant={member.status === 'confirmed' ? 'secondary' : 'outline'}>
                              {member.status || 'member'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {squad?.members.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No members</p>
                )}
              </TabsContent>

              {/* Feedback Tab */}
              <TabsContent value="feedback" className="space-y-3 mt-4">
                {/* Stats Bar */}
                <div className="flex gap-4 p-3 bg-muted rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    <span>{feedbackStats.wouldDoAgain} would do again</span>
                  </div>
                </div>

                {/* Feedback Entries */}
                {squad?.feedback.map((fb: any) => (
                  <Card key={fb.id}>
                    <CardContent className="py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {fb.rating_1_5 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{fb.rating_1_5}/5</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {fb.submitted_at ? format(new Date(fb.submitted_at), 'MMM d, yyyy') : '—'}
                        </span>
                      </div>
                      
                      {fb.best_part && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Best part: </span>
                          {fb.best_part}
                        </div>
                      )}
                      
                      {fb.friction_point && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Friction: </span>
                          {fb.friction_point}
                        </div>
                      )}
                      
                      {fb.testimonial_text && fb.is_testimonial_approved && (
                        <div className="p-2 bg-primary/10 rounded text-sm italic">
                          "{fb.testimonial_text}"
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {squad?.feedback.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No feedback yet</p>
                )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-2 mt-4">
                {squad?.events.map((event: any) => (
                  <div key={event.id} className="flex items-start gap-3 p-2 text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{String(event.event_type).replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
                {squad?.events.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No activity logged</p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
