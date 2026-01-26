/**
 * EventbriteBrowseTab - Browse and search public Eventbrite events
 */

import { useState } from 'react';
import { useEventbriteSearch } from '@/hooks/useEventbriteSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Calendar, MapPin, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
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
}

export function EventbriteBrowseTab({ onSelectEvent, isCreatingQuest }: EventbriteBrowseTabProps) {
  const [searchInput, setSearchInput] = useState('');
  const { events, pagination, isLoading, search, nextPage, prevPage, currentParams } = useEventbriteSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search({ query: searchInput });
  };

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events in Austin..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </form>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No events found. Try a different search term.</p>
        </div>
      ) : (
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
      )}

      {/* Pagination */}
      {pagination && pagination.total_count > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            {pagination.total_count} events found
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
