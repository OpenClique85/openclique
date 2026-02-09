import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import sunsetGathering from "@/assets/austin/sunset-gathering.jpg";
import { WaitlistModal } from "@/components/WaitlistModal";

export function CTASection() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <>
      <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
      <section className="py-20 md:py-28 bg-foreground text-background relative overflow-hidden">
        {/* Background image */}
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
            
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-5">
              Ready to find your clique?
            </h2>
            <p className="text-background/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Join the waitlist and be first to know when we open new spots.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => setWaitlistOpen(true)}
                className="w-full sm:w-auto text-base px-10 py-6 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200 shadow-lg shadow-primary/30"
              >
                Join the Waitlist
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto text-base px-8 py-6 border-background/40 text-background hover:bg-background/10 hover:border-background/60 hover:scale-[1.02] transition-all duration-200"
              >
                <Link to="/quests">
                  Explore Quests
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-background/50">
              Already have an account?{" "}
              <Link to="/auth" className="text-background/80 hover:text-background hover:underline font-medium">
                Sign in
              </Link>
              {" · "}
              <Link to="/auth?signup=true" className="text-background/80 hover:text-background hover:underline font-medium">
                Beta Access
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
