/**
 * EventbriteImportModal - Modal for importing events from Eventbrite
 */

import { useState } from 'react';
import { useEventbrite } from '@/hooks/useEventbrite';
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
import { Loader2, Link2, Calendar, MapPin, Ticket, Check, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface EventbriteImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventImported: (eventData: any) => void;
}

export function EventbriteImportModal({
  open,
  onOpenChange,
  onEventImported,
}: EventbriteImportModalProps) {
  const { isConnected, importEventAsync, isImporting, startOAuthFlow } = useEventbrite();
  const [eventUrl, setEventUrl] = useState('');
  const [importedEvent, setImportedEvent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!eventUrl.trim()) {
      setError('Please enter an Eventbrite URL');
      return;
    }

    setError(null);
    try {
      const eventData = await importEventAsync(eventUrl);
      setImportedEvent(eventData);
    } catch (err: any) {
      setError(err.message || 'Failed to import event');
    }
  };

  const handleConfirm = () => {
    if (importedEvent) {
      onEventImported(importedEvent);
      onOpenChange(false);
      setEventUrl('');
      setImportedEvent(null);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setEventUrl('');
    setImportedEvent(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
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
            Import event details from an Eventbrite event page.
          </DialogDescription>
        </DialogHeader>

        {!isConnected ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              Connect your Eventbrite account to import events automatically.
            </p>
            <Button onClick={startOAuthFlow}>
              Connect Eventbrite
            </Button>
          </div>
        ) : !importedEvent ? (
          <div className="space-y-4">
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
          </div>
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
                    <Badge variant="outline" className="ml-auto">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Buy on Eventbrite
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Event data fetched successfully. Click "Create Quest" to continue 
                setting up your OpenClique quest.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setImportedEvent(null)}>
                Import Different Event
              </Button>
              <Button onClick={handleConfirm}>
                Create Quest
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
