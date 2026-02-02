/**
 * =============================================================================
 * Safety Guidelines Modal
 * =============================================================================
 * Shows safety tips for meeting new people through quests.
 * Displayed to first-time quest signers and accessible from Settings.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Users, 
  AlertTriangle, 
  Lock, 
  Flag, 
  Phone,
  Shield,
  Heart
} from 'lucide-react';

interface SafetyGuidelinesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcknowledge?: () => void;
  showDontShowAgain?: boolean;
}

const GUIDELINES = [
  {
    icon: MapPin,
    title: 'Choose Public Places',
    description: 'Meet in well-lit, populated areas. Avoid private residences for first quests.',
  },
  {
    icon: Users,
    title: 'Tell Someone',
    description: "Let a friend know where you're going and when you'll be back.",
  },
  {
    icon: AlertTriangle,
    title: 'Trust Your Instincts',
    description: "If something feels off, it probably is. Leave if you're uncomfortable.",
  },
  {
    icon: Lock,
    title: 'Keep Personal Info Private',
    description: "Don't share your home address, financial info, or last name immediately.",
  },
  {
    icon: Flag,
    title: 'Report Bad Behavior',
    description: 'See something concerning? Report it immediately — we review within 24 hours.',
  },
  {
    icon: Phone,
    title: 'Emergency? Call 911',
    description: 'For immediate danger, always call local authorities first.',
  },
];

export function SafetyGuidelines({
  open,
  onOpenChange,
  onAcknowledge,
  showDontShowAgain = true,
}: SafetyGuidelinesProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleAcknowledge = () => {
    if (dontShowAgain) {
      localStorage.setItem('safety-guidelines-acknowledged', 'true');
    }
    onAcknowledge?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">Quest Safety Guidelines</DialogTitle>
          <DialogDescription className="text-base">
            Meeting new people is exciting! Stay safe with these tips:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {GUIDELINES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
          <Heart className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Questions? Contact us at{' '}
            <a href="mailto:hello@openclique.com" className="text-primary hover:underline">
              hello@openclique.com
            </a>
          </p>
        </div>

        {showDontShowAgain && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label htmlFor="dont-show" className="text-sm text-muted-foreground cursor-pointer">
              Don't show this again
            </Label>
          </div>
        )}

        <DialogFooter>
          <Button className="w-full" onClick={handleAcknowledge}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if user should see safety guidelines
export function useSafetyGuidelines() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const acknowledged = localStorage.getItem('safety-guidelines-acknowledged');
    if (!acknowledged) {
      setShouldShow(true);
    }
  }, []);

  const dismiss = () => {
    setShouldShow(false);
  };

  return { shouldShow, dismiss };
}
