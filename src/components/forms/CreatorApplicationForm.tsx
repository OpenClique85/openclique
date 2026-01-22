import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, "Your name is required"),
  email: z.string().email("Please enter a valid email"),
  creator_type: z.string().optional(),
  social_handle: z.string().optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreatorApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedType?: string;
}

const CREATOR_TYPES = [
  { value: "content_creator", label: "Content Creator / Influencer" },
  { value: "quest_creator", label: "Quest Creator (host local experiences)" },
  { value: "fitness", label: "Fitness & Wellness" },
  { value: "food", label: "Food & Lifestyle" },
  { value: "music", label: "Musician / DJ" },
  { value: "podcaster", label: "Podcaster" },
  { value: "educator", label: "Educator / Coach" },
  { value: "other", label: "Other" },
];

export function CreatorApplicationForm({
  open,
  onOpenChange,
  preselectedType,
}: CreatorApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creator_type: preselectedType || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const socialLinks = data.social_handle
        ? { primary: data.social_handle }
        : {};

      const { error } = await supabase.from("creator_applications" as any).insert({
        name: data.name,
        email: data.email,
        creator_type: data.creator_type || null,
        social_links: socialLinks,
        message: data.message || null,
      } as any);

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isSuccess ? "Application Received!" : "Become a Creator Partner"}
          </DialogTitle>
          <DialogDescription>
            {isSuccess
              ? "We'll review your application and reach out within 48 hours."
              : "Tell us about yourself and how you want to engage your community."}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center py-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-creator/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-creator" />
            </div>
            <p className="text-center text-muted-foreground">
              Thanks for applying! We're excited to help you bring your
              community together IRL.
            </p>
            <Button onClick={handleClose} className="mt-2">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="First and last name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>What type of creator are you?</Label>
              <Select
                defaultValue={preselectedType}
                onValueChange={(value) => setValue("creator_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {CREATOR_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="social_handle">
                Primary Social Handle (optional)
              </Label>
              <Input
                id="social_handle"
                placeholder="@yourhandle or link"
                {...register("social_handle")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Tell us about your community (optional)
              </Label>
              <Textarea
                id="message"
                placeholder="What kind of experiences would you create? What's your audience like?"
                rows={3}
                {...register("message")}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-creator text-creator-foreground hover:bg-creator/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
