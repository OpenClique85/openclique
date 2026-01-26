import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminDirectMessages,
  useAdminDMDetail,
  useRecipientSearch,
  useSendAdminDM,
  useAddDMReply,
  useContextQuests,
  useContextSquads,
  useContextTickets,
  type RecipientOption,
  type DMWithDetails,
} from '@/hooks/useAdminDirectMessages';
import {
  Mail,
  Send,
  Search,
  User,
  MessageCircle,
  Clock,
  Check,
  ChevronRight,
  Loader2,
  Plus,
  LinkIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Enums } from '@/integrations/supabase/types';

type AdminMessageType = Enums<'admin_message_type'>;

const MESSAGE_TYPE_LABELS: Record<AdminMessageType, { label: string; color: string }> = {
  support: { label: 'Support', color: 'bg-blue-500/10 text-blue-500' },
  announcement: { label: 'Announcement', color: 'bg-purple-500/10 text-purple-500' },
  feedback_request: { label: 'Feedback Request', color: 'bg-amber-500/10 text-amber-500' },
  quest_related: { label: 'Quest Related', color: 'bg-green-500/10 text-green-500' },
};

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-muted text-muted-foreground',
  creator: 'bg-orange-500/10 text-orange-500',
  sponsor: 'bg-emerald-500/10 text-emerald-500',
  org_admin: 'bg-indigo-500/10 text-indigo-500',
};

