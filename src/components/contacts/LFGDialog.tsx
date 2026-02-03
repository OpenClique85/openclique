/**
 * LFGDialog - Dialog for creating an LFG broadcast to contacts
 */

import { useState } from 'react';
import { useLFG } from '@/hooks/useLFG';
import { useContacts } from '@/hooks/useContacts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone, Users, Loader2, AlertCircle } from 'lucide-react';
import { addHours } from 'date-fns';

interface LFGDialogProps {
  questId: string;
  questTitle: string;
  questStartTime?: string;
  squadId?: string;
  maxSpots?: number;
  children?: React.ReactNode;
}

export function LFGDialog({ 
  questId, 
  questTitle, 
  questStartTime,
  squadId, 
  maxSpots = 5,
  children 
}: LFGDialogProps) {
  const [open, setOpen] = useState(false);
  const [spots, setSpots] = useState(1);
  const [message, setMessage] = useState('');
  const { createBroadcast } = useLFG();
  const { contacts } = useContacts();

  const handleSubmit = async () => {
    // Expire at quest start time or 24 hours from now
    const expiresAt = questStartTime 
      ? new Date(questStartTime)
      : addHours(new Date(), 24);
    
    await createBroadcast.mutateAsync({
      questId,
      squadId,
      spotsAvailable: spots,
      message: message || undefined,
      expiresAt,
    });
    
    setOpen(false);
    setMessage('');
    setSpots(1);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Megaphone className="h-4 w-4" />
            LFG
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Looking for Group
          </DialogTitle>
          <DialogDescription>
            Broadcast to your contacts that you're looking for people to join you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quest Info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{questTitle}</p>
          </div>

          {/* No Contacts Warning */}
          {contacts.length === 0 && (
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-600">No contacts yet</p>
                <p className="text-muted-foreground">
                  You don't have any contacts to notify. Add some contacts first!
                </p>
              </div>
            </div>
          )}

          {/* Recipients Preview */}
          {contacts.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Will notify {contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Spots Available */}
          <div className="space-y-2">
            <Label htmlFor="spots">How many spots are open?</Label>
            <Input
              id="spots"
              type="number"
              min={1}
              max={maxSpots}
              value={spots}
              onChange={(e) => setSpots(Math.max(1, Math.min(maxSpots, parseInt(e.target.value) || 1)))}
            />
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Add a message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Looking for 2 more for trivia night! We need someone good at sports..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/200
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createBroadcast.isPending || contacts.length === 0}
          >
            {createBroadcast.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Megaphone className="h-4 w-4 mr-2" />
            )}
            Send LFG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
