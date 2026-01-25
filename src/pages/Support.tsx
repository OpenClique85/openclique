/**
 * =============================================================================
 * SUPPORT PAGE - User's ticket list and detail view
 * =============================================================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useMyTickets } from '@/hooks/useSupportTickets';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SupportTicketModal } from '@/components/support/SupportTicketModal';
import { Loader2, Plus, MessageSquare, AlertTriangle, Clock, CheckCircle2, Search, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-500', icon: Clock },
  investigating: { label: 'Investigating', color: 'bg-amber-500', icon: Search },
  waiting_response: { label: 'Waiting on you', color: 'bg-purple-500', icon: MessageSquare },
  resolved: { label: 'Resolved', color: 'bg-green-500', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-muted-foreground', icon: CheckCircle2 },
};

const URGENCY_CONFIG = {
  low: { label: 'Low', variant: 'secondary' as const },
  medium: { label: 'Medium', variant: 'outline' as const },
  urgent: { label: 'Urgent', variant: 'destructive' as const },
};

export default function Support() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: tickets, isLoading: ticketsLoading } = useMyTickets();
  const [modalOpen, setModalOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your support tickets.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isLoading = authLoading || ticketsLoading;
  const hasTickets = tickets && tickets.length > 0;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Support</h1>
            <p className="text-muted-foreground mt-1">View and manage your support tickets</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !hasTickets ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">No tickets yet</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Have a question or issue? Create a support ticket and we'll help you out.
              </p>
              <Button onClick={() => setModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const status = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
              const urgency = URGENCY_CONFIG[ticket.urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.low;
              const StatusIcon = status.icon;

              return (
                <Card
                  key={ticket.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigate(`/support/${ticket.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={urgency.variant} className="text-xs">
                            {urgency.label}
                          </Badge>
                          {(ticket.category as any)?.requires_escalation && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <CardTitle className="text-base line-clamp-1">
                          {(ticket.category as any)?.name || 'Support Request'}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {ticket.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className={cn('h-2 w-2 rounded-full', status.color)} />
                        <StatusIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground hidden sm:inline">
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                      </span>
                      {(ticket.quest as any)?.title && (
                        <span className="truncate">
                          Quest: {(ticket.quest as any).title}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      <SupportTicketModal
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
