/**
 * ContactsTab - Profile tab showing user's contacts and LFG broadcasts
 */

import { useState } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useLFG } from '@/hooks/useLFG';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { FindPeopleSection } from '@/components/profile/FindPeopleSection';
import { 
  Users, 
  UserPlus, 
  Bell, 
  Megaphone, 
  Check, 
  X,
  AtSign,
  UserMinus,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { LFGBroadcastCard } from './LFGBroadcastCard';

interface ContactsTabProps {
  userId: string;
}

export function ContactsTab({ userId }: ContactsTabProps) {
  const { 
    contacts, 
    pendingRequests, 
    isLoading, 
    acceptRequest, 
    declineRequest,
    removeContact 
  } = useContacts();
  const { broadcasts, myBroadcasts } = useLFG();
  const [subTab, setSubTab] = useState('contacts');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests Banner */}
      {pendingRequests.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Pending Contact Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => (
              <div 
                key={request.request_id}
                className="flex items-center justify-between gap-3 p-3 bg-background rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {request.display_name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{request.display_name}</p>
                    {request.username && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <AtSign className="h-3 w-3" />
                        {request.username}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      via {request.source || 'search'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => acceptRequest.mutate(request.request_id)}
                    disabled={acceptRequest.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => declineRequest.mutate(request.request_id)}
                    disabled={declineRequest.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contacts" className="gap-2">
            <Users className="h-4 w-4" />
            Contacts ({contacts.length})
          </TabsTrigger>
          <TabsTrigger value="lfg" className="gap-2">
            <Megaphone className="h-4 w-4" />
            LFG Feed
          </TabsTrigger>
          <TabsTrigger value="my-lfg" className="gap-2">
            <Bell className="h-4 w-4" />
            My LFGs
          </TabsTrigger>
        </TabsList>

        {/* Contacts List */}
        <TabsContent value="contacts" className="mt-4">
          {contacts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">No contacts yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add people you've met through quests or find them by username
                </p>
                <Button asChild>
                  <Link to="/users">Find People</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {contacts.map((contact) => (
                <Card key={contact.contact_id} className="hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={contact.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {contact.display_name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{contact.nickname || contact.display_name}</p>
                          {contact.username && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <AtSign className="h-3 w-3" />
                              {contact.username}
                            </p>
                          )}
                          {contact.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{contact.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {contact.source || 'search'}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeContact.mutate(contact.contact_id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* LFG Feed */}
        <TabsContent value="lfg" className="mt-4">
          {broadcasts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">No LFG broadcasts</h3>
                <p className="text-sm text-muted-foreground">
                  When your contacts are looking for people to quest with, you'll see it here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {broadcasts.map((broadcast) => (
                <LFGBroadcastCard key={broadcast.id} broadcast={broadcast} showRespond />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My LFGs */}
        <TabsContent value="my-lfg" className="mt-4">
          {myBroadcasts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">No active LFG broadcasts</h3>
                <p className="text-sm text-muted-foreground">
                  When you're registered for a quest, you can broadcast to your contacts
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myBroadcasts.map((broadcast) => (
                <LFGBroadcastCard key={broadcast.id} broadcast={broadcast} showResponses />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
