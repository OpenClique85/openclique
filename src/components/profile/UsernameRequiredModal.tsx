/**
 * UsernameRequiredModal - Prompts returning users to set a unique username
 * Shown on login if user has a profile but no username set
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { UsernameInput } from './UsernameInput';
import { useUsernameAvailability } from '@/hooks/useUsernameAvailability';

interface UsernameRequiredModalProps {
  open: boolean;
  onComplete: () => void;
}

export function UsernameRequiredModal({ open, onComplete }: UsernameRequiredModalProps) {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { isChecking, result } = useUsernameAvailability(username);
  
  const canSubmit = username.length >= 3 && result?.available === true && !isChecking;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit || !user) return;
    
    setIsSubmitting(true);
    setError('');
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: username.toLowerCase() })
      .eq('id', user.id);
    
    setIsSubmitting(false);
    
    if (updateError) {
      if (updateError.code === '23505') {
        setError('This username is already taken. Please choose another.');
      } else {
        setError('Failed to save username. Please try again.');
      }
      return;
    }
    
    await refreshProfile();
    toast({
      title: (
        <span className="flex items-center gap-2">
          Username set! <Sparkles className="h-4 w-4 text-sunset" />
        </span>
      ) as unknown as string,
      description: `You can now be found as @${username}`,
    });
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Choose Your Username</DialogTitle>
          <DialogDescription>
            We've added usernames! Pick a unique handle so others can find and invite you to cliques.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <UsernameInput
            value={username}
            onChange={setUsername}
            required
          />
          
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Why usernames?</p>
            <ul className="space-y-1 text-xs">
              <li>• Others can search and find you by @{username || 'yourname'}</li>
              <li>• Invite friends directly to your cliques</li>
              <li>• Your email stays private</li>
            </ul>
          </div>
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
          <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set Username
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
