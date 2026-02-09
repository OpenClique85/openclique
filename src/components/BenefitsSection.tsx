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

const benefitImages: Record<number, string> = {
  0: friendsLaughing,
  1: coffeeShopFriends,
  2: sunsetGathering,
};

export function BenefitsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Built for Real Connection
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            No more awkward group chats that never lead anywhere. We handle the hard part so you can focus on showing up.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {BENEFITS.map((benefit, index) => {
            const Icon = iconMap[benefit.icon] || Compass;
            const backgroundImage = benefitImages[index];
            return (
              <div
                key={benefit.title}
                className="group relative bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Subtle bg on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-[0.07] transition-opacity duration-500"
                  style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                
                <div className="relative z-10 p-7 flex-grow">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
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
                <div className="h-24 overflow-hidden mt-auto">
                  <img 
                    src={backgroundImage}
                    alt=""
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
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
