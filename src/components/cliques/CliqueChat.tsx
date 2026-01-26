/**
 * CliqueChat - Real-time chat for clique members
 * Awards XP on first message sent (for tutorial completion)
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAwardXP } from '@/hooks/useUserXP';
import { useTutorial } from '@/components/tutorial/TutorialProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  user_id: string;
  display_name: string;
  message: string;
  created_at: string;
  is_hidden?: boolean;
}

interface CliqueChatProps {
  cliqueId: string;
  isLeader: boolean;
}

export function CliqueChat({ cliqueId, isLeader }: CliqueChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const awardXP = useAwardXP();
  const { markActionComplete, completedActions } = useTutorial();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAwardedFirstMessageXP, setHasAwardedFirstMessageXP] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data: messagesData, error } = await supabase
      .from('squad_chat_messages')
      .select('id, sender_id, message, created_at')
      .eq('squad_id', cliqueId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching messages:', error);
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
      user_id: msg.sender_id,
      display_name: profilesMap.get(msg.sender_id) || 'Unknown',
      message: msg.message,
      created_at: msg.created_at || '',
      is_hidden: false,
    }));

    setMessages(processed);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`clique-chat-${cliqueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'squad_chat_messages',
          filter: `squad_id=eq.${cliqueId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          // Get display name for new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', newMsg.user_id)
            .maybeSingle();

          const chatMsg: ChatMessage = {
            id: newMsg.id,
            user_id: newMsg.user_id,
            display_name: profile?.display_name || 'Unknown',
            message: newMsg.message,
            created_at: newMsg.created_at,
            is_hidden: newMsg.is_hidden,
          };

          if (!chatMsg.is_hidden) {
            setMessages(prev => [...prev, chatMsg]);
          }
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
      .from('squad_chat_messages')
      .insert({
        squad_id: cliqueId,
        sender_id: user.id,
        message: newMessage.trim(),
      });

    setIsSending(false);

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setNewMessage('');
    
    // Mark tutorial action complete and award XP for first message
    if (!hasAwardedFirstMessageXP && !completedActions.has('squad_chat')) {
      setHasAwardedFirstMessageXP(true);
      markActionComplete('squad_chat');
      
      try {
        await awardXP.mutateAsync({
          amount: 10,
          source: 'squad_chat_first',
          sourceId: cliqueId,
        });
        
        toast({
          title: (
            <span className="flex items-center gap-2">
              First message sent! <Sparkles className="h-4 w-4 text-sunset" /> +10 XP
            </span>
          ) as unknown as string,
          description: 'You\'re connecting with your clique!',
        });
      } catch {
        // XP award is non-critical
      }
    }
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
    <Card className="flex flex-col h-[500px]">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.user_id === user?.id;
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
  );
}
