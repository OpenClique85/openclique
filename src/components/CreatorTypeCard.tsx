import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Dumbbell, 
  Utensils, 
  GraduationCap,
  Music,
  Mic,
  Gamepad2,
  LucideIcon,
  Check
} from "lucide-react";

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  utensils: Utensils,
  "graduation-cap": GraduationCap,
  music: Music,
  mic: Mic,
  gamepad: Gamepad2,
};

interface CreatorTypeCardProps {
  title: string;
  description: string;
  icon: string;
  image: string;
  expandedDescription?: string;
  exampleQuests?: string[];
  perfectFor?: string;
}

export function CreatorTypeCard({
  title,
  description,
  icon,
  image,
  expandedDescription,
  exampleQuests,
  perfectFor,
}: CreatorTypeCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = iconMap[icon] || Dumbbell;

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="group bg-card rounded-xl overflow-hidden border border-border hover:border-creator/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setIsOpen(true)}
      >
        {/* Image */}
        <div className="h-40 relative overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          <div className="absolute bottom-3 left-3">
            <div className="w-10 h-10 rounded-lg bg-creator/90 flex items-center justify-center">
              <Icon className="w-5 h-5 text-creator-foreground" />
            </div>
          </div>
          {/* Click indicator */}
          <div className="absolute top-3 right-3 px-2 py-1 bg-background/80 rounded-full text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Click for details
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-creator/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-creator" />
              </div>
              <DialogTitle className="font-display text-xl">{title}</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {expandedDescription || description}
            </DialogDescription>
          </DialogHeader>

          {exampleQuests && exampleQuests.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Example Quests</h4>
              <ul className="space-y-2">
                {exampleQuests.map((quest, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-creator mt-0.5 shrink-0" />
                    {quest}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {perfectFor && (
            <div className="pt-3 border-t border-border">
              <p className="text-sm">
                <span className="font-medium text-foreground">Perfect for: </span>
                <span className="text-muted-foreground">{perfectFor}</span>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
