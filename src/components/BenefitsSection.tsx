import { Users, Compass, Calendar, LucideIcon } from "lucide-react";
import { BENEFITS } from "@/constants/content";

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  compass: Compass,
  calendar: Calendar,
};

export function BenefitsSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How connection should feel
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            No more awkward group chats that never lead anywhere. OpenClique handles the hard part so you can focus on showing up.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {BENEFITS.map((benefit, index) => {
            const Icon = iconMap[benefit.icon] || Compass;
            return (
              <div
                key={benefit.title}
                className="group relative bg-card rounded-xl p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