export function AdminDirectMessages() {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Direct Messages
            </CardTitle>
            <CardDescription>
              Send messages to any user, creator, sponsor, or org admin
            </CardDescription>
          </div>
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Compose Message</DialogTitle>
                <DialogDescription>Send a direct message to any user</DialogDescription>
              </DialogHeader>
              <ComposeMessage onSent={() => setComposeOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
            {/* Message List */}
            <div className="lg:col-span-1 border rounded-lg">
              <MessageList
                selectedId={selectedMessageId}
                onSelect={setSelectedMessageId}
              />
            </div>

            {/* Message Detail */}
            <div className="lg:col-span-2 border rounded-lg">
              {selectedMessageId ? (
                <MessageDetail messageId={selectedMessageId} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a message to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MessageList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { data: messages = [], isLoading } = useAdminDirectMessages(
    typeFilter !== 'all' ? { messageType: typeFilter as AdminMessageType } : undefined
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="support">Support</SelectItem>
            <SelectItem value="announcement">Announcement</SelectItem>
            <SelectItem value="feedback_request">Feedback Request</SelectItem>
            <SelectItem value="quest_related">Quest Related</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        {messages.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((message) => (
              <button
                key={message.id}
                onClick={() => onSelect(message.id)}
                className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                  selectedId === message.id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {(message.recipient as any)?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {(message.recipient as any)?.display_name || 'Unknown User'}
                      </span>
                      {!message.read_at && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{message.subject}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${MESSAGE_TYPE_LABELS[message.message_type].color}`}
                      >
                        {MESSAGE_TYPE_LABELS[message.message_type].label}
                      </Badge>
                      {message.reply_count && message.reply_count > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {message.reply_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function MessageDetail({ messageId }: { messageId: string }) {
  const { data: message, isLoading } = useAdminDMDetail(messageId);
  const addReply = useAddDMReply();
  const [replyText, setReplyText] = useState('');

  if (isLoading || !message) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    await addReply.mutateAsync({ message_id: messageId, body: replyText });
    setReplyText('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg">{message.subject}</h3>
            <p className="text-sm text-muted-foreground">
              To: {(message.recipient as any)?.display_name || 'Unknown'} (
              {(message.recipient as any)?.email})
            </p>
          </div>
          <Badge
            variant="secondary"
            className={MESSAGE_TYPE_LABELS[message.message_type].color}
          >
            {MESSAGE_TYPE_LABELS[message.message_type].label}
          </Badge>
        </div>

        {/* Context Links */}
        <div className="flex flex-wrap gap-2 mt-2">
          {message.quest && (
            <Badge variant="outline" className="text-xs">
              <LinkIcon className="h-3 w-3 mr-1" />
              Quest: {(message.quest as any).title}
            </Badge>
          )}
          {message.squad && (
            <Badge variant="outline" className="text-xs">
              <LinkIcon className="h-3 w-3 mr-1" />
              Squad: {(message.squad as any).squad_name}
            </Badge>
          )}
          {message.ticket && (
            <Badge variant="outline" className="text-xs">
              <LinkIcon className="h-3 w-3 mr-1" />
              Ticket: {(message.ticket as any).description?.substring(0, 30)}...
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Sent {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {message.read_at && (
            <span className="flex items-center gap-1 text-green-600">
              <Check className="h-3 w-3" />
              Read {formatDistanceToNow(new Date(message.read_at), { addSuffix: true })}
            </span>
          )}
          {message.reply_allowed && (
            <Badge variant="secondary" className="text-xs">
              Replies allowed
            </Badge>
          )}
        </div>
      </div>

      {/* Thread */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Original Message */}
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {(message.admin as any)?.display_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {(message.admin as any)?.display_name || 'Admin'}
              </span>
              <Badge variant="secondary" className="text-xs">
                Admin
              </Badge>
            </div>
            <p className="text-sm whitespace-pre-wrap">{message.body}</p>
          </div>

          {/* Replies */}
          {message.replies?.map((reply) => (
            <div
              key={reply.id}
              className={`rounded-lg p-4 ${
                reply.sender_role === 'admin' ? 'bg-primary/5' : 'bg-muted'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {reply.sender_role === 'admin' ? 'A' : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {reply.sender_role === 'admin' ? 'Admin' : 'User'}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    reply.sender_role === 'admin' ? '' : 'bg-muted-foreground/10'
                  }`}
                >
                  {reply.sender_role}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Reply Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            className="min-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendReply();
              }
            }}
          />
          <Button
            onClick={handleSendReply}
            disabled={!replyText.trim() || addReply.isPending}
            className="self-end"
          >
            {addReply.isPending ? (
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

function ComposeMessage({ onSent }: { onSent: () => void }) {
  const recipientSearch = useRecipientSearch();
  const sendDM = useSendAdminDM();
  const { data: quests = [] } = useContextQuests();
  const { data: squads = [] } = useContextSquads();
  const { data: tickets = [] } = useContextTickets();

  const [selectedRecipient, setSelectedRecipient] = useState<RecipientOption | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [messageType, setMessageType] = useState<AdminMessageType>('support');
  const [replyAllowed, setReplyAllowed] = useState(true);
  const [contextType, setContextType] = useState<'none' | 'quest' | 'squad' | 'ticket'>('none');
  const [contextId, setContextId] = useState<string>('');

  const handleSend = async () => {
    if (!selectedRecipient || !subject.trim() || !body.trim()) return;

    await sendDM.mutateAsync({
      to_user_id: selectedRecipient.id,
      subject,
      body,
      message_type: messageType,
      reply_allowed: replyAllowed,
      context_quest_id: contextType === 'quest' ? contextId : null,
      context_squad_id: contextType === 'squad' ? contextId : null,
      context_ticket_id: contextType === 'ticket' ? contextId : null,
    });

    onSent();
  };

  return (
    <div className="space-y-4">
      {/* Recipient Search */}
      <div className="space-y-2">
        <Label>Recipient</Label>
        {selectedRecipient ? (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {selectedRecipient.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm">
                {selectedRecipient.display_name || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground">{selectedRecipient.email}</p>
            </div>
            <Badge variant="secondary" className={ROLE_COLORS[selectedRecipient.role_type]}>
              {selectedRecipient.role_label}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRecipient(null)}
            >
              Change
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={recipientSearch.search}
                  onChange={(e) => recipientSearch.setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={recipientSearch.roleFilter}
                onValueChange={recipientSearch.setRoleFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="creator">Creators</SelectItem>
                  <SelectItem value="sponsor">Sponsors</SelectItem>
                  <SelectItem value="org_admin">Org Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recipientSearch.search.length >= 2 && (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {recipientSearch.isLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : recipientSearch.recipients.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No users found
                  </div>
                ) : (
                  <div className="divide-y">
                    {recipientSearch.recipients.map((recipient) => (
                      <button
                        key={recipient.id}
                        onClick={() => setSelectedRecipient(recipient)}
                        className="w-full p-3 text-left hover:bg-muted/50 flex items-center gap-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {recipient.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {recipient.display_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {recipient.email}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${ROLE_COLORS[recipient.role_type]}`}
                        >
                          {recipient.role_label}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Message Type</Label>
          <Select value={messageType} onValueChange={(v) => setMessageType(v as AdminMessageType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="feedback_request">Feedback Request</SelectItem>
              <SelectItem value="quest_related">Quest Related</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Allow Replies</Label>
          <div className="flex items-center gap-2 h-10">
            <Switch checked={replyAllowed} onCheckedChange={setReplyAllowed} />
            <span className="text-sm text-muted-foreground">
              {replyAllowed ? 'User can reply' : 'No replies'}
            </span>
          </div>
        </div>
      </div>

      {/* Context Link */}
      <div className="space-y-2">
        <Label>Link to Context (Optional)</Label>
        <div className="grid grid-cols-2 gap-2">
          <Select value={contextType} onValueChange={(v) => {
            setContextType(v as any);
            setContextId('');
          }}>
            <SelectTrigger>
              <SelectValue placeholder="No context" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Context</SelectItem>
              <SelectItem value="quest">Quest</SelectItem>
              <SelectItem value="squad">Clique</SelectItem>
              <SelectItem value="ticket">Support Ticket</SelectItem>
            </SelectContent>
          </Select>

          {contextType !== 'none' && (
            <Select value={contextId} onValueChange={setContextId}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${contextType}...`} />
              </SelectTrigger>
              <SelectContent>
                {contextType === 'quest' &&
                  quests.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.title}
                    </SelectItem>
                  ))}
                {contextType === 'squad' &&
                  squads.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.squad_name} ({s.quest?.title})
                    </SelectItem>
                  ))}
                {contextType === 'ticket' &&
                  tickets.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.description?.substring(0, 40)}... ({t.user?.display_name})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label>Subject</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Message subject..."
        />
      </div>

      {/* Body */}
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          rows={6}
        />
      </div>

      {/* Send Button */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          onClick={handleSend}
          disabled={!selectedRecipient || !subject.trim() || !body.trim() || sendDM.isPending}
        >
          {sendDM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Send className="mr-2 h-4 w-4" />
          Send Message
        </Button>
      </div>
    </div>
  );
}
