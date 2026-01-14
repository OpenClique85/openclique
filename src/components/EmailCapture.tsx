import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EMAIL_CAPTURE, ZAPIER_WEBHOOK_URL } from "@/constants/content";
import { trackEmailCapture } from "@/lib/tracking";
import { useToast } from "@/hooks/use-toast";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Track the email capture event (non-PII)
      await trackEmailCapture("homepage");

      // Send to Zapier webhook with email (PII - stored securely by Zapier)
      if (ZAPIER_WEBHOOK_URL && !ZAPIER_WEBHOOK_URL.includes("YOUR_WEBHOOK_ID")) {
        await fetch(ZAPIER_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "no-cors",
          body: JSON.stringify({
            event_type: "email_signup",
            email,
            timestamp: new Date().toISOString(),
            source: "homepage_capture",
          }),
        });
      }

      setIsSubmitted(true);
      setEmail("");
      toast({
        title: "You're in!",
        description: EMAIL_CAPTURE.successMessage,
      });
    } catch (error) {
      console.error("Email capture error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              You're on the list!
            </h3>
            <p className="text-muted-foreground">
              {EMAIL_CAPTURE.successMessage}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
            {EMAIL_CAPTURE.title}
          </h3>
          <p className="text-muted-foreground mb-8">
            {EMAIL_CAPTURE.description}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder={EMAIL_CAPTURE.placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Subscribing..." : EMAIL_CAPTURE.buttonText}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-4">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
