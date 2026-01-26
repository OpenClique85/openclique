/**
 * CreateReadyCheckModal - Modal for creating a ready check
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Zap } from 'lucide-react';

interface CreateReadyCheckModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, expiresInMinutes: number) => Promise<boolean | undefined>;
  isCreating: boolean;
}

export function CreateReadyCheckModal({ 
  open, 
  onClose, 
  onCreate, 
  isCreating 
}: CreateReadyCheckModalProps) {
  const [title, setTitle] = useState('');
  const [expiresIn, setExpiresIn] = useState('60');

  const handleSubmit = async () => {
    if (!title.trim()) return;

    const success = await onCreate(
      title.trim(),
      parseInt(expiresIn) || 60
    );

    if (success) {
      setTitle('');
      setExpiresIn('60');
      onClose();
    }
  };

  const presetTitles = [
    "Are we still on for this?",
    "Who's coming tonight?",
    "Ready to meet up?",
    "Can everyone make it?",
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Ready Check
          </DialogTitle>
          <DialogDescription>
            Quick pulse check with your clique - see who's in, maybe, or out
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">What's the check for?</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Who's in for Saturday?"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Quick options:</Label>
            <div className="flex flex-wrap gap-2">
              {presetTitles.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setTitle(preset)}
                  className="text-xs"
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires">Expires in (minutes)</Label>
            <div className="flex gap-2">
              {['30', '60', '120', '1440'].map((mins) => (
                <Button
                  key={mins}
                  variant={expiresIn === mins ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExpiresIn(mins)}
                >
                  {mins === '1440' ? '24h' : `${mins}m`}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-1" />
                Send Ready Check
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
