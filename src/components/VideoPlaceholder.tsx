import { Play } from "lucide-react";
import { VIDEO_SECTION } from "@/constants/content";

export function VideoPlaceholder() {
  // If there's a real video URL, render the embed
  if (VIDEO_SECTION.embedUrl && !VIDEO_SECTION.placeholder) {
    return (
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
              <iframe
                src={VIDEO_SECTION.embedUrl}
                title={VIDEO_SECTION.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Placeholder state
  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video rounded-xl bg-gradient-to-br from-foreground/5 to-foreground/10 border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 shadow-lg">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Play className="w-8 h-8 text-primary ml-1" />
            </div>
            <div className="text-center px-4">
              <p className="font-display font-semibold text-lg text-foreground">
                {VIDEO_SECTION.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Video coming soon
              </p>
            </div>
          </div>
          
          {/* Instructions for adding video */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            To add your video, update the <code className="bg-muted px-1.5 py-0.5 rounded">embedUrl</code> in <code className="bg-muted px-1.5 py-0.5 rounded">src/constants/content.ts</code>
          </p>
        </div>
      </div>
    </section>
  );
}
