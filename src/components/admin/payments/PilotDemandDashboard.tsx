/**
 * PilotDemandDashboard - Overview of pilot signups and demand
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, Building2, GraduationCap, Briefcase, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function PilotDemandDashboard() {
  // Fetch tier applications stats
  const { data: applicationStats, isLoading: loadingApps } = useQuery({
    queryKey: ['tier-applications-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tier_applications')
        .select('tier, enterprise_type, status, created_at');
      
      if (error) throw error;
      
      // Group by tier
      const byTier = {
        city: data?.filter(a => a.tier === 'city').length || 0,
        enterprise_business: data?.filter(a => a.tier === 'enterprise' && a.enterprise_type !== 'university').length || 0,
        enterprise_university: data?.filter(a => a.tier === 'enterprise' && a.enterprise_type === 'university').length || 0,
        organization: data?.filter(a => a.tier === 'organization').length || 0,
      };
      
      // Status breakdown
      const byStatus = {
        pending: data?.filter(a => a.status === 'pending').length || 0,
        demo_scheduled: data?.filter(a => a.status === 'demo_scheduled').length || 0,
        in_review: data?.filter(a => a.status === 'in_review').length || 0,
        approved: data?.filter(a => a.status === 'approved').length || 0,
        converted: data?.filter(a => a.status === 'converted').length || 0,
      };
      
      return { byTier, byStatus, total: data?.length || 0, raw: data };
    },
  });

  // Fetch premium interest stats
  const { data: premiumStats, isLoading: loadingPremium } = useQuery({
    queryKey: ['premium-interest-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('premium_interest')
        .select('intended_plan, billing_status, ready_to_convert');
      
      if (error) throw error;
      
      return {
        total: data?.length || 0,
        monthly: data?.filter(p => p.intended_plan === 'premium_monthly').length || 0,
        annual: data?.filter(p => p.intended_plan === 'premium_annual').length || 0,
        readyToConvert: data?.filter(p => p.ready_to_convert).length || 0,
      };
    },
  });

  // Fetch organizations with billing info
  const { data: orgStats, isLoading: loadingOrgs } = useQuery({
    queryKey: ['org-billing-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('account_tier, billing_status, enterprise_type, estimated_arr');
      
      if (error) throw error;
      
      const byStatus = {
        pilot_active: data?.filter(o => o.billing_status === 'pilot_active').length || 0,
        negotiating: data?.filter(o => o.billing_status === 'negotiating').length || 0,
        converted: data?.filter(o => o.billing_status === 'converted').length || 0,
      };
      
      const totalPotentialARR = data?.reduce((sum, o) => sum + (o.estimated_arr || 0), 0) || 0;
      
      return { byStatus, totalPotentialARR, total: data?.length || 0 };
    },
  });

  const isLoading = loadingApps || loadingPremium || loadingOrgs;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'City Applications',
      value: applicationStats?.byTier.city || 0,
      icon: Building2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Business Enterprise',
      value: applicationStats?.byTier.enterprise_business || 0,
      icon: Briefcase,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      title: 'University/Campus',
      value: applicationStats?.byTier.enterprise_university || 0,
      icon: GraduationCap,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      title: 'Premium Individuals',
      value: premiumStats?.total || 0,
      icon: User,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pilot Demand Dashboard</h2>
        <p className="text-muted-foreground">Track pilot signups and conversion intent by tier</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Application Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Application Pipeline
          </CardTitle>
          <CardDescription>Status of tier applications across all tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                Pending
              </Badge>
              <span className="font-semibold">{applicationStats?.byStatus.pending || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                Demo Scheduled
              </Badge>
              <span className="font-semibold">{applicationStats?.byStatus.demo_scheduled || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                In Review
              </Badge>
              <span className="font-semibold">{applicationStats?.byStatus.in_review || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                Approved
              </Badge>
              <span className="font-semibold">{applicationStats?.byStatus.approved || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Converted
              </Badge>
              <span className="font-semibold">{applicationStats?.byStatus.converted || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Interest */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Individual Premium Interest
          </CardTitle>
          <CardDescription>Users who have opted into the premium pilot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Monthly Plan Intent</p>
              <p className="text-2xl font-bold">{premiumStats?.monthly || 0}</p>
              <p className="text-xs text-muted-foreground">$12/mo each</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Annual Plan Intent</p>
              <p className="text-2xl font-bold">{premiumStats?.annual || 0}</p>
              <p className="text-xs text-muted-foreground">$99/yr each</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Ready to Convert</p>
              <p className="text-2xl font-bold text-green-600">{premiumStats?.readyToConvert || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Potential ARR */}
      <Card>
        <CardHeader>
          <CardTitle>Potential ARR from Pilot Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600">
            ${(orgStats?.totalPotentialARR || 0).toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            From {orgStats?.total || 0} organizations with estimated ARR
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
