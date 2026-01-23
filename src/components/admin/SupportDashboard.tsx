/**
 * =============================================================================
 * ADMIN SUPPORT DASHBOARD
 * Main support inbox with filtering, assignment, and ticket management
 * =============================================================================
 */

import { useState } from 'react';
import { useAllTickets, useTicketStats, useAllIssueCategories, useAdminUsers } from '@/hooks/useAdminSupport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SupportTicketView } from './SupportTicketView';
import { Loader2, Inbox, AlertTriangle, Clock, Search, CheckCircle2, MessageSquare, Filter, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'waiting_response', label: 'Waiting Response' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const URGENCY_OPTIONS = [
  { value: 'all', label: 'All Urgencies' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'Open', color: 'bg-blue-500', icon: Clock },
  investigating: { label: 'Investigating', color: 'bg-amber-500', icon: Search },
  waiting_response: { label: 'Waiting', color: 'bg-purple-500', icon: MessageSquare },
  resolved: { label: 'Resolved', color: 'bg-green-500', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-muted-foreground', icon: CheckCircle2 },
};

const URGENCY_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  low: { label: 'Low', variant: 'secondary' },
  medium: { label: 'Medium', variant: 'outline' },
  urgent: { label: 'Urgent', variant: 'destructive' },
};

export function SupportDashboard() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    urgency: '',
    categoryId: '',
    assignedAdminId: '',
    search: '',
  });

  const { data: stats, isLoading: statsLoading } = useTicketStats();
  const { data: tickets, isLoading: ticketsLoading } = useAllTickets({
    status: filters.status || undefined,
    urgency: filters.urgency || undefined,
    categoryId: filters.categoryId || undefined,
    assignedAdminId: filters.assignedAdminId || undefined,
    search: filters.search || undefined,
  });
  const { data: categories } = useAllIssueCategories();
  const { data: adminUsers } = useAdminUsers();

  const hasActiveFilters = filters.status || filters.urgency || filters.categoryId || filters.assignedAdminId || filters.search;

  const clearFilters = () => {
    setFilters({ status: '', urgency: '', categoryId: '', assignedAdminId: '', search: '' });
  };

  // If a ticket is selected, show the detail view
  if (selectedTicketId) {
    return (
      <SupportTicketView
        ticketId={selectedTicketId}
        onBack={() => setSelectedTicketId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{statsLoading ? '—' : stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Total Tickets</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{statsLoading ? '—' : stats?.open || 0}</div>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{statsLoading ? '—' : stats?.investigating || 0}</div>
            <p className="text-xs text-muted-foreground">Investigating</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{statsLoading ? '—' : stats?.waitingResponse || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting Reply</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{statsLoading ? '—' : stats?.urgent || 0}</div>
            <p className="text-xs text-muted-foreground">Urgent</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="pl-9"
            />
          </div>
          <Select
            value={filters.status || 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v === 'all' ? '' : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.urgency || 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, urgency: v === 'all' ? '' : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              {URGENCY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.categoryId || 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, categoryId: v === 'all' ? '' : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.assignedAdminId || 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, assignedAdminId: v === 'all' ? '' : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assigned To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {adminUsers?.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Tickets
            {tickets && <Badge variant="secondary">{tickets.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ticketsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !tickets || tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Inbox className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No tickets found</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket: any) => {
                const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                const urgency = URGENCY_CONFIG[ticket.urgency] || URGENCY_CONFIG.low;
                const category = ticket.category;
                const user = ticket.user;
                const assignedAdmin = ticket.assigned_admin;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
                      ticket.urgency === 'urgent' && ticket.status !== 'resolved' && ticket.status !== 'closed' && 'border-destructive/50 bg-destructive/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant={urgency.variant} className="text-xs">
                            {urgency.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {category?.name || 'Unknown'}
                          </Badge>
                          {category?.requires_escalation && (
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </div>
                        <p className="text-sm font-medium line-clamp-1">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{user?.display_name || user?.email || 'Unknown user'}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                          {assignedAdmin && (
                            <>
                              <span>•</span>
                              <span className="text-primary">→ {assignedAdmin.display_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2 w-2 rounded-full', status.color)} />
                        <StatusIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
