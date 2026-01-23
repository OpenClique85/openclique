/**
 * =============================================================================
 * TICKET THREAD - Message thread for ticket detail view
 * =============================================================================
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAddTicketMessage } from '@/hooks/useSupportTickets';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Send, User, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
  sender?: {
    id: string;
    display_name: string;
  } | null;
}

interface TicketThreadProps {
  ticketId: string;
  messages: Message[];
  isResolved?: boolean;
}

export function TicketThread({ ticketId, messages, isResolved }: TicketThreadProps) {
  const { user } = useAuth();
  const addMessage = useAddTicketMessage();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || addMessage.isPending) return;

    try {
      await addMessage.mutateAsync({
        ticketId,
        message: newMessage.trim(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs mt-1">An admin will respond to your ticket soon.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            const isAdmin = msg.sender_role === 'admin';
            const isSystem = msg.sender_role === 'system';

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3',
                  isOwn && 'flex-row-reverse'
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
                <div className={cn(
                  'flex flex-col max-w-[75%]',
                  isOwn && 'items-end'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {isOwn ? 'You' : isAdmin ? 'OpenClique Support' : msg.sender?.display_name || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : isAdmin
                        ? 'bg-primary/10 border border-primary/20'
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
      </div>

      {/* Input */}
      {!isResolved ? (
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={2}
              className="resize-none"
            />
            <Button
              onClick={handleSend}
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
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      ) : (
        <div className="border-t p-4 bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            This ticket has been resolved. Create a new ticket if you need more help.
          </p>
        </div>
      )}
    </div>
  );
}
