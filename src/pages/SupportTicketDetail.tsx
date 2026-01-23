/**
 * =============================================================================
 * SUPPORT TICKET DETAIL - Individual ticket view with message thread
 * =============================================================================
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useTicketDetail } from '@/hooks/useSupportTickets';
import { TicketThread } from '@/components/support/TicketThread';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, AlertTriangle, ExternalLink, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-500' },
  investigating: { label: 'Investigating', color: 'bg-amber-500' },
  waiting_response: { label: 'Waiting on you', color: 'bg-purple-500' },
  resolved: { label: 'Resolved', color: 'bg-green-500' },
  closed: { label: 'Closed', color: 'bg-muted-foreground' },
};

const URGENCY_CONFIG = {
  low: { label: 'Low', variant: 'secondary' as const },
  medium: { label: 'Medium', variant: 'outline' as const },
  urgent: { label: 'Urgent', variant: 'destructive' as const },
};

export default function SupportTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { ticket, messages, attachments, isLoading, error } = useTicketDetail(ticketId);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view this ticket.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Ticket Not Found</h1>
          <p className="text-muted-foreground mb-6">This ticket doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/support')}>Back to Support</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const status = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
  const urgency = URGENCY_CONFIG[ticket.urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.low;
  const category = ticket.category as any;
  const quest = ticket.quest as any;
  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/support')}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Message Thread */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={urgency.variant}>{urgency.label}</Badge>
                      <div className="flex items-center gap-1.5">
                        <div className={cn('h-2 w-2 rounded-full', status.color)} />
                        <span className="text-sm text-muted-foreground">{status.label}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">
                      {category?.name || 'Support Request'}
                    </CardTitle>
                  </div>
                  {category?.requires_escalation && (
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              <div className="flex-1 overflow-hidden">
                <TicketThread
                  ticketId={ticket.id}
                  messages={messages as any}
                  isResolved={isResolved}
                />
              </div>
            </Card>
          </div>

          {/* Sidebar - Ticket Details */}
          <div className="space-y-4">
            {/* Description */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket ID</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">
                    {ticket.id.slice(0, 8)}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
                {ticket.resolved_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolved</span>
                    <span>{format(new Date(ticket.resolved_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Quest */}
            {quest && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Related Quest
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    to={`/quests/${quest.slug}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    {quest.title}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Attachments ({attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span className="truncate">{att.file_name}</span>
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
