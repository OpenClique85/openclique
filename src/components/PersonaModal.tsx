import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

export interface PersonaData {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  relatableHook: string;
  whatToExpect: string[];
  perfectIf: string;
}

interface PersonaModalProps {
  persona: PersonaData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonaModal({ persona, open, onOpenChange }: PersonaModalProps) {
  const navigate = useNavigate();
  
  if (!persona) return null;

  const Icon = persona.icon;

  const handleCta = () => {
    onOpenChange(false);
    navigate('/quests');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl font-display">
              {persona.label}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Relatable Hook */}
        <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary/30">
          <p className="text-foreground italic leading-relaxed">
            "{persona.relatableHook}"
          </p>
        </div>

        {/* What to Expect */}
        <div className="space-y-3">
          <h4 className="font-display font-semibold text-foreground">
            What to Expect
          </h4>
          <ul className="space-y-2">
            {persona.whatToExpect.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Perfect If */}
        <div className="bg-primary/5 rounded-lg p-3">
          <p className="text-sm">
            <span className="font-medium text-foreground">Perfect if </span>
            <span className="text-muted-foreground">{persona.perfectIf}</span>
          </p>
        </div>

        {/* CTA */}
        <Button onClick={handleCta} className="w-full mt-2">
          Find Your Quest
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default PersonaModal;
