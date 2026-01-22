import { CREATORS_PAGE } from "@/constants/content";
import buggsFace from "@/assets/buggs-face.png";

export function CreatorBuggsCallout() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl p-8 border border-border shadow-lg text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full p-2 shadow-sm border border-border/50">
              <img 
                src={buggsFace} 
                alt="BUGGS mascot" 
                className="w-full h-full object-contain"
              />
            </div>
            
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              {CREATORS_PAGE.buggs.title}
            </h3>
            <p className="text-creator font-medium mb-4">
              {CREATORS_PAGE.buggs.subtitle}
            </p>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {CREATORS_PAGE.buggs.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
