import { Target, Gift, Unlock, Star, Users } from "lucide-react";

const journeySteps = [
  {
    icon: Target,
    title: "First Quest",
    description: "Complete your first adventure",
  },
  {
    icon: Gift,
    title: "Starter Rewards",
    description: "Gift cards, swag kits, local discounts",
  },
  {
    icon: Unlock,
    title: "Unlock More",
    description: "New quests and storylines open up",
  },
  {
    icon: Star,
    title: "VIP Access",
    description: "Secret shows, priority spots, exclusive invites",
  },
  {
    icon: Users,
    title: "Alumni Network",
    description: "Join the community. Keep the connections.",
  },
];

export function UserJourneySection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Your Progression
            </h2>
            <p className="text-lg text-muted-foreground">
              Every quest completed opens new doors.
            </p>
          </div>

          {/* Journey Timeline */}
          <div className="relative">
            {/* Desktop: Horizontal layout */}
            <div className="hidden md:block">
              {/* Connector line - now more prominent */}
              <div className="absolute top-8 left-[10%] right-[10%] h-1 bg-gradient-to-r from-primary via-primary/80 to-accent rounded-full shadow-sm" />
              
              {/* Connector dots at each node */}
              <div className="absolute top-8 left-[10%] right-[10%] flex justify-between">
                {journeySteps.map((_, index) => (
                  <div 
                    key={index}
                    className="w-3 h-3 -mt-1 rounded-full bg-primary border-2 border-background shadow-md"
                  />
                ))}
              </div>
              
              <div className="grid grid-cols-5 gap-4">
                {journeySteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div 
                      key={step.title} 
                      className="relative flex flex-col items-center text-center"
                    >
                      {/* Icon node */}
                      <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-3 border-primary/40 flex items-center justify-center mb-4 shadow-lg">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      
                      {/* Step number badge */}
                      <span className="absolute top-0 right-1/2 translate-x-8 -translate-y-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                        {index + 1}
                      </span>
                      
                      {/* Text */}
                      <h3 className="font-display font-semibold text-foreground text-sm mb-1">
                        {step.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile: Vertical layout */}
            <div className="md:hidden">
              <div className="relative">
                {/* Vertical connector line - now more prominent */}
                <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/80 to-accent rounded-full" />
                
                <div className="space-y-6">
                  {journeySteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div 
                        key={step.title} 
                        className="relative flex items-start gap-4 pl-2"
                      >
                        {/* Icon node */}
                        <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/40 flex items-center justify-center shadow-lg">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        
                        {/* Step number badge */}
                        <span className="absolute top-0 left-8 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                          {index + 1}
                        </span>
                        
                        {/* Text */}
                        <div className="pt-1">
                          <h3 className="font-display font-semibold text-foreground text-sm mb-0.5">
                            {step.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UserJourneySection;
