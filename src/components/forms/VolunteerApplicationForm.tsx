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
  role_interest: z.string().optional(),
  experience: z.string().optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface VolunteerApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedRole?: string;
}

const ROLES = [
  { value: "community_host", label: "Community Host" },
  { value: "contributor", label: "Contributor (Design, Code, Content)" },
  { value: "campus_ambassador", label: "Campus Ambassador" },
  { value: "other", label: "Other / Not sure yet" },
];

export function VolunteerApplicationForm({
  open,
  onOpenChange,
  preselectedRole,
}: VolunteerApplicationFormProps) {
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
      role_interest: preselectedRole || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("volunteer_applications" as any).insert({
        name: data.name,
        email: data.email,
        role_interest: data.role_interest || null,
        experience: data.experience || null,
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
            {isSuccess ? "Application Received!" : "Join the Team"}
          </DialogTitle>
          <DialogDescription>
            {isSuccess
              ? "We'll review your application and reach out soon."
              : "Tell us about yourself and how you'd like to contribute."}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center py-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <p className="text-center text-muted-foreground">
              Thanks for your interest in joining us! We'll be in touch soon.
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
              <Label>What role interests you?</Label>
              <Select
                defaultValue={preselectedRole}
                onValueChange={(value) => setValue("role_interest", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Relevant Experience (optional)</Label>
              <Input
                id="experience"
                placeholder="e.g., event planning, design, marketing..."
                {...register("experience")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Why do you want to join? (optional)
              </Label>
              <Textarea
                id="message"
                placeholder="Tell us what excites you about OpenClique..."
                rows={3}
                {...register("message")}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
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
