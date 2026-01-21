import { CREATORS_PAGE } from "@/constants/content";
import { Star, Briefcase, Tag, Handshake } from "lucide-react";
import sunsetGathering from "@/assets/austin/sunset-gathering.jpg";

const benefitIcons = {
  star: Star,
  briefcase: Briefcase,
  tag: Tag,
  handshake: Handshake,
};

export function QuestCreatorSection() {
  const { questCreators } = CREATORS_PAGE;

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${sunsetGathering})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-sunset/10 text-sunset rounded-full text-sm font-medium mb-4">
              New: Quest Creator Marketplace
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {questCreators.sectionTitle}
            </h2>
            <p className="text-xl text-sunset font-medium mb-2">
              {questCreators.subtitle}
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {questCreators.description}
            </p>
          </div>

          {/* Path Steps */}
          <div className="mb-16">
            <h3 className="font-display text-xl font-semibold text-foreground text-center mb-8">
              Your Path to Paid
            </h3>
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-sunset via-sunset/50 to-sunset/20 hidden md:block" />
              
              <div className="space-y-6">
                {questCreators.pathSteps.map((step) => (
                  <div
                    key={step.step}
                    className="flex gap-6 items-start"
                  >
                    <div className="relative z-10 w-12 h-12 rounded-full bg-sunset text-sunset-foreground flex items-center justify-center font-display font-bold text-lg shrink-0 shadow-lg">
                      {step.step}
                    </div>
                    <div className="flex-1 pt-2 bg-card/50 rounded-lg p-4 border border-border/50">
                      <h4 className="font-display font-semibold text-foreground mb-1">
                        {step.title}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {questCreators.benefits.map((benefit) => {
              const Icon = benefitIcons[benefit.icon as keyof typeof benefitIcons] || Star;
              return (
                <div
                  key={benefit.title}
                  className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border hover:border-sunset/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-sunset/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-sunset" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-foreground mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hook Quote */}
          <div className="text-center">
            <blockquote className="text-lg md:text-xl text-foreground italic max-w-2xl mx-auto">
              "{questCreators.hook}"
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
