/**
 * CliquePersistentChat - Real-time chat for persistent cliques
 * Uses clique_chat_messages table (separate from quest-based squad_chat_messages)
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Compass } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SuggestQuestModal } from './SuggestQuestModal';

interface ChatMessage {
  id: string;
  sender_id: string;
  display_name: string;
  message: string;
  created_at: string;
  sender_type: string;
}

interface CliquePersistentChatProps {
  cliqueId: string;
  cliqueName: string;
}

export function CliquePersistentChat({ cliqueId, cliqueName }: CliquePersistentChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestQuest, setShowSuggestQuest] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data: messagesData, error } = await supabase
      .from('clique_chat_messages')
      .select('id, sender_id, message, created_at, sender_type')
      .eq('clique_id', cliqueId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching clique messages:', error);
      setIsLoading(false);
      return;
    }

    // Get user display names
    const userIds = [...new Set((messagesData || []).map(m => m.sender_id))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('profiles').select('id, display_name').in('id', userIds)
      : { data: [] };

    const profilesMap = new Map((profiles || []).map(p => [p.id, p.display_name]));

    const processed: ChatMessage[] = (messagesData || []).map(msg => ({
      id: msg.id,
      sender_id: msg.sender_id,
      display_name: profilesMap.get(msg.sender_id) || 'Unknown',
      message: msg.message,
      created_at: msg.created_at || '',
      sender_type: msg.sender_type || 'user',
    }));

    setMessages(processed);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`clique-persistent-chat-${cliqueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clique_chat_messages',
          filter: `clique_id=eq.${cliqueId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          // Get display name for new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', newMsg.sender_id)
            .maybeSingle();

          const chatMsg: ChatMessage = {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            display_name: profile?.display_name || 'Unknown',
            message: newMsg.message,
            created_at: newMsg.created_at,
            sender_type: newMsg.sender_type || 'user',
          };

          setMessages(prev => [...prev, chatMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cliqueId]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    setIsSending(true);
    const { error } = await supabase
      .from('clique_chat_messages')
      .insert({
        clique_id: cliqueId,
        sender_id: user.id,
        message: newMessage.trim(),
        sender_type: 'user',
      });

    setIsSending(false);

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="flex flex-col h-[500px]">
        {/* Suggest Quest Button */}
        <div className="p-3 border-b bg-muted/30">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2"
            onClick={() => setShowSuggestQuest(true)}
          >
            <Compass className="h-4 w-4" />
            Suggest a Quest
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center px-4">
              No messages yet. Start chatting with your clique or suggest a quest!
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                const isSystem = msg.sender_type === 'system';
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1.5 rounded-full">
                        {msg.message}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-medium mb-0.5 opacity-70">
                          {msg.display_name}
                        </p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              disabled={isSending}
            />
            <Button onClick={handleSend} disabled={isSending || !newMessage.trim()}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {user && (
        <SuggestQuestModal
          open={showSuggestQuest}
          onOpenChange={setShowSuggestQuest}
          cliqueId={cliqueId}
          cliqueName={cliqueName}
          userId={user.id}
        />
      )}
    </>
  );
}
