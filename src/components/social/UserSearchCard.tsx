/**
 * UserSearchCard - Display a user in search results with action buttons
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PokeButton } from './PokeButton';
import { AddContactButton } from '@/components/contacts/AddContactButton';
import { UserPlus, Send, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserSearchCardProps {
  user: {
    id: string;
    display_name: string;
    username: string | null;
    city: string | null;
    friend_code: string | null;
  };
  onInviteToClique?: (userId: string) => void;
  onSendQuest?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  className?: string;
}

export function UserSearchCard({
  user,
  onInviteToClique,
  onSendQuest,
  onViewProfile,
  className,
}: UserSearchCardProps) {
  const initials = user.display_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  
  return (
    <Card 
      className={cn('hover:shadow-md transition-shadow cursor-pointer', className)}
      onClick={() => onViewProfile?.(user.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-display font-bold text-primary shrink-0">
            {initials}
          </div>
          
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {user.display_name}
              </h3>
              {user.username && (
                <span className="text-sm text-muted-foreground">
                  @{user.username}
                </span>
              )}
            </div>
            {user.city && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3" />
                {user.city}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
            {/* Add Contact Button */}
            <AddContactButton targetUserId={user.id} source="search" />
            
            {onInviteToClique && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onInviteToClique(user.id)}
                className="gap-1.5 hidden sm:flex"
              >
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            )}
            {onSendQuest && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendQuest(user.id)}
                className="gap-1.5 hidden sm:flex"
              >
                <Send className="h-4 w-4" />
                Quest
              </Button>
            )}
            <PokeButton targetUserId={user.id} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
