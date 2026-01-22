import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  business_name: z.string().min(2, 'Business name is required'),
  sponsor_type: z.enum(['brand', 'venue', 'both']),
  contact_name: z.string().min(2, 'Contact name is required'),
  contact_email: z.string().email('Valid email is required'),
  website: z.string().url('Valid URL required').optional().or(z.literal('')),
  description: z.string().optional(),
  preferred_quest_types: z.array(z.string()).optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const QUEST_TYPES = [
  { value: 'culture', label: 'Culture & Arts' },
  { value: 'wellness', label: 'Wellness & Fitness' },
  { value: 'connector', label: 'Social & Connector' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'outdoor', label: 'Outdoor & Adventure' },
  { value: 'music', label: 'Music & Entertainment' },
];

interface SponsorApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedType?: 'brand' | 'venue' | 'both';
}

export function SponsorApplicationForm({ 
  open, 
  onOpenChange, 
  preselectedType 
}: SponsorApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedQuestTypes, setSelectedQuestTypes] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sponsor_type: preselectedType || 'brand',
      preferred_quest_types: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('sponsor_applications')
        .insert({
          business_name: data.business_name,
          sponsor_type: data.sponsor_type,
          contact_name: data.contact_name,
          contact_email: data.contact_email,
          website: data.website || null,
          description: data.description || null,
          preferred_quest_types: selectedQuestTypes,
          message: data.message || null,
        });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setIsSuccess(false);
    setSelectedQuestTypes([]);
    onOpenChange(false);
  };

  const toggleQuestType = (value: string) => {
    setSelectedQuestTypes(prev => 
      prev.includes(value) 
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Application Received!</h3>
            <p className="text-muted-foreground mb-6">
              We'll review your application and get back to you within 2-3 business days.
            </p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Become a Sponsor</DialogTitle>
              <DialogDescription>
                Partner with OpenClique to reach engaged local audiences through authentic experiences.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  {...register('business_name')}
                  placeholder="Your brand or venue name"
                />
                {errors.business_name && (
                  <p className="text-sm text-destructive">{errors.business_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsor_type">Sponsor Type *</Label>
                <Select
                  defaultValue={preselectedType || 'brand'}
                  onValueChange={(value) => setValue('sponsor_type', value as 'brand' | 'venue' | 'both')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brand">Brand (Products/Services)</SelectItem>
                    <SelectItem value="venue">Venue (Physical Location)</SelectItem>
                    <SelectItem value="both">Both Brand & Venue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name *</Label>
                  <Input
                    id="contact_name"
                    {...register('contact_name')}
                    placeholder="Your name"
                  />
                  {errors.contact_name && (
                    <p className="text-sm text-destructive">{errors.contact_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    {...register('contact_email')}
                    placeholder="you@company.com"
                  />
                  {errors.contact_email && (
                    <p className="text-sm text-destructive">{errors.contact_email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...register('website')}
                  placeholder="https://yourcompany.com"
                />
                {errors.website && (
                  <p className="text-sm text-destructive">{errors.website.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">What do you offer?</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Tell us about your brand/venue and what you can offer quest participants..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Quest Types</Label>
                <div className="grid grid-cols-2 gap-2">
                  {QUEST_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedQuestTypes.includes(type.value)}
                        onCheckedChange={() => toggleQuestType(type.value)}
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Additional Message</Label>
                <Textarea
                  id="message"
                  {...register('message')}
                  placeholder="Anything else you'd like us to know?"
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
