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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ProfileModalProps {
  open: boolean;
  onComplete: () => void;
}

const INTEREST_OPTIONS = [
  { id: 'culture', label: '🎨 Culture & Arts' },
  { id: 'wellness', label: '🏃 Wellness & Fitness' },
  { id: 'connector', label: '🤝 Social & Networking' },
];

export function ProfileModal({ open, onComplete }: ProfileModalProps) {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInterestToggle = (interestId: string) => {
    setInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }
    
    if (!consentGiven) {
      setError('Please agree to the terms to continue');
      return;
    }
    
    if (!user) return;
    
    setIsSubmitting(true);
    setError('');
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        display_name: displayName.trim(),
        preferences: { interest_tags: interests },
        consent_given_at: new Date().toISOString()
      });
    
    setIsSubmitting(false);
    
    if (insertError) {
      if (insertError.code === '23505') {
        // Profile already exists, try to update instead
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            display_name: displayName.trim(),
            preferences: { interest_tags: interests },
            consent_given_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) {
          setError('Failed to save profile. Please try again.');
          return;
        }
      } else {
        setError('Failed to save profile. Please try again.');
        return;
      }
    }
    
    await refreshProfile();
    toast({
      title: 'Profile created!',
      description: 'You\'re all set to join quests.'
    });
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Complete Your Profile</DialogTitle>
          <DialogDescription>
            Just a few quick details so your squad knows who you are. Takes 30 seconds!
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">What should we call you?</Label>
            <Input
              id="displayName"
              placeholder="Your name or nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">This is what your squadmates will see</p>
          </div>
          
          <div className="space-y-3">
            <Label>What interests you? (optional)</Label>
            <div className="space-y-2">
              {INTEREST_OPTIONS.map((interest) => (
                <div key={interest.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={interest.id}
                    checked={interests.includes(interest.id)}
                    onCheckedChange={() => handleInterestToggle(interest.id)}
                  />
                  <Label
                    htmlFor={interest.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {interest.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
            <Checkbox
              id="consent"
              checked={consentGiven}
              onCheckedChange={(checked) => setConsentGiven(checked === true)}
            />
            <Label htmlFor="consent" className="text-sm font-normal leading-relaxed cursor-pointer">
              I agree to OpenClique's{' '}
              <a href="/terms" target="_blank" className="text-primary hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </Label>
          </div>
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Let's Go!
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
