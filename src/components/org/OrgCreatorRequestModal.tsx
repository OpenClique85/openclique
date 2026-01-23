/**
 * OrgCreatorRequestModal - Submit quest proposals from org to creator
 * Org admins can request custom quests with budget, theme, dates, etc.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createNotification } from '@/lib/notifications';

const requestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Please provide more details (at least 20 characters)'),
  questTheme: z.string().min(1, 'Please select a theme'),
  preferredDates: z.string().optional(),
  budgetRange: z.string().optional(),
  estimatedParticipants: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface Creator {
  id: string;
  user_id: string;
  display_name: string;
  photo_url: string | null;
  bio: string | null;
}

interface Organization {
  id: string;
  name: string;
}

interface OrgCreatorRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: Creator;
  org: Organization;
  memberCount: number;
}

const QUEST_THEMES = [
  { value: 'social', label: '🎉 Social / Mixer' },
  { value: 'outdoor', label: '🌲 Outdoor Adventure' },
  { value: 'wellness', label: '🧘 Wellness / Fitness' },
  { value: 'culture', label: '🎭 Arts & Culture' },
  { value: 'food', label: '🍕 Food & Drink' },
  { value: 'volunteer', label: '🤝 Volunteering' },
  { value: 'professional', label: '💼 Professional Development' },
  { value: 'custom', label: '✨ Custom / Other' },
];

const BUDGET_RANGES = [
  { value: 'free', label: 'Free (no budget)' },
  { value: 'low', label: '$1-50 per person' },
  { value: 'medium', label: '$50-100 per person' },
  { value: 'high', label: '$100+ per person' },
  { value: 'sponsorship', label: 'Looking for sponsored options' },
];

export function OrgCreatorRequestModal({
  isOpen,
  onClose,
  creator,
  org,
  memberCount,
}: OrgCreatorRequestModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      description: '',
      questTheme: '',
      preferredDates: '',
      budgetRange: '',
      estimatedParticipants: '',
    },
  });

  const handleSubmit = async (values: RequestFormValues) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Insert the request
      const { error: insertError } = await supabase
        .from('org_creator_requests')
        .insert({
          org_id: org.id,
          creator_id: creator.id,
          requester_id: user.id,
          title: values.title,
          description: values.description,
          quest_theme: values.questTheme,
          preferred_dates: values.preferredDates || null,
          budget_range: values.budgetRange || null,
          estimated_participants: values.estimatedParticipants 
            ? parseInt(values.estimatedParticipants) 
            : null,
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Notify the creator
      await createNotification({
        userId: creator.user_id,
        type: 'org_creator_request',
        title: `📬 Quest Request from ${org.name}`,
        body: `${org.name} wants you to create "${values.title}" for their ${memberCount} members. Tap to review.`,
      });

      toast({
        title: 'Request sent!',
        description: `${creator.display_name} has been notified of your quest request.`,
      });

      form.reset();
      onClose();
    } catch (error: any) {
      console.error('Failed to submit request:', error);
      toast({
        title: 'Failed to send request',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Request a Quest
          </DialogTitle>
          <DialogDescription>
            Ask {creator.display_name} to create a custom quest for {org.name}
          </DialogDescription>
        </DialogHeader>

        {/* Creator preview */}
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <Avatar className="h-12 w-12">
            <AvatarImage src={creator.photo_url || undefined} />
            <AvatarFallback>{creator.display_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{creator.display_name}</p>
            {creator.bio && (
              <p className="text-sm text-muted-foreground line-clamp-1">{creator.bio}</p>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quest Title / Idea</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Team bonding hike at Barton Creek" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="questTheme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quest Theme</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a theme..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {QUEST_THEMES.map((theme) => (
                        <SelectItem key={theme.value} value={theme.value}>
                          {theme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details & Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell the creator about your org, what you're looking for, any special requirements..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include your org's vibe, member interests, and any logistics
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimatedParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Attendees</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 25" 
                        min={1}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredDates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Dates</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Feb 15-28" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="budgetRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Range</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUDGET_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
