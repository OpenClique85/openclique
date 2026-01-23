/**
 * =============================================================================
 * SUPPORT TICKET MODAL
 * User-facing form to submit support tickets with smart context detection
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useIssueCategories, useCreateTicket, useUploadAttachment } from '@/hooks/useSupportTickets';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, AlertTriangle, CheckCircle2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Smart context props (auto-filled based on where modal is opened)
  contextQuestId?: string | null;
  contextQuestTitle?: string | null;
  contextSquadId?: string | null;
  contextSquadName?: string | null;
}

type TicketUrgency = 'low' | 'medium' | 'urgent';

const URGENCY_OPTIONS: { value: TicketUrgency; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'General question or minor issue' },
  { value: 'medium', label: 'Medium', description: 'Affecting my experience but not urgent' },
  { value: 'urgent', label: 'Urgent', description: 'Safety concern or blocking issue' },
];

const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf'];

export function SupportTicketModal({
  open,
  onOpenChange,
  contextQuestId,
  contextQuestTitle,
  contextSquadId,
  contextSquadName,
}: SupportTicketModalProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: categories, isLoading: categoriesLoading } = useIssueCategories();
  const createTicket = useCreateTicket();
  const uploadAttachment = useUploadAttachment();

  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [urgency, setUrgency] = useState<TicketUrgency>('medium');
  const [description, setDescription] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setCategoryId('');
      setUrgency('medium');
      setDescription('');
      setPendingFiles([]);
      setSubmitted(false);
      setTicketId(null);
    }
  }, [open]);

  // Auto-escalate urgency for safety categories
  useEffect(() => {
    if (categoryId && categories) {
      const category = categories.find(c => c.id === categoryId);
      if (category?.requires_escalation) {
        setUrgency('urgent');
      }
    }
  }, [categoryId, categories]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Only PNG, JPEG, GIF, and PDF files are allowed.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File too large',
          description: 'Files must be under 5MB.',
          variant: 'destructive',
        });
        return;
      }
    }

    setPendingFiles(prev => {
      const combined = [...prev, ...files];
      return combined.slice(0, MAX_ATTACHMENTS);
    });
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to submit a support ticket.',
        variant: 'destructive',
      });
      return;
    }

    if (!categoryId || !description.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please select a category and describe your issue.',
        variant: 'destructive',
      });
      return;
    }

    if (description.length < 10) {
      toast({
        title: 'Description too short',
        description: 'Please provide at least 10 characters describing your issue.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the ticket
      const ticket = await createTicket.mutateAsync({
        category_id: categoryId,
        urgency,
        description: description.trim(),
        related_quest_id: contextQuestId,
        related_squad_id: contextSquadId,
        submitted_from_page: location.pathname,
        metadata: {
          user_agent: navigator.userAgent,
          context_quest_title: contextQuestTitle,
          context_squad_name: contextSquadName,
        },
      });

      // Upload attachments
      for (const file of pendingFiles) {
        await uploadAttachment.mutateAsync({
          ticketId: ticket.id,
          file,
        });
      }

      setTicketId(ticket.id);
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to create ticket:', error);
      toast({
        title: 'Something went wrong',
        description: 'We couldn\'t submit your ticket. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories?.find(c => c.id === categoryId);

  // Success state
  if (submitted && ticketId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl mb-2">Ticket Submitted</DialogTitle>
            <DialogDescription className="mb-4">
              We've received your support request and will get back to you soon.
            </DialogDescription>
            <p className="text-sm text-muted-foreground mb-6">
              Ticket ID: <code className="bg-muted px-2 py-0.5 rounded">{ticketId.slice(0, 8)}</code>
            </p>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Get Help</DialogTitle>
          <DialogDescription>
            Tell us what's going on and we'll help you out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Context Banner */}
          {(contextQuestTitle || contextSquadName) && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">Related to: </span>
              {contextQuestTitle && <span className="font-medium">{contextQuestTitle}</span>}
              {contextSquadName && <span className="font-medium">{contextSquadName}</span>}
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">What's this about? *</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={categoriesLoading}>
              <SelectTrigger id="category">
                <SelectValue placeholder={categoriesLoading ? 'Loading...' : 'Select a category'} />
              </SelectTrigger>
              <SelectContent>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      {cat.requires_escalation && (
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      )}
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Urgency */}
          <div className="space-y-3">
            <Label>How urgent is this? *</Label>
            <RadioGroup
              value={urgency}
              onValueChange={(v) => setUrgency(v as TicketUrgency)}
              className="grid gap-2"
              disabled={selectedCategory?.requires_escalation}
            >
              {URGENCY_OPTIONS.map(opt => (
                <div
                  key={opt.value}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                    urgency === opt.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                    selectedCategory?.requires_escalation && opt.value !== 'urgent' && 'opacity-50'
                  )}
                  onClick={() => !selectedCategory?.requires_escalation && setUrgency(opt.value)}
                >
                  <RadioGroupItem value={opt.value} id={opt.value} />
                  <div className="flex-1">
                    <Label htmlFor={opt.value} className="cursor-pointer font-medium">
                      {opt.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
            {selectedCategory?.requires_escalation && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                This category requires urgent attention
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Describe the issue *</Label>
            <Textarea
              id="description"
              placeholder="What happened? What were you trying to do? Any error messages?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/2000
            </p>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Screenshots (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map((file, i) => (
                <div
                  key={i}
                  className="relative group bg-muted rounded-lg p-2 flex items-center gap-2 pr-8"
                >
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[120px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-background"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {pendingFiles.length < MAX_ATTACHMENTS && (
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Add image</span>
                  <input
                    type="file"
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Up to 3 files, 5MB each. PNG, JPEG, GIF, or PDF.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !categoryId || !description.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Ticket'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
