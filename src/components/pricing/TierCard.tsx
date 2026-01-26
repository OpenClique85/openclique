/**
 * TierCard - Individual pricing tier card component
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface TierCTA {
  label: string;
  action: string;
  variant: 'primary' | 'outline' | 'ghost';
}

interface TierCardProps {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  features: string[];
  pilotStatus?: string;
  futurePrice: string;
  ctas: TierCTA[];
  clarification?: string;
  color?: string;
  isPopular?: boolean;
  onCTAClick: (action: string) => void;
}

export function TierCard({
  id,
  name,
  icon,
  tagline,
  features,
  pilotStatus,
  futurePrice,
  ctas,
  clarification,
  color = "bg-primary",
  isPopular,
  onCTAClick,
}: TierCardProps) {
  // Dynamically get the icon component
  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Box;
  
  return (
    <Card className={cn(
      "relative flex flex-col h-full transition-all duration-300 hover:shadow-lg",
      isPopular && "border-primary shadow-md"
    )}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
          color
        )}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription className="text-base">{tagline}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* Features list */}
        <ul className="space-y-3 mb-6 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* Clarification note */}
        {clarification && (
          <p className="text-xs text-muted-foreground italic mb-4 p-3 bg-muted/50 rounded-lg">
            {clarification}
          </p>
        )}
        
        {/* Pricing */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          {pilotStatus && (
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{pilotStatus}</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Future pricing:</span> {futurePrice}
          </p>
        </div>
        
        {/* CTAs */}
        <div className="space-y-2">
          {ctas.map((cta, index) => (
            <Button
              key={index}
              variant={cta.variant === 'primary' ? 'default' : cta.variant === 'outline' ? 'outline' : 'ghost'}
              className="w-full"
              onClick={() => onCTAClick(cta.action)}
            >
              {cta.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
