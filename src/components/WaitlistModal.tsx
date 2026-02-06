/**
 * =============================================================================
 * WAITLIST MODAL - Email capture for pre-launch signups
 * =============================================================================
 * 
 * Opens when users click "Join the Waitlist" on homepage.
 * Captures email + optional info, stores in public.waitlist table.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email").max(255),
  name: z.string().max(100).optional(),
  interest: z.array(z.string()).optional(),
  referral_source: z.string().max(200).optional(),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INTEREST_OPTIONS = [
  { id: "new-to-town", label: "New to Austin, looking to meet people" },
  { id: "remote-worker", label: "Remote worker seeking IRL connections" },
  { id: "hobbies", label: "Looking for hobby/activity groups" },
  { id: "curious", label: "Just curious about the concept" },
];

export function WaitlistModal({ open, onOpenChange }: WaitlistModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
  });

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true);
    try {
      const interestString = selectedInterests
        .map((id) => INTEREST_OPTIONS.find((o) => o.id === id)?.label)
        .filter(Boolean)
        .join("; ");

      const { error } = await supabase.from("waitlist").insert({
        email: data.email.toLowerCase().trim(),
        name: data.name?.trim() || null,
        interest: interestString || null,
        referral_source: data.referral_source?.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          toast.error("You're already on the waitlist!");
        } else {
          throw error;
        }
      } else {
        setIsSuccess(true);
        reset();
        setSelectedInterests([]);
      }
    } catch (error) {
      console.error("Waitlist signup error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset success state after animation
    setTimeout(() => {
      setIsSuccess(false);
      reset();
      setSelectedInterests([]);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          // Success state
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl">You're in! 🎉</DialogTitle>
              <DialogDescription className="mt-2">
                We'll let you know when we're ready to welcome you. Keep an eye
                on your inbox for updates and early access.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground">In the meantime:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Follow us on Instagram for Austin event highlights</li>
                <li>• Browse upcoming quests (no account needed)</li>
              </ul>
              <Button asChild className="mt-4 w-full">
                <Link to="/quests" onClick={handleClose}>
                  Browse Quests →
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          // Form state
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <DialogTitle>Join the Waitlist</DialogTitle>
              </div>
              <DialogDescription>
                We're launching in Austin. Be the first to know when we open up
                new spots.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              {/* Email - Required */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="yourname@email.com"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Name - Optional */}
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="First name or nickname"
                  {...register("name")}
                />
              </div>

              {/* Interests - Checkboxes */}
              <div className="space-y-2">
                <Label>What brings you to OpenClique?</Label>
                <div className="space-y-2">
                  {INTEREST_OPTIONS.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <Checkbox
                        id={option.id}
                        checked={selectedInterests.includes(option.id)}
                        onCheckedChange={() => toggleInterest(option.id)}
                      />
                      <label
                        htmlFor={option.id}
                        className="text-sm cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral Source - Optional */}
              <div className="space-y-2">
                <Label htmlFor="referral_source">
                  How did you hear about us? (optional)
                </Label>
                <Input
                  id="referral_source"
                  placeholder="Friend referral, Instagram, etc."
                  {...register("referral_source")}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join the Waitlist"
                )}
              </Button>

              {/* Invite code link */}
              <p className="text-center text-sm text-muted-foreground">
                Have an invite code?{" "}
                <Link
                  to="/auth?signup=true"
                  className="text-primary hover:underline"
                  onClick={handleClose}
                >
                  Enter it here →
                </Link>
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
