import { Users, Compass, Calendar, LucideIcon } from "lucide-react";
import { BENEFITS } from "@/constants/content";
import friendsLaughing from "@/assets/austin/friends-laughing.jpg";
import coffeeShopFriends from "@/assets/austin/coffee-shop-friends.jpg";
import sunsetGathering from "@/assets/austin/sunset-gathering.jpg";

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  compass: Compass,
  calendar: Calendar,
};

// Map benefit index to Austin lifestyle images
const benefitImages: Record<number, string> = {
  0: friendsLaughing,    // Small squads
  1: coffeeShopFriends,  // Curated experiences
  2: sunsetGathering,    // No hassle
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
            const backgroundImage = benefitImages[index];
            return (
              <div
                key={benefit.title}
                className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Background image accent */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                  style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                
                <div className="relative z-10 p-6">
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

                {/* Bottom image strip */}
                <div className="h-24 overflow-hidden">
                  <img 
                    src={backgroundImage}
                    alt=""
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
