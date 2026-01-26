/**
 * PricingFooter - Footer section with the "no double-pay" promise
 */

import { Shield, Info } from "lucide-react";

export function PricingFooter() {
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container px-4 mx-auto max-w-3xl text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">
            No double-paying within the same community.
          </h3>
        </div>
        
        <div className="space-y-3 text-muted-foreground">
          <p>
            If your organization (UT, Deloitte, etc.) sponsors OpenClique, members get premium features inside that organization's spaces.
          </p>
          <p>
            Individual Premium is optional for personal, cross-organization features.
          </p>
        </div>
        
        <div className="mt-8 p-4 bg-background border border-border rounded-lg inline-flex items-start gap-3 text-left">
          <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Multi-tenant model:</strong>{" "}
            City, Enterprise, Organization, and Individual accounts are separate payers with scoped entitlements. 
            Payment never auto-covers downstream tenants.
          </div>
        </div>
      </div>
    </section>
  );
}
