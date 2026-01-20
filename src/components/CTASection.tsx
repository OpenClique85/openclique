import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import buggsIcon from "@/assets/buggs-icon.png";
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
          {/* BUGGS icon accent */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <img src={buggsIcon} alt="" className="w-8 h-8 object-contain" />
            </div>
          </div>
          
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready for your first quest?
          </h2>
          <p className="text-background/70 text-lg mb-8 max-w-2xl mx-auto">
            Join the Austin pilot and be among the first to experience connection, reimagined.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto text-base px-8 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/pilot">Join the Pilot</Link>
            </Button>
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto text-base px-8 bg-sunset text-sunset-foreground hover:bg-sunset/90"
            >
              <Link to="/partners">Partner With Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
