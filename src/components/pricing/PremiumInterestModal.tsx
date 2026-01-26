/**
 * PremiumInterestModal - Modal for individual premium interest opt-in
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, CheckCircle, Check, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { usePricingAnalytics } from "@/hooks/usePricingAnalytics";
import { useNavigate } from "react-router-dom";

interface PremiumInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumInterestModal({ isOpen, onClose }: PremiumInterestModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { trackApplicationSubmit } = usePricingAnalytics();
  const [submitted, setSubmitted] = useState(false);
  const [intendedPlan, setIntendedPlan] = useState<'premium_monthly' | 'premium_annual'>('premium_annual');

  const premiumFeatures = [
    { name: 'Social mapping & insights', description: 'See your social connections across all organizations' },
    { name: 'Advanced algorithm controls', description: 'Fine-tune how you get matched with cliques' },
    { name: 'Persistent personal cliques', description: 'Keep your favorite cliques across orgs and cities' },
    { name: 'Priority LFC placement', description: 'Get priority placement in Looking for Clique' },
    { name: 'Social Wrapped summaries', description: 'Get beautiful yearly summaries of your social journey' },
  ];

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Please sign in to continue');
      
      const { error } = await supabase
        .from('premium_interest')
        .upsert({
          user_id: user.id,
          intended_plan: intendedPlan,
          acknowledged_pricing: true,
          pilot_opt_in_date: new Date().toISOString(),
          billing_status: 'pilot_active',
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      trackApplicationSubmit('individual_premium');
      setSubmitted(true);
      toast.success('Welcome to Premium Pilot! 🎉');
    },
    onError: (error: Error) => {
      if (error.message.includes('sign in')) {
        toast.error('Please sign in to join the Premium Pilot');
        navigate('/auth?redirect=/pricing');
      } else {
        toast.error(`Failed to join: ${error.message}`);
      }
    },
  });

  const handleSubmit = () => {
    if (!user) {
      navigate('/auth?redirect=/pricing');
      onClose();
      return;
    }
    submitMutation.mutate();
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-purple-500/30 rounded-full animate-pulse delay-75" />
              <CheckCircle className="w-20 h-20 text-purple-500 relative z-10" />
            </div>
            <h3 className="text-xl font-semibold mb-2">You're in the Premium Pilot! 🎉</h3>
            <p className="text-muted-foreground mb-6">
              All Premium features are now unlocked for you. Explore your social intelligence tools 
              and enjoy the pilot—it's free until we launch paid plans.
            </p>
            <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
              Start Exploring
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-purple-500" />
            <DialogTitle>Join Premium Pilot</DialogTitle>
            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-600">
              <Sparkles className="w-3 h-3 mr-1" />
              Free during pilot
            </Badge>
          </div>
          <DialogDescription>
            Unlock personal features that work across ALL organizations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Features list */}
          <div className="space-y-3">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <Check className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{feature.name}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Plan selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">When pilot ends, I'm interested in:</Label>
            <RadioGroup
              value={intendedPlan}
              onValueChange={(value) => setIntendedPlan(value as 'premium_monthly' | 'premium_annual')}
              className="grid grid-cols-2 gap-4"
            >
              <div className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer ${intendedPlan === 'premium_monthly' ? 'border-purple-500 bg-purple-500/5' : ''}`}>
                <RadioGroupItem value="premium_monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer flex-1">
                  <span className="block font-medium">Monthly</span>
                  <span className="text-sm text-muted-foreground">$12/month</span>
                </Label>
              </div>
              <div className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer relative ${intendedPlan === 'premium_annual' ? 'border-purple-500 bg-purple-500/5' : ''}`}>
                <RadioGroupItem value="premium_annual" id="annual" />
                <Label htmlFor="annual" className="cursor-pointer flex-1">
                  <span className="block font-medium">Annual</span>
                  <span className="text-sm text-muted-foreground">$99/year</span>
                </Label>
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-xs">Save 30%</Badge>
              </div>
            </RadioGroup>
          </div>

          {/* Pilot notice */}
          <div className="p-4 bg-purple-500/10 rounded-lg">
            <p className="text-sm">
              <strong>🚀 Pilot Phase — No payment required.</strong><br />
              All Premium features are unlocked now. We'll give you advance notice before paid plans activate.
            </p>
          </div>

          {/* Cross-org note */}
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Premium features work across all organizations. 
            If your org sponsors OpenClique, you get premium features there for free—
            this is for personal, cross-organization features.
          </p>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitMutation.isPending} 
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {submitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {user ? 'Join Premium Pilot' : 'Sign In to Join'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
