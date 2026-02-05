import { Link } from "react-router-dom";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import sunsetGathering from "@/assets/austin/sunset-gathering.jpg";

export function CTASection() {
  return (
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
            Join a quest and meet your people IRL.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto text-base px-8 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/auth">Join Now</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto text-base px-8 border-white text-white bg-white/10 hover:bg-white/20"
            >
              <Link to="/install">
                <Smartphone className="mr-2 h-5 w-5" />
                Download App
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
