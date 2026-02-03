/**
 * AddContactButton - Button to send contact request to another user
 */

import { useContacts } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Clock, Loader2 } from 'lucide-react';

interface AddContactButtonProps {
  targetUserId: string;
  source?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function AddContactButton({ 
  targetUserId, 
  source = 'search',
  variant = 'outline',
  size = 'sm',
  className 
}: AddContactButtonProps) {
  const { getContactStatus, sendRequest, acceptRequest, pendingRequests } = useContacts();
  
  const status = getContactStatus(targetUserId);
  const pendingRequest = pendingRequests.find(r => r.requester_id === targetUserId);

  if (status === 'accepted') {
    return (
      <Button variant="ghost" size={size} disabled className={className}>
        <UserCheck className="h-4 w-4 mr-1" />
        Contact
      </Button>
    );
  }

  if (status === 'pending_sent') {
    return (
      <Button variant="ghost" size={size} disabled className={className}>
        <Clock className="h-4 w-4 mr-1" />
        Pending
      </Button>
    );
  }

  if (status === 'pending_received' && pendingRequest) {
    return (
      <Button 
        variant="default" 
        size={size} 
        className={className}
        onClick={() => acceptRequest.mutate(pendingRequest.request_id)}
        disabled={acceptRequest.isPending}
      >
        {acceptRequest.isPending ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <UserCheck className="h-4 w-4 mr-1" />
        )}
        Accept Request
      </Button>
    );
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={() => sendRequest.mutate({ contactId: targetUserId, source })}
      disabled={sendRequest.isPending}
    >
      {sendRequest.isPending ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4 mr-1" />
      )}
      Add Contact
    </Button>
  );
}
