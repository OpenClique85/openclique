import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CancelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signupId: string;
  questTitle: string;
  onCancelled: () => void;
}

const CANCEL_REASONS = [
  { value: 'schedule', label: 'Schedule conflict' },
  { value: 'something_came_up', label: 'Something came up' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'other', label: 'Other' },
];

export function CancelModal({
  open,
  onOpenChange,
  signupId,
  questTitle,
  onCancelled
}: CancelModalProps) {
  const { toast } = useToast();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    setIsSubmitting(true);
    
    const reason = selectedReason === 'other' 
      ? otherReason.trim() || 'Other' 
      : CANCEL_REASONS.find(r => r.value === selectedReason)?.label || '';
    
    const { error } = await supabase
      .from('quest_signups')
      .update({
        status: 'dropped',
        cancellation_reason: reason
      })
      .eq('id', signupId);
    
    setIsSubmitting(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to cancel',
        description: 'Please try again or contact support.'
      });
      return;
    }
    
    // Trigger admin notification via edge function
    try {
      await supabase.functions.invoke('notify-admin', {
        body: { signupId, reason }
      });
    } catch {
      // Non-critical, continue anyway
    }
    
    toast({
      title: 'Quest cancelled',
      description: 'We\'re sorry to see you go. Hope to see you on another quest!'
    });
    
    onCancelled();
    onOpenChange(false);
    
    // Reset state
    setSelectedReason('');
    setOtherReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Can't make it?</DialogTitle>
          <DialogDescription>
            We're sorry to see you go! Cancelling your spot for <strong>{questTitle}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>What happened? (optional)</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="otherReason">Tell us more</Label>
              <Textarea
                id="otherReason"
                placeholder="What came up?"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                maxLength={200}
              />
            </div>
          )}
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:flex-1"
          >
            Never mind
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="sm:flex-1"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel my spot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
