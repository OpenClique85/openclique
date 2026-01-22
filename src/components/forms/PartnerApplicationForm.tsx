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
  business_name: z.string().min(2, "Business name is required"),
  contact_name: z.string().min(2, "Your name is required"),
  contact_email: z.string().email("Please enter a valid email"),
  category: z.string().optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PartnerApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedCategory?: string;
}

const CATEGORIES = [
  { value: "venues", label: "Venue (bars, cafes, restaurants)" },
  { value: "brands", label: "Brand (product company)" },
  { value: "apartments", label: "Apartments & HOAs" },
  { value: "corporate", label: "Corporate Teams" },
  { value: "communities", label: "Community Organization" },
  { value: "founders", label: "Founder / Startup" },
  { value: "other", label: "Other" },
];

export function PartnerApplicationForm({
  open,
  onOpenChange,
  preselectedCategory,
}: PartnerApplicationFormProps) {
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
      category: preselectedCategory || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("partner_applications" as any).insert({
        business_name: data.business_name,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        category: data.category || null,
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
            {isSuccess ? "Application Received!" : "Partner With OpenClique"}
          </DialogTitle>
          <DialogDescription>
            {isSuccess
              ? "We'll review your application and reach out within 48 hours."
              : "Tell us about your organization and how we can work together."}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center py-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <p className="text-center text-muted-foreground">
              Thanks for your interest! We're excited to explore how we can
              create amazing experiences together.
            </p>
            <Button onClick={handleClose} className="mt-2">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business / Organization Name</Label>
              <Input
                id="business_name"
                placeholder="Your company or org"
                {...register("business_name")}
              />
              {errors.business_name && (
                <p className="text-sm text-destructive">
                  {errors.business_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Your Name</Label>
              <Input
                id="contact_name"
                placeholder="First and last name"
                {...register("contact_name")}
              />
              {errors.contact_name && (
                <p className="text-sm text-destructive">
                  {errors.contact_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="you@company.com"
                {...register("contact_email")}
              />
              {errors.contact_email && (
                <p className="text-sm text-destructive">
                  {errors.contact_email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                defaultValue={preselectedCategory}
                onValueChange={(value) => setValue("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Anything else you'd like us to know?
              </Label>
              <Textarea
                id="message"
                placeholder="Tell us about your goals, ideas, or questions..."
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
