import { Link } from "react-router-dom";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import sunsetGathering from "@/assets/austin/sunset-gathering.jpg";

export function CTASection() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Dynamic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(240_33%_14%)] via-[hsl(240_33%_18%)] to-[hsl(291_40%_20%)]" />
      
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `url(${sunsetGathering})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Subtle glow orbs for depth */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to find your clique?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Join a quest and meet your people IRL.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="btn-glow w-full sm:w-auto text-base px-8 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200 shadow-lg"
            >
              <Link to="/auth">Join Now</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto text-base px-8 bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/50 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm"
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
