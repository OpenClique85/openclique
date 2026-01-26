/**
 * TierApplicationModal - Modal for City/Enterprise tier applications
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { usePricingAnalytics } from "@/hooks/usePricingAnalytics";

type AccountTier = 'city' | 'enterprise';
type EnterpriseType = 'company' | 'university' | 'military' | 'program';

interface TierApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: AccountTier;
  enterpriseType?: EnterpriseType;
}

export function TierApplicationModal({
  isOpen,
  onClose,
  tier,
  enterpriseType: initialEnterpriseType,
}: TierApplicationModalProps) {
  const { user } = useAuth();
  const { trackApplicationSubmit } = usePricingAnalytics();
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: user?.email || '',
    organizationName: '',
    enterpriseType: initialEnterpriseType || 'company' as EnterpriseType,
    cityName: '',
    cityRegion: '',
    estimatedPopulation: '',
    estimatedHeadcount: '',
    useCaseDescription: '',
    demoRequested: true,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tier_applications')
        .insert([{
          applicant_id: user?.id || null,
          applicant_email: formData.applicantEmail,
          applicant_name: formData.applicantName,
          organization_name: formData.organizationName,
          tier: tier,
          enterprise_type: tier === 'enterprise' ? formData.enterpriseType : null,
          city_name: tier === 'city' ? formData.cityName : null,
          city_region: tier === 'city' ? formData.cityRegion : null,
          estimated_population: tier === 'city' && formData.estimatedPopulation 
            ? parseInt(formData.estimatedPopulation) : null,
          estimated_headcount: tier === 'enterprise' && formData.estimatedHeadcount 
            ? parseInt(formData.estimatedHeadcount) : null,
          use_case_description: formData.useCaseDescription,
          demo_requested: formData.demoRequested,
          status: 'pending',
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      trackApplicationSubmit(
        tier, 
        tier === 'enterprise' ? formData.enterpriseType : undefined
      );
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  const getTitle = () => {
    if (tier === 'city') return 'Apply for City Pilot';
    if (formData.enterpriseType === 'university') return 'Apply for Campus Pilot';
    return 'Apply for Enterprise Pilot';
  };

  const getDescription = () => {
    if (tier === 'city') {
      return 'Get city-wide social health dashboards and civic initiative tools.';
    }
    if (formData.enterpriseType === 'university') {
      return 'Enable campus-wide connection with clubs, cohorts, and orientation tools.';
    }
    return 'Power your organization with cohort management and connectivity analytics.';
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Application Submitted!</h3>
            <p className="text-muted-foreground mb-6">
              We'll review your application and reach out within 2-3 business days.
              {formData.demoRequested && " We'll be in touch to schedule your demo."}
            </p>
            <Button onClick={onClose}>Close</Button>
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
            <DialogTitle>{getTitle()}</DialogTitle>
            <Badge variant="outline" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Free during pilot
            </Badge>
          </div>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicantName">Your Name *</Label>
              <Input
                id="applicantName"
                value={formData.applicantName}
                onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicantEmail">Email *</Label>
              <Input
                id="applicantEmail"
                type="email"
                value={formData.applicantEmail}
                onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name *</Label>
            <Input
              id="organizationName"
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              placeholder={tier === 'city' ? 'City of Austin' : 'Your company or campus'}
              required
            />
          </div>

          {/* Enterprise Type Selector */}
          {tier === 'enterprise' && (
            <div className="space-y-2">
              <Label>Organization Type *</Label>
              <RadioGroup
                value={formData.enterpriseType}
                onValueChange={(value) => setFormData({ ...formData, enterpriseType: value as EnterpriseType })}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="company" id="company" />
                  <Label htmlFor="company" className="cursor-pointer">Company</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="university" id="university" />
                  <Label htmlFor="university" className="cursor-pointer">University/Campus</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="military" id="military" />
                  <Label htmlFor="military" className="cursor-pointer">Military</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="program" id="program" />
                  <Label htmlFor="program" className="cursor-pointer">Program</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* City-specific fields */}
          {tier === 'city' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cityName">City Name</Label>
                  <Input
                    id="cityName"
                    value={formData.cityName}
                    onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
                    placeholder="Austin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cityRegion">Region/State</Label>
                  <Input
                    id="cityRegion"
                    value={formData.cityRegion}
                    onChange={(e) => setFormData({ ...formData, cityRegion: e.target.value })}
                    placeholder="Texas"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedPopulation">Estimated Population</Label>
                <Input
                  id="estimatedPopulation"
                  type="number"
                  value={formData.estimatedPopulation}
                  onChange={(e) => setFormData({ ...formData, estimatedPopulation: e.target.value })}
                  placeholder="1000000"
                />
              </div>
            </>
          )}

          {/* Enterprise-specific fields */}
          {tier === 'enterprise' && (
            <div className="space-y-2">
              <Label htmlFor="estimatedHeadcount">Estimated Headcount</Label>
              <Input
                id="estimatedHeadcount"
                type="number"
                value={formData.estimatedHeadcount}
                onChange={(e) => setFormData({ ...formData, estimatedHeadcount: e.target.value })}
                placeholder="500"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="useCaseDescription">Tell us about your use case</Label>
            <Textarea
              id="useCaseDescription"
              value={formData.useCaseDescription}
              onChange={(e) => setFormData({ ...formData, useCaseDescription: e.target.value })}
              placeholder="What are you hoping to achieve with OpenClique?"
              rows={3}
            />
          </div>

          {/* Demo request */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <input
              type="checkbox"
              id="demoRequested"
              checked={formData.demoRequested}
              onChange={(e) => setFormData({ ...formData, demoRequested: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="demoRequested" className="cursor-pointer text-sm">
              I'd like to schedule a demo
            </Label>
          </div>

          {/* Pilot notice */}
          <div className="p-3 bg-primary/10 rounded-lg text-sm">
            <strong>Pilot Phase — No payment required.</strong>{" "}
            All features are free during pilot. We'll give advance notice before paid plans activate.
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitMutation.isPending} className="flex-1">
              {submitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
