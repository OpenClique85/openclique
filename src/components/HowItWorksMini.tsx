import { Link } from "react-router-dom";
import { UserPlus, Mail, Users } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign up & get matched",
    description: "Tell us your interests. We find your squad.",
  },
  {
    icon: Mail,
    title: "Receive your quest",
    description: "A curated adventure lands in your inbox.",
  },
  {
    icon: Users,
    title: "Show up & earn",
    description: "Complete quests. Unlock rewards.",
  },
];

export function HowItWorksMini() {
  return (
    <section className="py-16 md:py-20 bg-muted/30 relative">
      {/* Top divider */}
      <div className="section-divider absolute top-0 left-0 right-0" />
      
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
            {/* Connecting line between steps (desktop) */}
            <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20" />
            
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="group flex flex-col items-center text-center relative">
                  {/* Step number + icon */}
                  <div className="relative mb-5">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 relative z-10 border-2 border-background">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center group-hover:scale-110 transition-transform duration-300 z-20">
                      {index + 1}
                    </span>
                  </div>
                  
                  {/* Text */}
                  <h3 className="font-display font-semibold text-foreground mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
          
          {/* Learn more link */}
          <div className="text-center mt-10">
            <Link 
              to="/how-it-works" 
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Learn more about how it works →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
