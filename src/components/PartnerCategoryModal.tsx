import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

interface ExampleQuest {
  name: string;
  emoji: string;
  description: string;
  reward: string;
  whyItWorks: string;
}

interface PartnerCategory {
  id: string;
  title: string;
  icon: string;
  tagline: string;
  exampleQuest: ExampleQuest;
  valuePoints: string[];
}

interface PartnerCategoryModalProps {
  category: PartnerCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (categoryId: string) => void;
}

export function PartnerCategoryModal({
  category,
  open,
  onOpenChange,
  onApply,
}: PartnerCategoryModalProps) {
  if (!category) return null;

  const handleCTAClick = () => {
    if (onApply) {
      onApply(category.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="text-2xl">{category.exampleQuest.emoji}</span>
            <div>
              <div className="font-display text-foreground">{category.title}</div>
              <div className="text-sm font-normal text-muted-foreground">
                {category.tagline}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Example Quest */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Example Quest
            </div>
            <h3 className="font-display font-semibold text-foreground mb-1">
              {category.exampleQuest.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {category.exampleQuest.description}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-sunset font-medium">Reward:</span>
              <span className="text-foreground">{category.exampleQuest.reward}</span>
            </div>
          </div>

          {/* Why It Works */}
          <div className="bg-sunset/5 rounded-lg p-4 border border-sunset/20">
            <div className="text-xs uppercase tracking-wide text-sunset mb-1">
              Why It Works
            </div>
            <p className="text-sm text-foreground italic">
              "{category.exampleQuest.whyItWorks}"
            </p>
          </div>

          {/* Value Points */}
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
              What You Get
            </div>
            <ul className="space-y-2">
              {category.valuePoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <Button
            onClick={handleCTAClick}
            className="w-full bg-sunset text-sunset-foreground hover:bg-sunset/90 gap-2"
          >
            Partner as a {category.title.replace(" & ", "/")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
