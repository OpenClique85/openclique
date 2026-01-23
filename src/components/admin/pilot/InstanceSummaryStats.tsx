/**
 * Instance Summary Stats
 * 
 * Dashboard summary showing key metrics at a glance.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Calendar, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';

interface InstanceSummaryStatsProps {
  totalInstances: number;
  todayCount: number;
  needsAttention: number;
  totalConfirmed: number;
}

export function InstanceSummaryStats({
  totalInstances,
  todayCount,
  needsAttention,
  totalConfirmed,
}: InstanceSummaryStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalInstances}</p>
            <p className="text-xs text-muted-foreground">Active Instances</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{todayCount}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`p-2 rounded-lg ${needsAttention > 0 ? 'bg-orange-500/10' : 'bg-muted'}`}>
            <AlertTriangle className={`h-5 w-5 ${needsAttention > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{needsAttention}</p>
            <p className="text-xs text-muted-foreground">Need Attention</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Users className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalConfirmed}</p>
            <p className="text-xs text-muted-foreground">Users Confirmed</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
