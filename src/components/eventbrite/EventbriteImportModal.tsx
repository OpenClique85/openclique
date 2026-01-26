/**
 * EventbriteImportModal - Modal for importing events from Eventbrite
 * 
 * Supports two modes:
 * 1. Paste URL - Import a specific event by URL
 * 2. Browse Events - Search and browse public events
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventbrite } from '@/hooks/useEventbrite';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Link2, Calendar, MapPin, Ticket, Check, ExternalLink, Search, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { EventbriteBrowseTab } from './EventbriteBrowseTab';

interface EventbriteEventData {
  eventbrite_event_id: string;
  name: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  venue_name: string | null;
  venue_address: any;
  image_url: string | null;
  ticket_url: string;
  is_free: boolean;
  capacity: number | null;
  organizer_name: string | null;
}

interface EventbriteImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventImported: (eventData: EventbriteEventData) => void;
}

export function EventbriteImportModal({
  open,
  onOpenChange,
  onEventImported,
}: EventbriteImportModalProps) {
  const navigate = useNavigate();
  const { importEventAsync, isImporting } = useEventbrite();
  const [eventUrl, setEventUrl] = useState('');
  const [importedEvent, setImportedEvent] = useState<EventbriteEventData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateQuest, setDuplicateQuest] = useState<{ id: string; slug: string; title: string } | null>(null);

  // Check for duplicate quests when we have an imported event
  const { data: existingQuest, isLoading: checkingDuplicate } = useQuery({
    queryKey: ['check-eventbrite-duplicate', importedEvent?.eventbrite_event_id],
    queryFn: async () => {
      if (!importedEvent?.eventbrite_event_id) return null;
      const { data, error } = await supabase
        .from('quests')
        .select('id, slug, title')
        .eq('eventbrite_event_id', importedEvent.eventbrite_event_id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking for duplicate:', error);
        return null;
      }
      return data;
    },
    enabled: !!importedEvent?.eventbrite_event_id,
  });

  const handleImport = async () => {
    if (!eventUrl.trim()) {
      setError('Please enter an Eventbrite URL');
      return;
    }

    setError(null);
    setDuplicateQuest(null);
    try {
      const eventData = await importEventAsync(eventUrl);
      setImportedEvent(eventData);
    } catch (err: any) {
      setError(err.message || 'Failed to import event');
    }
  };

  const handleSelectFromBrowse = (event: EventbriteEventData) => {
    setImportedEvent(event);
    setError(null);
    setDuplicateQuest(null);
  };

  const handleConfirm = () => {
    if (importedEvent) {
      onEventImported(importedEvent);
      handleClose();
    }
  };

  const handleViewExistingQuest = () => {
    if (existingQuest?.slug) {
      navigate(`/quests/${existingQuest.slug}`);
      handleClose();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setEventUrl('');
    setImportedEvent(null);
    setError(null);
    setDuplicateQuest(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img 
              src="https://www.eventbrite.com/favicon.ico" 
              alt="Eventbrite" 
              className="w-5 h-5"
            />
            Import from Eventbrite
          </DialogTitle>
          <DialogDescription>
            Import event details to quickly create an OpenClique quest.
          </DialogDescription>
        </DialogHeader>

        {!importedEvent ? (
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="gap-2">
                <Link2 className="h-4 w-4" />
                Paste URL
              </TabsTrigger>
              <TabsTrigger value="browse" className="gap-2">
                <Search className="h-4 w-4" />
                Browse Events
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="eventbrite-url">Eventbrite Event URL</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="eventbrite-url"
                      placeholder="https://www.eventbrite.com/e/your-event-123456789"
                      value={eventUrl}
                      onChange={(e) => setEventUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleImport} disabled={isImporting}>
                    {isImporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Import'
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <p className="text-xs text-muted-foreground">
                Paste the full URL of any public Eventbrite event. We'll import the title, 
                date, venue, and other details.
              </p>
            </TabsContent>

            <TabsContent value="browse" className="mt-4">
              <EventbriteBrowseTab 
                onSelectEvent={handleSelectFromBrowse}
                isCreatingQuest={false}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                {importedEvent.image_url && (
                  <img 
                    src={importedEvent.image_url} 
                    alt={importedEvent.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="font-display font-semibold text-lg mb-2">
                  {importedEvent.name}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {importedEvent.start_datetime 
                        ? format(new Date(importedEvent.start_datetime), 'PPp')
                        : 'Date TBD'}
                    </span>
                  </div>
                  {importedEvent.venue_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{importedEvent.venue_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    <span>
                      {importedEvent.is_free ? 'Free' : 'Ticketed Event'}
                    </span>
                    <a 
                      href={importedEvent.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto"
                    >
                      <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View on Eventbrite
                      </Badge>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Duplicate Check */}
            {checkingDuplicate ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking for existing quests...
              </div>
            ) : existingQuest ? (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="ml-2">
                  <span className="font-medium">This event already has a quest:</span> "{existingQuest.title}"
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={handleViewExistingQuest}>
                      View Existing Quest
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleConfirm}>
                      Create Another Quest
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Event data fetched successfully. Click "Create Quest" to continue 
                  setting up your OpenClique quest.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setImportedEvent(null)}>
                Import Different Event
              </Button>
              {!existingQuest && (
                <Button onClick={handleConfirm}>
                  Create Quest
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
