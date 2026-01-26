/**
 * IndividualTierCard - Special tier card for Individual (Free + Premium)
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface IndividualTierCardProps {
  onCTAClick: (action: string) => void;
}

export function IndividualTierCard({ onCTAClick }: IndividualTierCardProps) {
  const freeFeatures = [
    'Join events & cliques',
    'Discover groups',
    'Chat & coordinate',
  ];
  
  const premiumFeatures = [
    'Social mapping & insights',
    'Advanced algorithm controls',
    'Persistent personal cliques',
    'Priority LFC placement',
    'Social history & Wrapped-style summaries',
  ];

  return (
    <Card className="relative flex flex-col h-full transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-purple-500">
          <User className="w-6 h-6 text-white" />
        </div>
        
        <CardTitle className="text-xl">Individuals</CardTitle>
        <CardDescription className="text-base">Free forever + optional Premium</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* Free Tier */}
        <div className="mb-6">
          <h4 className="font-semibold text-foreground mb-3">Free (Always)</h4>
          <ul className="space-y-2 mb-4">
            {freeFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            variant="default"
            className="w-full"
            onClick={() => onCTAClick('signup')}
          >
            Get Started Free
          </Button>
        </div>
        
        <Separator className="my-4" />
        
        {/* Premium Tier */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-foreground">Premium — Social Intelligence</h4>
            <Badge variant="outline" className="text-xs">Optional</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Personal features that work across ALL organizations
          </p>
          
          <ul className="space-y-2 mb-4 flex-1">
            {premiumFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          
          {/* Pricing */}
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Free during pilot</span>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Future:</span> $12/month or $99/year
            </p>
          </div>
          
          <div className="space-y-2">
            <Button
              variant="default"
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => onCTAClick('premium-pilot')}
            >
              Join Premium Pilot
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => onCTAClick('upgrade-later')}
            >
              Upgrade Later
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
