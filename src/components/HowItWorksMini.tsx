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
    title: "Show up & connect",
    description: "Meet your squad. Make real friends.",
  },
];

export function HowItWorksMini() {
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex flex-col items-center text-center">
                  {/* Step number + icon */}
                  <div className="relative mb-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  
                  {/* Text */}
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
          
          {/* Learn more link */}
          <div className="text-center mt-8">
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
