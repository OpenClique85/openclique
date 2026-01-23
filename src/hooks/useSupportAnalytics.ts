import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInHours, differenceInMinutes, subDays, format, startOfDay } from 'date-fns';

interface TicketTrend {
  date: string;
  opened: number;
  resolved: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
  avgResolutionHours: number | null;
}

interface ResolutionMetrics {
  avgResolutionHours: number | null;
  medianResolutionHours: number | null;
  avgFirstResponseHours: number | null;
  medianFirstResponseHours: number | null;
  resolvedCount: number;
  openCount: number;
  percentResolvedIn24h: number;
  percentResolvedIn48h: number;
  percentRespondedIn1h: number;
  percentRespondedIn4h: number;
}

interface UrgencyBreakdown {
  urgency: string;
  count: number;
  openCount: number;
}

interface FrictionPoint {
  page: string;
  ticketCount: number;
  avgUrgency: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

export interface SupportAnalytics {
  ticketTrends: TicketTrend[];
  categoryBreakdown: CategoryBreakdown[];
  resolutionMetrics: ResolutionMetrics;
  urgencyBreakdown: UrgencyBreakdown[];
  frictionPoints: FrictionPoint[];
  statusBreakdown: StatusBreakdown[];
  totalTickets: number;
  ticketsLast7Days: number;
  ticketsLast30Days: number;
}

// Convert urgency to numeric for averaging
const urgencyToNumber = (urgency: string): number => {
  switch (urgency) {
    case 'low': return 1;
    case 'medium': return 2;
    case 'high': return 3;
    case 'critical': return 4;
    default: return 2;
  }
};

export function useSupportAnalytics(days: number = 30) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['support-analytics', days],
    queryFn: async (): Promise<SupportAnalytics> => {
      const startDate = subDays(new Date(), days);

      // Fetch all tickets with category info
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select(`
          id,
          status,
          urgency,
          created_at,
          resolved_at,
          first_response_at,
          submitted_from_page,
          category:issue_categories(id, name)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const allTickets = tickets || [];
      const now = new Date();

      // Calculate ticket trends by day
      const trendMap = new Map<string, { opened: number; resolved: number }>();
      for (let i = 0; i < days; i++) {
        const date = format(subDays(now, days - 1 - i), 'MMM dd');
        trendMap.set(date, { opened: 0, resolved: 0 });
      }

      allTickets.forEach(ticket => {
        const createdDate = format(new Date(ticket.created_at), 'MMM dd');
        if (trendMap.has(createdDate)) {
          trendMap.get(createdDate)!.opened++;
        }
        if (ticket.resolved_at) {
          const resolvedDate = format(new Date(ticket.resolved_at), 'MMM dd');
          if (trendMap.has(resolvedDate)) {
            trendMap.get(resolvedDate)!.resolved++;
          }
        }
      });

      const ticketTrends: TicketTrend[] = Array.from(trendMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));

      // Category breakdown with resolution times
      const categoryMap = new Map<string, { count: number; resolutionHours: number[] }>();
      allTickets.forEach(ticket => {
        const categoryName = (ticket.category as any)?.name || 'Uncategorized';
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, { count: 0, resolutionHours: [] });
        }
        const cat = categoryMap.get(categoryName)!;
        cat.count++;
        if (ticket.resolved_at) {
          const hours = differenceInHours(new Date(ticket.resolved_at), new Date(ticket.created_at));
          cat.resolutionHours.push(hours);
        }
      });

      const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          count: data.count,
          avgResolutionHours: data.resolutionHours.length > 0
            ? data.resolutionHours.reduce((a, b) => a + b, 0) / data.resolutionHours.length
            : null,
        }))
        .sort((a, b) => b.count - a.count);

      // Resolution metrics
      const resolvedTickets = allTickets.filter(t => t.resolved_at);
      const resolutionHours = resolvedTickets.map(t => 
        differenceInHours(new Date(t.resolved_at!), new Date(t.created_at))
      );

      const sortedHours = [...resolutionHours].sort((a, b) => a - b);
      const medianHours = sortedHours.length > 0
        ? sortedHours[Math.floor(sortedHours.length / 2)]
        : null;

      const resolvedIn24h = resolutionHours.filter(h => h <= 24).length;
      const resolvedIn48h = resolutionHours.filter(h => h <= 48).length;

      // First response time metrics
      const respondedTickets = allTickets.filter(t => t.first_response_at);
      const firstResponseHours = respondedTickets.map(t => 
        differenceInHours(new Date(t.first_response_at!), new Date(t.created_at))
      );

      const sortedResponseHours = [...firstResponseHours].sort((a, b) => a - b);
      const medianResponseHours = sortedResponseHours.length > 0
        ? sortedResponseHours[Math.floor(sortedResponseHours.length / 2)]
        : null;

      const respondedIn1h = firstResponseHours.filter(h => h <= 1).length;
      const respondedIn4h = firstResponseHours.filter(h => h <= 4).length;

      const resolutionMetrics: ResolutionMetrics = {
        avgResolutionHours: resolutionHours.length > 0
          ? resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length
          : null,
        medianResolutionHours: medianHours,
        avgFirstResponseHours: firstResponseHours.length > 0
          ? firstResponseHours.reduce((a, b) => a + b, 0) / firstResponseHours.length
          : null,
        medianFirstResponseHours: medianResponseHours,
        resolvedCount: resolvedTickets.length,
        openCount: allTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length,
        percentResolvedIn24h: resolvedTickets.length > 0
          ? (resolvedIn24h / resolvedTickets.length) * 100
          : 0,
        percentResolvedIn48h: resolvedTickets.length > 0
          ? (resolvedIn48h / resolvedTickets.length) * 100
          : 0,
        percentRespondedIn1h: respondedTickets.length > 0
          ? (respondedIn1h / respondedTickets.length) * 100
          : 0,
        percentRespondedIn4h: respondedTickets.length > 0
          ? (respondedIn4h / respondedTickets.length) * 100
          : 0,
      };

      // Urgency breakdown
      const urgencyMap = new Map<string, { count: number; openCount: number }>();
      allTickets.forEach(ticket => {
        const urgency = ticket.urgency || 'medium';
        if (!urgencyMap.has(urgency)) {
          urgencyMap.set(urgency, { count: 0, openCount: 0 });
        }
        const u = urgencyMap.get(urgency)!;
        u.count++;
        if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
          u.openCount++;
        }
      });

      const urgencyOrder = ['low', 'medium', 'high', 'critical'];
      const urgencyBreakdown: UrgencyBreakdown[] = urgencyOrder
        .filter(u => urgencyMap.has(u))
        .map(urgency => ({
          urgency,
          ...urgencyMap.get(urgency)!,
        }));

      // Friction points - pages with most tickets
      const pageMap = new Map<string, { count: number; urgencies: number[] }>();
      allTickets.forEach(ticket => {
        const page = ticket.submitted_from_page || 'Unknown';
        if (!pageMap.has(page)) {
          pageMap.set(page, { count: 0, urgencies: [] });
        }
        const p = pageMap.get(page)!;
        p.count++;
        p.urgencies.push(urgencyToNumber(ticket.urgency || 'medium'));
      });

      const frictionPoints: FrictionPoint[] = Array.from(pageMap.entries())
        .map(([page, data]) => ({
          page: page.replace(/^\//, '').replace(/-/g, ' ') || 'Home',
          ticketCount: data.count,
          avgUrgency: data.urgencies.reduce((a, b) => a + b, 0) / data.urgencies.length,
        }))
        .sort((a, b) => b.ticketCount - a.ticketCount)
        .slice(0, 10);

      // Status breakdown
      const statusMap = new Map<string, number>();
      allTickets.forEach(ticket => {
        const status = ticket.status || 'open';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });

      const statusBreakdown: StatusBreakdown[] = Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

      // Ticket counts
      const sevenDaysAgo = subDays(now, 7);
      const ticketsLast7Days = allTickets.filter(t => 
        new Date(t.created_at) >= sevenDaysAgo
      ).length;

      return {
        ticketTrends,
        categoryBreakdown,
        resolutionMetrics,
        urgencyBreakdown,
        frictionPoints,
        statusBreakdown,
        totalTickets: allTickets.length,
        ticketsLast7Days,
        ticketsLast30Days: allTickets.length,
      };
    },
    enabled: isAdmin,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
