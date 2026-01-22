import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
            Ready to find your quest?
          </h2>
          <p className="text-background/70 text-lg mb-8 max-w-2xl mx-auto">
            Browse open quests and join your first adventure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto text-base px-8 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/quests">Find Your Quest</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base px-8 bg-sunset text-sunset-foreground hover:bg-sunset/90"
                >
                  Get Involved
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/creators" className="w-full cursor-pointer">
                    For Creators
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/partners" className="w-full cursor-pointer">
                    Partner With Us
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/work-with-us" className="w-full cursor-pointer">
                    Work With Us
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </section>
  );
}
