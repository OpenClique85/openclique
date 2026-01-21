import { Link } from "react-router-dom";
import { 
  GraduationCap, 
  MapPin, 
  Home, 
  Palette, 
  Briefcase, 
  Heart,
  Building2,
  ClipboardList,
  ArrowRight
} from "lucide-react";

const individualPersonas = [
  {
    icon: GraduationCap,
    label: "Students",
    description: "Finding your people beyond the lecture hall",
  },
  {
    icon: MapPin,
    label: "Newcomers",
    description: "New to Austin, ready for real connections",
  },
  {
    icon: Home,
    label: "Remote Workers",
    description: "Craving IRL when your office is your couch",
  },
  {
    icon: Palette,
    label: "Hobby Explorers",
    description: "Meet people who share your niche interests",
  },
  {
    icon: Briefcase,
    label: "Coworkers",
    description: "Bond with your team outside the Slack channel",
  },
  {
    icon: Heart,
    label: "Empty Nesters",
    description: "Kids left. Time to build your next chapter",
  },
];

const organizationPersonas = [
  {
    icon: Building2,
    label: "Communities",
    description: "Keep members engaged between meetups",
  },
  {
    icon: ClipboardList,
    label: "Clubs & Orgs",
    description: "Structured rituals that reward commitment",
  },
];

export function WhoItsForSection() {
  return (
    <section className="py-16 md:py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">
              Who's OpenClique For?
            </h2>
            <p className="text-muted-foreground">
              If any of these sound like you, you're in the right place.
            </p>
          </div>

          {/* Individual Personas Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {individualPersonas.map((persona) => {
              const Icon = persona.icon;
              return (
                <div
                  key={persona.label}
                  className="group bg-card border border-border rounded-xl p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    
                    {/* Text */}
                    <div>
                      <h3 className="font-display font-semibold text-foreground mb-0.5">
                        {persona.label}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {persona.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Organizations Sub-section */}
          <div className="border-t border-border pt-8">
            <p className="text-sm font-medium text-muted-foreground text-center mb-4">
              For Organizations
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              {organizationPersonas.map((persona) => {
                const Icon = persona.icon;
                return (
                  <Link
                    key={persona.label}
                    to="/partners"
                    className="group bg-card border border-border rounded-xl p-5 transition-all duration-200 hover:border-accent/30 hover:shadow-md hover:shadow-accent/5 hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
                        <Icon className="w-5 h-5 text-accent-foreground" />
                      </div>
                      
                      {/* Text */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display font-semibold text-foreground mb-0.5">
                            {persona.label}
                          </h3>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-accent-foreground transition-all -translate-x-1 group-hover:translate-x-0" />
                        </div>
                        <p className="text-sm text-muted-foreground leading-snug">
                          {persona.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* B2B Callout */}
            <div className="text-center mt-6">
              <Link 
                to="/partners" 
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent-foreground transition-colors group"
              >
                <span>Own a venue or brand?</span>
                <span className="font-medium underline underline-offset-2 decoration-accent/50 group-hover:decoration-accent">
                  See how we partner
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhoItsForSection;
