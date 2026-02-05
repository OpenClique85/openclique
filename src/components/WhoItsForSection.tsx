import { useState } from "react";
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
  ArrowRight,
  LucideIcon
} from "lucide-react";
import { WHO_ITS_FOR } from "@/constants/content";
import { PersonaModal, type PersonaData } from "@/components/PersonaModal";

// Icon mapping for dynamic icon resolution
const iconMap: Record<string, LucideIcon> = {
  GraduationCap,
  MapPin,
  Home,
  Palette,
  Briefcase,
  Heart,
  Building2,
  ClipboardList,
};

export function WhoItsForSection() {
  const [selectedPersona, setSelectedPersona] = useState<PersonaData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handlePersonaClick = (persona: typeof WHO_ITS_FOR.individualPersonas[0]) => {
    const Icon = iconMap[persona.icon];
    if (Icon) {
      setSelectedPersona({
        ...persona,
        icon: Icon,
      });
      setModalOpen(true);
    }
  };

  const handleOrgPersonaClick = (persona: typeof WHO_ITS_FOR.organizationPersonas[0]) => {
    const Icon = iconMap[persona.icon];
    if (Icon) {
      setSelectedPersona({
        ...persona,
        icon: Icon,
      });
      setModalOpen(true);
    }
  };

  return (
    <section className="py-16 md:py-20 bg-muted/50 texture-overlay">
      <div className="container mx-auto px-4 relative z-10">
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
            {WHO_ITS_FOR.individualPersonas.map((persona) => {
              const Icon = iconMap[persona.icon];
              if (!Icon) return null;
              return (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaClick(persona)}
                  className="card-glow group bg-card border border-border rounded-xl p-5 transition-all duration-300 hover:border-primary/40 hover:-translate-y-2 text-left cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon with gradient */}
                    <div className="icon-gradient flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-md">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-semibold text-foreground mb-0.5">
                          {persona.label}
                        </h3>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all -translate-x-1 group-hover:translate-x-0" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {persona.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Organizations Sub-section */}
          <div className="border-t border-border pt-8">
            <p className="text-sm font-medium text-muted-foreground text-center mb-4">
              For Organizations
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              {WHO_ITS_FOR.organizationPersonas.map((persona) => {
                const Icon = iconMap[persona.icon];
                if (!Icon) return null;
                return (
                  <button
                    key={persona.id}
                    onClick={() => handleOrgPersonaClick(persona)}
                    className="group bg-card border border-border rounded-xl p-5 transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-1 cursor-pointer text-left"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
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
                  </button>
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

      {/* Persona Modal */}
      <PersonaModal
        persona={selectedPersona}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </section>
  );
}

export default WhoItsForSection;
