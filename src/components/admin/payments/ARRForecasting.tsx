/**
 * ARRForecasting - Forecasting dashboard for potential revenue
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, DollarSign, TrendingUp, Building2, Briefcase, GraduationCap, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function ARRForecasting() {
  // Fetch organizations with ARR estimates
  const { data: orgData, isLoading: loadingOrgs } = useQuery({
    queryKey: ['arr-forecasting-orgs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, account_tier, enterprise_type, billing_status, estimated_arr')
        .not('account_tier', 'is', null)
        .order('estimated_arr', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch premium interest for individual ARR
  const { data: premiumData, isLoading: loadingPremium } = useQuery({
    queryKey: ['arr-forecasting-premium'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('premium_interest')
        .select('intended_plan, ready_to_convert');
      
      if (error) throw error;
      
      const monthlyCount = data?.filter(p => p.intended_plan === 'premium_monthly').length || 0;
      const annualCount = data?.filter(p => p.intended_plan === 'premium_annual').length || 0;
      
      // Calculate individual ARR: monthly * 12 * $12 + annual * $99
      const individualARR = (monthlyCount * 12 * 12) + (annualCount * 99);
      
      return {
        monthlyCount,
        annualCount,
        totalCount: data?.length || 0,
        readyCount: data?.filter(p => p.ready_to_convert).length || 0,
        individualARR,
      };
    },
  });

  const isLoading = loadingOrgs || loadingPremium;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calculate totals by tier
  const cityARR = orgData?.filter(o => o.account_tier === 'city')
    .reduce((sum, o) => sum + (o.estimated_arr || 0), 0) || 0;
  
  const businessARR = orgData?.filter(o => o.account_tier === 'enterprise' && o.enterprise_type !== 'university')
    .reduce((sum, o) => sum + (o.estimated_arr || 0), 0) || 0;
  
  const universityARR = orgData?.filter(o => o.account_tier === 'enterprise' && o.enterprise_type === 'university')
    .reduce((sum, o) => sum + (o.estimated_arr || 0), 0) || 0;
  
  const orgARR = orgData?.filter(o => o.account_tier === 'organization')
    .reduce((sum, o) => sum + (o.estimated_arr || 0), 0) || 0;

  const individualARR = premiumData?.individualARR || 0;
  
  const totalARR = cityARR + businessARR + universityARR + orgARR + individualARR;

  const arrBreakdown = [
    { 
      label: 'City Accounts', 
      value: cityARR, 
      icon: Building2, 
      color: 'bg-blue-500',
      likelihood: 70,
    },
    { 
      label: 'Business Enterprise', 
      value: businessARR, 
      icon: Briefcase, 
      color: 'bg-indigo-500',
      likelihood: 60,
    },
    { 
      label: 'University/Campus', 
      value: universityARR, 
      icon: GraduationCap, 
      color: 'bg-violet-500',
      likelihood: 75,
    },
    { 
      label: 'Organizations', 
      value: orgARR, 
      icon: TrendingUp, 
      color: 'bg-emerald-500',
      likelihood: 85,
    },
    { 
      label: 'Individual Premium', 
      value: individualARR, 
      icon: User, 
      color: 'bg-purple-500',
      likelihood: 90,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">ARR Forecasting</h2>
        <p className="text-muted-foreground">Project revenue from pilot conversion</p>
      </div>

      {/* Total ARR Card */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader>
          <CardDescription>Total Potential ARR</CardDescription>
          <CardTitle className="text-4xl text-green-600">
            ${totalARR.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            From {orgData?.length || 0} organizations + {premiumData?.totalCount || 0} premium individuals
          </p>
        </CardContent>
      </Card>

      {/* ARR Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {arrBreakdown.map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                  <p className="text-2xl font-bold">${item.value.toLocaleString()}</p>
                </div>
                <Badge variant="outline">
                  {item.likelihood}% likely
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Conversion likelihood</span>
                  <span>{item.likelihood}%</span>
                </div>
                <Progress value={item.likelihood} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Accounts by ARR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Top Accounts by Estimated ARR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orgData?.slice(0, 10).map((org, index) => (
              <div key={org.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}.
                  </span>
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {org.account_tier === 'enterprise' ? org.enterprise_type : org.account_tier}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${(org.estimated_arr || 0).toLocaleString()}</p>
                  <Badge 
                    variant="outline" 
                    className={
                      org.billing_status === 'pilot_active' ? 'text-blue-600' :
                      org.billing_status === 'converted' ? 'text-green-600' :
                      org.billing_status === 'negotiating' ? 'text-amber-600' :
                      'text-gray-600'
                    }
                  >
                    {org.billing_status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
            
            {(!orgData || orgData.length === 0) && (
              <p className="text-center text-muted-foreground py-4">
                No organizations with ARR estimates
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual Premium Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Individual Premium Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{premiumData?.monthlyCount || 0}</p>
              <p className="text-sm text-muted-foreground">Monthly @ $12/mo</p>
              <p className="text-xs text-muted-foreground mt-1">
                = ${((premiumData?.monthlyCount || 0) * 12 * 12).toLocaleString()}/yr
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{premiumData?.annualCount || 0}</p>
              <p className="text-sm text-muted-foreground">Annual @ $99/yr</p>
              <p className="text-xs text-muted-foreground mt-1">
                = ${((premiumData?.annualCount || 0) * 99).toLocaleString()}/yr
              </p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{premiumData?.readyCount || 0}</p>
              <p className="text-sm text-muted-foreground">Ready to Convert</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
