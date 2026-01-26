/**
 * =============================================================================
 * PRICING PAGE
 * =============================================================================
 * 
 * Multi-tenant pricing page showing all tiers:
 * City > Enterprise (Business/University) > Organization > Individual
 * 
 * OpenClique is multi-tenant, not cascading. Each payer is independent.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  PricingHero, 
  TierCard, 
  IndividualTierCard, 
  PricingFooter,
  TierApplicationModal,
  PremiumInterestModal,
} from "@/components/pricing";
import { usePricingAnalytics } from "@/hooks/usePricingAnalytics";

type AccountTier = 'city' | 'enterprise';
type EnterpriseType = 'company' | 'university' | 'military' | 'program';

export default function Pricing() {
  const navigate = useNavigate();
  const { trackPageView, trackCTAClick } = usePricingAnalytics();
  
  // Modal states
  const [applicationModal, setApplicationModal] = useState<{
    isOpen: boolean;
    tier: AccountTier;
    enterpriseType?: EnterpriseType;
  }>({ isOpen: false, tier: 'city' });
  
  const [premiumModal, setPremiumModal] = useState(false);

  // Track page view on mount
  useEffect(() => {
    trackPageView();
  }, []);

  const handleCTAClick = (action: string) => {
    switch (action) {
      case 'apply-city':
        trackCTAClick('city', 'Apply for City Pilot');
        setApplicationModal({ isOpen: true, tier: 'city' });
        break;
      case 'demo-city':
        trackCTAClick('city', 'Request Demo');
        setApplicationModal({ isOpen: true, tier: 'city' });
        break;
      case 'apply-enterprise-business':
        trackCTAClick('enterprise', 'Apply for Enterprise Pilot', 'company');
        setApplicationModal({ isOpen: true, tier: 'enterprise', enterpriseType: 'company' });
        break;
      case 'apply-enterprise-university':
        trackCTAClick('enterprise', 'Apply for Campus Pilot', 'university');
        setApplicationModal({ isOpen: true, tier: 'enterprise', enterpriseType: 'university' });
        break;
      case 'demo-enterprise':
        trackCTAClick('enterprise', 'Request Demo');
        setApplicationModal({ isOpen: true, tier: 'enterprise' });
        break;
      case 'create-org':
        trackCTAClick('organization', 'Create Organization');
        navigate('/creators');
        break;
      case 'pilot':
        trackCTAClick('organization', 'Join Pilot');
        navigate('/pilot');
        break;
      case 'signup':
        trackCTAClick('individual_free', 'Get Started Free');
        navigate('/auth');
        break;
      case 'premium-pilot':
        trackCTAClick('individual_premium', 'Join Premium Pilot');
        setPremiumModal(true);
        break;
      case 'upgrade-later':
        trackCTAClick('individual_premium', 'Upgrade Later');
        navigate('/pilot');
        break;
      default:
        break;
    }
  };

  // Tier configurations
  const cityTier = {
    id: 'city',
    name: 'City Accounts',
    icon: 'Building2',
    tagline: 'For cities, regions, and civic initiatives',
    features: [
      'City-wide social health dashboards (aggregate only)',
      'Participation & retention trends',
      'Neighborhood-level activity density (privacy-safe)',
      'City-wide quests & initiatives',
      'Annual impact reports',
    ],
    clarification: "City accounts provide aggregate civic insights. Organizations (companies, campuses) contract separately.",
    pilotStatus: 'Free during pilot',
    futurePrice: '$25k-$150k / year',
    ctas: [
      { label: 'Apply for City Pilot', action: 'apply-city', variant: 'primary' as const },
      { label: 'Request Demo', action: 'demo-city', variant: 'outline' as const },
    ],
    color: 'bg-blue-600',
  };

  const businessEnterpriseTier = {
    id: 'enterprise-business',
    name: 'Business Enterprise',
    icon: 'Briefcase',
    tagline: 'For companies onboarding cohorts, interns, and new hires',
    features: [
      'Enterprise organization dashboard',
      'Unlimited clubs within your org',
      'Cohorts & Orientation Mode',
      'Cohort Health Score',
      'Retention & connectivity analytics',
      'Admin-approved locations',
      'Auto-sunset cohorts',
      'Alumni carryover',
      'Compliance-ready admin tools',
    ],
    pilotStatus: 'Free during pilot',
    futurePrice: 'Custom — per seat, per cohort, or annual platform',
    ctas: [
      { label: 'Apply for Enterprise Pilot', action: 'apply-enterprise-business', variant: 'primary' as const },
      { label: 'Request Demo', action: 'demo-enterprise', variant: 'outline' as const },
    ],
    color: 'bg-indigo-600',
  };

  const universityEnterpriseTier = {
    id: 'enterprise-university',
    name: 'University / Campus',
    icon: 'GraduationCap',
    tagline: 'For campuses, orientation, and student org ecosystems',
    features: [
      'Campus-wide organization dashboard',
      'Clubs, umbrella orgs, student org hierarchy',
      'Student org applications & verification',
      'Cohorts & Orientation Mode',
      'Verified .edu domain gating',
      'Social Chair tools',
      'Eventbrite imports',
      'Retention & connectivity analytics',
      'Alumni carryover',
    ],
    pilotStatus: 'Free during pilot',
    futurePrice: 'Custom — annual campus license + cohorts',
    ctas: [
      { label: 'Apply for Campus Pilot', action: 'apply-enterprise-university', variant: 'primary' as const },
      { label: 'Request Demo', action: 'demo-enterprise', variant: 'outline' as const },
    ],
    color: 'bg-violet-600',
  };

  const organizationTier = {
    id: 'organization',
    name: 'Organizations & Community Groups',
    icon: 'Users',
    tagline: 'For clubs, nonprofits, alumni groups, and local communities',
    features: [
      'Organization & club creation',
      'Events & cliques',
      'Social Chair tools',
      'Eventbrite imports',
      'Looking for Clique',
      'Basic metrics',
    ],
    pilotStatus: 'Free during pilot',
    futurePrice: '$79/month or $799/year',
    ctas: [
      { label: 'Create Organization', action: 'create-org', variant: 'primary' as const },
      { label: 'Join Pilot', action: 'pilot', variant: 'outline' as const },
    ],
    color: 'bg-emerald-600',
    isPopular: true,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <PricingHero />
        
        {/* Tier Cards Grid */}
        <section className="py-12 md:py-16">
          <div className="container px-4 mx-auto">
            {/* City Tier - Full Width */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                <span className="text-blue-600">City-Level</span> Social Infrastructure
              </h2>
              <div className="max-w-xl mx-auto">
                <TierCard {...cityTier} onCTAClick={handleCTAClick} />
              </div>
            </div>

            {/* Enterprise Tiers - Side by Side */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                <span className="text-indigo-600">Enterprise</span> Cohort Management
              </h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <TierCard {...businessEnterpriseTier} onCTAClick={handleCTAClick} />
                <TierCard {...universityEnterpriseTier} onCTAClick={handleCTAClick} />
              </div>
            </div>

            {/* Organization & Individual - Side by Side */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-center">
                <span className="text-emerald-600">Community</span> & <span className="text-purple-600">Individual</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <TierCard {...organizationTier} onCTAClick={handleCTAClick} />
                <IndividualTierCard onCTAClick={handleCTAClick} />
              </div>
            </div>
          </div>
        </section>

        <PricingFooter />
      </main>

      <Footer />

      {/* Modals */}
      <TierApplicationModal
        isOpen={applicationModal.isOpen}
        onClose={() => setApplicationModal({ ...applicationModal, isOpen: false })}
        tier={applicationModal.tier}
        enterpriseType={applicationModal.enterpriseType}
      />
      
      <PremiumInterestModal
        isOpen={premiumModal}
        onClose={() => setPremiumModal(false)}
      />
    </div>
  );
}
