import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import sunsetGathering from "@/assets/austin/sunset-gathering.jpg";
import { WaitlistModal } from "@/components/WaitlistModal";

export function CTASection() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <>
      <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
      <section className="py-16 md:py-24 bg-foreground text-background relative overflow-hidden">
        {/* Background image with overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${sunsetGathering})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-foreground/80" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to find your clique?
            </h2>
            <p className="text-background/70 text-lg mb-8 max-w-2xl mx-auto">
              Join the waitlist and be first to know when we open new spots.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => setWaitlistOpen(true)}
                className="w-full sm:w-auto text-base px-8 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200"
              >
                Join the Waitlist
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto text-base px-8 bg-white text-foreground border-white hover:bg-white/90 hover:scale-[1.02] transition-all duration-200"
              >
                <Link to="/auth?signup=true">
                  <KeyRound className="mr-2 h-5 w-5" />
                  Beta Access
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                asChild
                className="w-full sm:w-auto text-base px-8 text-background/80 hover:text-background hover:bg-background/10 hover:scale-[1.02] transition-all duration-200"
              >
                <Link to="/install">
                  <Smartphone className="mr-2 h-5 w-5" />
                  Download App
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-background/60">
              Already have an account?{" "}
              <Link to="/auth" className="text-background hover:underline font-medium">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
