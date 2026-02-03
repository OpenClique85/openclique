/**
 * PokeButton - Send a poke interaction to a user
 */

import { Button } from '@/components/ui/button';
import { Hand, Loader2, Check } from 'lucide-react';
import { useSendInteraction, useSentInteractions } from '@/hooks/useUserInteractions';
import { cn } from '@/lib/utils';

interface PokeButtonProps {
  targetUserId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  className?: string;
}

export function PokeButton({ 
  targetUserId, 
  variant = 'outline', 
  size = 'sm',
  className 
}: PokeButtonProps) {
  const sendInteraction = useSendInteraction();
  const { data: sentInteractions = [] } = useSentInteractions(targetUserId);
  
  // Check if already poked today
  const alreadyPoked = sentInteractions.some(
    i => i.interaction_type === 'poke'
  );
  
  const handlePoke = () => {
    if (alreadyPoked) return;
    sendInteraction.mutate({
      toUserId: targetUserId,
      type: 'poke',
    });
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePoke}
      disabled={sendInteraction.isPending || alreadyPoked}
      className={cn('gap-1.5', className)}
    >
      {sendInteraction.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : alreadyPoked ? (
        <>
          <Check className="h-4 w-4" />
          Poked
        </>
      ) : (
        <>
          <Hand className="h-4 w-4" />
          {size !== 'icon' && 'Poke'}
        </>
      )}
    </Button>
  );
}
