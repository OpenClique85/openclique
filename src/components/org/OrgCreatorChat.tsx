/**
 * OrgCreatorChat - Real-time chat between org admins and creators for accepted requests
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, MessageCircle } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  sender_type: 'creator' | 'org_admin';
  message: string;
  read_at: string | null;
  created_at: string;
}

interface OrgCreatorChatProps {
  requestId: string;
  requestTitle: string;
  creatorProfile?: {
    id: string;
    user_id: string;
    display_name: string;
    avatar_url?: string | null;
  };
  orgInfo?: {
    name: string;
    logo_url?: string | null;
  };
  requesterId: string;
  userRole: 'creator' | 'org_admin';
}

export function OrgCreatorChat({
  requestId,
  requestTitle,
  creatorProfile,
  orgInfo,
  requesterId,
  userRole,
}: OrgCreatorChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch messages
  const fetchMessages = async () => {
    const { data, error } = await (supabase
      .from('org_creator_messages' as any)
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true }) as any);

    if (error) {
      console.error('Failed to fetch messages:', error);
    } else {
      setMessages((data || []) as Message[]);
    }
    setIsLoading(false);
  };

  // Subscribe to new messages
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`org-creator-chat-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'org_creator_messages',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!user) return;

    const unreadMessages = messages.filter(
      (m) => m.sender_id !== user.id && !m.read_at
    );

    if (unreadMessages.length > 0) {
      (supabase
        .from('org_creator_messages' as any)
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadMessages.map((m) => m.id)) as any)
        .then(({ error }: any) => {
          if (error) console.error('Failed to mark messages as read:', error);
        });
    }
  }, [messages, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    setIsSending(true);

    try {
      const { error } = await (supabase.from('org_creator_messages' as any).insert({
        request_id: requestId,
        sender_id: user.id,
        sender_type: userRole,
        message: newMessage.trim(),
      }) as any);

      if (error) throw error;

      // Notify the other party
      const recipientId = userRole === 'creator' ? requesterId : creatorProfile?.user_id;
      const senderName = userRole === 'creator' ? creatorProfile?.display_name : orgInfo?.name;

      if (recipientId) {
        await supabase.from('notifications').insert({
          user_id: recipientId,
          type: 'org_creator_message' as any,
          title: `💬 New message from ${senderName}`,
          body: `Re: ${requestTitle} - "${newMessage.trim().substring(0, 50)}${newMessage.length > 50 ? '...' : ''}"`,
        });
      }

      setNewMessage('');
      inputRef.current?.focus();
    } catch (error: any) {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, h:mm a');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px] border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <MessageCircle className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-medium text-sm">Discussion Thread</h3>
          <p className="text-xs text-muted-foreground">Re: {requestTitle}</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageCircle className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isOwnMessage = msg.sender_id === user?.id;
              const senderIsCreator = msg.sender_type === 'creator';
              const senderName = senderIsCreator
                ? creatorProfile?.display_name || 'Creator'
                : orgInfo?.name || 'Org Admin';
              const senderAvatar = senderIsCreator
                ? creatorProfile?.avatar_url
                : orgInfo?.logo_url;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3',
                    isOwnMessage && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={senderAvatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {senderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      'flex flex-col max-w-[75%]',
                      isOwnMessage && 'items-end'
                    )}
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-medium">{senderName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm',
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-[100px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
