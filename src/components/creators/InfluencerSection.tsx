import { CREATORS_PAGE } from "@/constants/content";
import { CreatorTypeCard } from "@/components/CreatorTypeCard";
import { Palette, Users, TrendingUp } from "lucide-react";
import runningGroup from "@/assets/austin/running-group.jpg";
import foodTruckScene from "@/assets/austin/food-truck-scene.jpg";
import coffeeShopFriends from "@/assets/austin/coffee-shop-friends.jpg";
import concertCrowd from "@/assets/austin/concert-crowd.jpg";
import rooftopGathering from "@/assets/austin/rooftop-gathering.jpg";
import muralWall from "@/assets/austin/mural-wall.jpg";

const valuePropIcons = {
  palette: Palette,
  users: Users,
  "trending-up": TrendingUp,
};

const useCaseImages: Record<string, string> = {
  running: runningGroup,
  "food-truck": foodTruckScene,
  "coffee-shop": coffeeShopFriends,
  concert: concertCrowd,
  rooftop: rooftopGathering,
  mural: muralWall,
};

export function InfluencerSection() {
  return (
    <>
      {/* Value Props */}
      <section className="py-16 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url(${muralWall})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-sm font-medium text-creator uppercase tracking-wide">For Influencers</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-2">
                Why Creators Love OpenClique
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CREATORS_PAGE.valueProps.map((prop) => {
                const Icon = valuePropIcons[prop.icon as keyof typeof valuePropIcons] || Palette;
                return (
                  <div
                    key={prop.title}
                    className="bg-card rounded-xl p-6 border border-border text-center hover:border-creator/50 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-xl bg-creator/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-creator" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                      {prop.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {prop.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-4">
              Built for Every Kind of Creator
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Whether you're building a fitness empire or teaching a craft, your audience wants to connect.
              <span className="block text-sm mt-1 text-creator">Click any card to learn more.</span>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CREATORS_PAGE.useCases.map((useCase) => {
                const image = useCaseImages[useCase.image as keyof typeof useCaseImages] || runningGroup;
                return (
                  <CreatorTypeCard
                    key={useCase.title}
                    title={useCase.title}
                    description={useCase.description}
                    icon={useCase.icon}
                    image={image}
                    expandedDescription={(useCase as any).expandedDescription}
                    exampleQuests={(useCase as any).exampleQuests}
                    perfectFor={(useCase as any).perfectFor}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
