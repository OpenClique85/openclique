/**
 * EventbriteBrowseTab - Browse organization events or import by URL
 * 
 * Note: Eventbrite deprecated their public event search API in 2019.
 * This tab now shows events from the connected organization (if any)
 * and provides clear guidance to use URL import for external events.
 */

import { useState } from 'react';
import { useEventbriteSearch } from '@/hooks/useEventbriteSearch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, MapPin, ChevronLeft, ChevronRight, Ticket, Info, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface EventbriteEventPreview {
  eventbrite_event_id: string;
  name: string;
  description: string;
  start_datetime: string | null;
  end_datetime: string | null;
  venue_name: string | null;
  venue_address: any;
  image_url: string | null;
  ticket_url: string;
  is_free: boolean;
  capacity: number | null;
  organizer_name: string | null;
}

interface EventbriteBrowseTabProps {
  onSelectEvent: (event: EventbriteEventPreview) => void;
  isCreatingQuest?: boolean;
  onSwitchToUrlTab?: () => void;
}

export function EventbriteBrowseTab({ onSelectEvent, isCreatingQuest, onSwitchToUrlTab }: EventbriteBrowseTabProps) {
  const { events, pagination, isLoading, error, nextPage, prevPage, currentParams, message, apiDeprecated } = useEventbriteSearch();

  return (
    <div className="space-y-4">
      {/* Deprecation Notice */}
      <Alert className="bg-muted/50 border-muted-foreground/20">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Quick tip:</strong> Eventbrite's public search API is no longer available. 
          {events.length > 0 ? (
            <span> Below are events from your connected organization. </span>
          ) : (
            <span> </span>
          )}
          For any other event, 
          <Button 
            variant="link" 
            className="px-1 h-auto text-primary underline"
            onClick={onSwitchToUrlTab}
          >
            paste the event URL directly
          </Button>
          to import it.
        </AlertDescription>
      </Alert>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Unable to load events. Please try the URL import instead.</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium mb-2">No organization events found</p>
          <p className="text-sm mb-4">
            Browse events on Eventbrite and copy the URL to import them.
          </p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('https://www.eventbrite.com/d/tx--austin/events/', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Browse Eventbrite
            </Button>
            <Button 
              size="sm" 
              onClick={onSwitchToUrlTab}
            >
              Import by URL
            </Button>
          </div>
        </div>
      ) : (
        <>
          {message && (
            <p className="text-sm text-muted-foreground italic">{message}</p>
          )}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {events.map((event) => (
              <Card key={event.eventbrite_event_id} className="overflow-hidden hover:border-primary/30 transition-colors">
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🎟️
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold line-clamp-1 mb-1">{event.name}</h4>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                      {event.start_datetime && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.start_datetime), 'MMM d, h:mm a')}
                        </span>
                      )}
                      {event.venue_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.venue_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={event.is_free ? 'secondary' : 'outline'} className="text-xs">
                        <Ticket className="h-3 w-3 mr-1" />
                        {event.is_free ? 'Free' : 'Ticketed'}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => onSelectEvent(event)}
                        disabled={isCreatingQuest}
                        className="ml-auto"
                      >
                        Create Quest
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Pagination - only show if there are events */}
      {pagination && events.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            {pagination.total_count} events
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentParams.page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {currentParams.page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={!pagination.has_more || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
