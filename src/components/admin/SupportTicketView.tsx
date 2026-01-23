/**
 * =============================================================================
 * ADMIN SUPPORT TICKET VIEW
 * Detailed ticket view with messaging, status controls, and internal notes
 * =============================================================================
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminTicketDetail, useUpdateTicket, useAddAdminMessage, useAdminUsers } from '@/hooks/useAdminSupport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, ArrowLeft, Send, User, Shield, AlertTriangle,
  ExternalLink, Paperclip, Clock, CheckCircle2, MessageSquare,
  Search, UserPlus, StickyNote, Save
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SupportTicketViewProps {
  ticketId: string;
  onBack: () => void;
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: 'bg-blue-500' },
  { value: 'investigating', label: 'Investigating', color: 'bg-amber-500' },
  { value: 'waiting_response', label: 'Waiting on User', color: 'bg-purple-500' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-500' },
  { value: 'closed', label: 'Closed', color: 'bg-muted-foreground' },
];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'urgent', label: 'Urgent' },
];

export function SupportTicketView({ ticketId, onBack }: SupportTicketViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { ticket, messages, attachments, isLoading, refetch } = useAdminTicketDetail(ticketId);
  const { data: adminUsers } = useAdminUsers();
  const updateTicket = useUpdateTicket();
  const addMessage = useAddAdminMessage();

  const [newMessage, setNewMessage] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [notesEdited, setNotesEdited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize internal notes from ticket
  useEffect(() => {
    if (ticket?.internal_notes && !notesEdited) {
      setInternalNotes(ticket.internal_notes);
    }
  }, [ticket?.internal_notes, notesEdited]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleStatusChange = async (status: string) => {
    try {
      await updateTicket.mutateAsync({
        ticketId,
        updates: {
          status,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        },
      });
      toast({ title: 'Status updated' });
    } catch (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleUrgencyChange = async (urgency: string) => {
    try {
      await updateTicket.mutateAsync({
        ticketId,
        updates: { urgency },
      });
      toast({ title: 'Urgency updated' });
    } catch (error) {
      toast({ title: 'Failed to update urgency', variant: 'destructive' });
    }
  };

  const handleAssignmentChange = async (adminId: string) => {
    try {
      await updateTicket.mutateAsync({
        ticketId,
        updates: { assigned_admin_id: adminId === 'unassigned' ? null : adminId },
      });
      toast({ title: adminId === 'unassigned' ? 'Assignment removed' : 'Ticket assigned' });
    } catch (error) {
      toast({ title: 'Failed to update assignment', variant: 'destructive' });
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateTicket.mutateAsync({
        ticketId,
        updates: { internal_notes: internalNotes },
      });
      setNotesEdited(false);
      toast({ title: 'Notes saved' });
    } catch (error) {
      toast({ title: 'Failed to save notes', variant: 'destructive' });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await addMessage.mutateAsync({
        ticketId,
        message: newMessage.trim(),
      });
      setNewMessage('');

      // Auto-update status to waiting_response if currently open
      if (ticket?.status === 'open' || ticket?.status === 'investigating') {
        await updateTicket.mutateAsync({
          ticketId,
          updates: { status: 'waiting_response' },
        });
      }
    } catch (error) {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Ticket not found</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inbox
        </Button>
      </div>
    );
  }

  const category = ticket.category as any;
  const ticketUser = ticket.user as any;
  const quest = ticket.quest as any;
  const assignedAdmin = ticket.assigned_admin as any;
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === ticket.status) || STATUS_OPTIONS[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inbox
        </Button>
        <code className="text-xs bg-muted px-2 py-1 rounded">{ticket.id.slice(0, 8)}</code>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ticket Header Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant={ticket.urgency === 'urgent' ? 'destructive' : ticket.urgency === 'medium' ? 'outline' : 'secondary'}>
                      {ticket.urgency}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <div className={cn('h-2 w-2 rounded-full', currentStatus.color)} />
                      <span className="text-sm">{currentStatus.label}</span>
                    </div>
                    {category?.requires_escalation && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Escalated
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{category?.name || 'Support Request'}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>

              {/* User Info */}
              <div className="mt-4 pt-4 border-t flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{ticketUser?.display_name || 'Unknown User'}</p>
                  <p className="text-xs text-muted-foreground">{ticketUser?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="flex flex-col h-[400px]">
            <CardHeader className="flex-shrink-0 pb-2 border-b">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">No messages yet.</p>
                  <p className="text-xs mt-1">Send a reply below.</p>
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isAdmin = msg.sender_role === 'admin';
                  const isSystem = msg.sender_role === 'system';
                  const isOwnMessage = msg.sender_id === user?.id;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-3',
                        isAdmin && 'flex-row-reverse'
                      )}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={cn(
                          isAdmin && 'bg-primary text-primary-foreground',
                          isSystem && 'bg-muted'
                        )}>
                          {isAdmin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn('flex flex-col max-w-[75%]', isAdmin && 'items-end')}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {isAdmin ? (isOwnMessage ? 'You' : 'Support') : ticketUser?.display_name || 'User'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className={cn(
                          'rounded-lg px-3 py-2 text-sm',
                          isAdmin
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </CardContent>
            <div className="flex-shrink-0 border-t p-3">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a reply..."
                  rows={2}
                  className="resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || addMessage.isPending}
                  size="icon"
                  className="flex-shrink-0"
                >
                  {addMessage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
                <Select value={ticket.status} onValueChange={handleStatusChange} disabled={updateTicket.isPending}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn('h-2 w-2 rounded-full', opt.color)} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Urgency</label>
                <Select value={ticket.urgency} onValueChange={handleUrgencyChange} disabled={updateTicket.isPending}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
                  <UserPlus className="h-3 w-3" />
                  Assign To
                </label>
                <Select
                  value={assignedAdmin?.id || 'unassigned'}
                  onValueChange={handleAssignmentChange}
                  disabled={updateTicket.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {adminUsers?.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={internalNotes}
                onChange={(e) => {
                  setInternalNotes(e.target.value);
                  setNotesEdited(true);
                }}
                placeholder="Add private notes (not visible to user)..."
                rows={4}
                className="text-sm"
              />
              {notesEdited && (
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={updateTicket.isPending}
                  className="w-full"
                >
                  {updateTicket.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Notes
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(ticket.created_at), 'MMM d, h:mm a')}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved</span>
                  <span>{format(new Date(ticket.resolved_at), 'MMM d, h:mm a')}</span>
                </div>
              )}
              {ticket.submitted_from_page && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Page</span>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{ticket.submitted_from_page}</code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Quest */}
          {quest && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Related Quest</CardTitle>
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
                <CardTitle className="text-sm font-medium">Attachments ({attachments.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {attachments.map((att: any) => (
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
    </div>
  );
}
