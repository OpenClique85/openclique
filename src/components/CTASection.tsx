import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-foreground text-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
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
