/**
 * OrgClubEvents - Displays upcoming quests/events for a club organization
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Users, ArrowRight, Ticket } from 'lucide-react';
import { format } from 'date-fns';

interface OrgClubEventsProps {
  orgId: string;
  orgName: string;
}

export function OrgClubEvents({ orgId, orgName }: OrgClubEventsProps) {
  const { data: quests, isLoading } = useQuery({
    queryKey: ['org-club-events', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select(`
          id,
          title,
          slug,
          short_description,
          start_datetime,
          end_datetime,
          meeting_location_name,
          meeting_address,
          capacity_total,
          image_url,
          status,
          eventbrite_events(ticket_url, is_free)
        `)
        .eq('org_id', orgId)
        .eq('status', 'open')
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime', { ascending: true })
        .limit(6);

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Browse upcoming events from {orgName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!quests?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Browse upcoming events from {orgName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No upcoming events scheduled</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back soon for new events from {orgName}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>Browse upcoming events from {orgName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quests.map((quest) => {
            const eventbriteEvent = quest.eventbrite_events?.[0];
            
            return (
              <Card key={quest.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                {quest.image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={quest.image_url}
                      alt={quest.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-display font-semibold text-lg mb-2 line-clamp-2">
                    {quest.title}
                  </h3>
                  
                  <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                    {quest.start_datetime && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>{format(new Date(quest.start_datetime), 'EEE, MMM d • h:mm a')}</span>
                      </div>
                    )}
                    {quest.meeting_location_name && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{quest.meeting_location_name}</span>
                      </div>
                    )}
                    {quest.capacity_total && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 shrink-0" />
                        <span>{quest.capacity_total} spots</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link to={`/quests/${quest.slug}`}>
                        View Quest
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                    {eventbriteEvent?.ticket_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a
                          href={eventbriteEvent.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Ticket className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {eventbriteEvent?.is_free && (
                      <Badge variant="secondary">Free</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
