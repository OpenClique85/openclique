/**
 * =============================================================================
 * SquadChatViewer - Admin view of squad chat with moderation tools
 * =============================================================================
 * 
 * Features:
 * - Full message transcript
 * - Hide/delete messages
 * - Send admin messages
 * - Export transcript
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MessageCircle, 
  Search, 
  MoreVertical, 
  EyeOff, 
  Flag, 
  Download,
  Send,
  Loader2,
  Bot,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  squad_id: string;
  sender_id: string;
  message: string;
  sender_type: 'user' | 'admin' | 'buggs' | 'system';
  hidden_at: string | null;
  hidden_by: string | null;
  hide_reason: string | null;
  created_at: string;
  sender_name?: string;
}

interface SquadChatViewerProps {
  squadId: string;
  squadName: string;
}

export function SquadChatViewer({ squadId, squadName }: SquadChatViewerProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [sendAs, setSendAs] = useState<'admin' | 'buggs'>('admin');
  const [isSending, setIsSending] = useState(false);
  const [hideDialog, setHideDialog] = useState<{
    open: boolean;
    messageId: string;
    reason: string;
  }>({ open: false, messageId: '', reason: '' });

  useEffect(() => {
    fetchMessages();
  }, [squadId]);

  const fetchMessages = async () => {
    setIsLoading(true);
    
    const { data: messagesData, error } = await supabase
      .from('squad_chat_messages')
      .select('*')
      .eq('squad_id', squadId)
      .order('created_at', { ascending: true });

    if (!error && messagesData) {
      // Get sender profiles
      const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

      setMessages(messagesData.map(m => ({
        ...m,
        sender_type: (m.sender_type as 'user' | 'admin' | 'buggs' | 'system') || 'user',
        sender_name: profileMap.get(m.sender_id) || 'Unknown'
      })));
    }
    
    setIsLoading(false);
  };

  const handleHideMessage = async () => {
    if (!hideDialog.messageId || !user) return;

    const { error } = await supabase
      .from('squad_chat_messages')
      .update({
        hidden_at: new Date().toISOString(),
        hidden_by: user.id,
        hide_reason: hideDialog.reason || 'Hidden by admin'
      })
      .eq('id', hideDialog.messageId);

    if (error) {
      toast.error('Failed to hide message');
    } else {
      toast.success('Message hidden');
      fetchMessages();
    }

    setHideDialog({ open: false, messageId: '', reason: '' });
  };

  const handleUnhideMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('squad_chat_messages')
      .update({
        hidden_at: null,
        hidden_by: null,
        hide_reason: null
      })
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to unhide message');
    } else {
      toast.success('Message restored');
      fetchMessages();
    }
  };

  const handleSendAdminMessage = async () => {
    if (!adminMessage.trim() || !user) return;

    setIsSending(true);

    const { error } = await supabase
      .from('squad_chat_messages')
      .insert({
        squad_id: squadId,
        sender_id: user.id,
        message: adminMessage,
        sender_type: sendAs
      });

    if (error) {
      toast.error('Failed to send message');
    } else {
      toast.success(`Message sent as ${sendAs === 'buggs' ? 'Buggs' : 'Admin'}`);
      setAdminMessage('');
      fetchMessages();
    }

    setIsSending(false);
  };

  const handleExportTranscript = () => {
    const transcript = messages
      .filter(m => showHidden || !m.hidden_at)
      .map(m => ({
        timestamp: m.created_at,
        sender: m.sender_name,
        sender_type: m.sender_type,
        message: m.message,
        hidden: !!m.hidden_at
      }));

    const blob = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `squad-chat-${squadId}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transcript exported');
  };

  const filteredMessages = messages.filter(m => {
    if (!showHidden && m.hidden_at) return false;
    if (searchQuery && !m.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getSenderTypeIcon = (type: string) => {
    switch (type) {
      case 'admin': return <ShieldCheck className="h-3 w-3 text-primary" />;
      case 'buggs': return <Bot className="h-3 w-3 text-orange-500" />;
      case 'system': return <AlertTriangle className="h-3 w-3 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat Log - {squadName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHidden(!showHidden)}
            >
              <EyeOff className="h-4 w-4 mr-1" />
              {showHidden ? 'Hide Hidden' : 'Show Hidden'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportTranscript}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Messages */}
        <ScrollArea className="h-[400px] border rounded-lg p-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.hidden_at
                      ? 'bg-destructive/10 border border-destructive/20'
                      : msg.sender_type !== 'user'
                      ? 'bg-primary/10'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{msg.sender_name}</span>
                        {getSenderTypeIcon(msg.sender_type)}
                        {msg.sender_type !== 'user' && (
                          <Badge variant="secondary" className="text-xs">
                            {msg.sender_type}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                        </span>
                        {msg.hidden_at && (
                          <Badge variant="destructive" className="text-xs">
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                      {msg.hide_reason && (
                        <p className="text-xs text-destructive mt-1">
                          Reason: {msg.hide_reason}
                        </p>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {msg.hidden_at ? (
                          <DropdownMenuItem onClick={() => handleUnhideMessage(msg.id)}>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Restore Message
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setHideDialog({ open: true, messageId: msg.id, reason: '' })}
                            className="text-destructive"
                          >
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide Message
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Flag className="h-4 w-4 mr-2" />
                          Flag for Review
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Admin Message Input */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Send Admin Message</p>
          <div className="flex gap-2">
            <div className="flex-1">
              <Textarea
                placeholder={`Send message as ${sendAs === 'buggs' ? 'Buggs 🐰' : 'OpenClique Admin'}...`}
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {sendAs === 'buggs' ? <Bot className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSendAs('admin')}>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    As Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSendAs('buggs')}>
                    <Bot className="h-4 w-4 mr-2" />
                    As Buggs 🐰
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                onClick={handleSendAdminMessage}
                disabled={!adminMessage.trim() || isSending}
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Hide Message Dialog */}
      <AlertDialog open={hideDialog.open} onOpenChange={(open) => setHideDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This message will be hidden from squad members but preserved in admin logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Reason for hiding (optional)"
              value={hideDialog.reason}
              onChange={(e) => setHideDialog(prev => ({ ...prev, reason: e.target.value }))}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleHideMessage}>Hide Message</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
