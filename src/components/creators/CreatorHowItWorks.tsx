import { CREATORS_PAGE } from "@/constants/content";

export function CreatorHowItWorks() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm font-medium text-creator uppercase tracking-wide">For Influencers</span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-2">
              How It Works
            </h2>
          </div>
          
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-creator/30 hidden md:block" />
            
            <div className="space-y-8">
              {CREATORS_PAGE.howItWorks.map((step) => (
                <div
                  key={step.step}
                  className="flex gap-6 items-start"
                >
                  <div className="relative z-10 w-12 h-12 rounded-full bg-creator text-creator-foreground flex items-center justify-center font-display font-bold text-lg shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="font-display font-semibold text-foreground mb-1">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
