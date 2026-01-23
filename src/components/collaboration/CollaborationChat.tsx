import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { createNotification } from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  collaboration_type: string;
  collaboration_id: string;
  sender_id: string;
  sender_role: 'org_admin' | 'creator' | 'sponsor';
  message: string;
  attachments: unknown | null;
  read_at: string | null;
  created_at: string;
}

export interface CollaborationChatProps {
  collaborationType: 'org_creator' | 'org_sponsor' | 'sponsor_creator' | 'sponsor_org';
  collaborationId: string;
  currentUserRole: 'org_admin' | 'creator' | 'sponsor';
  otherPartyName: string;
  otherPartyAvatar?: string | null;
  otherPartyUserId?: string;
  title?: string;
}

export function CollaborationChat({
  collaborationType,
  collaborationId,
  currentUserRole,
  otherPartyName,
  otherPartyAvatar,
  otherPartyUserId,
  title
}: CollaborationChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('collaboration_messages')
      .select('*')
      .eq('collaboration_type', collaborationType)
      .eq('collaboration_id', collaborationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, [collaborationType, collaborationId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`collab-${collaborationType}-${collaborationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collaboration_messages',
          filter: `collaboration_id=eq.${collaborationId}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.collaboration_type === collaborationType) {
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [collaborationType, collaborationId]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    if (!user) return;
    
    const unreadMessages = messages.filter(
      m => m.sender_id !== user.id && !m.read_at
    );

    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map(m => m.id);
      supabase
        .from('collaboration_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds)
        .then();
    }
  }, [messages, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    setIsSending(true);
    const { error } = await supabase
      .from('collaboration_messages')
      .insert({
        collaboration_type: collaborationType,
        collaboration_id: collaborationId,
        sender_id: user.id,
        sender_role: currentUserRole,
        message: newMessage.trim()
      });

    if (!error) {
      setNewMessage('');
      
      // Notify the other party
      if (otherPartyUserId) {
        await createNotification({
          userId: otherPartyUserId,
          type: 'collaboration_message',
          title: `New message from ${currentUserRole === 'org_admin' ? 'organization' : currentUserRole}`,
          body: newMessage.trim().substring(0, 100) + (newMessage.length > 100 ? '...' : '')
        });
      }
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'org_admin': return 'Org Admin';
      case 'creator': return 'Creator';
      case 'sponsor': return 'Sponsor';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherPartyAvatar || undefined} />
          <AvatarFallback>{otherPartyName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{otherPartyName}</p>
          {title && <p className="text-sm text-muted-foreground">{title}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-80">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {isOwn ? (
                    <AvatarFallback>You</AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={otherPartyAvatar || undefined} />
                      <AvatarFallback>{otherPartyName.charAt(0)}</AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {isOwn ? 'You' : otherPartyName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getRoleLabel(msg.sender_role)}
                    </span>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {formatMessageTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="h-11 w-11 flex-shrink-0"
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
