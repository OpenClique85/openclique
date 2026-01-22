import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, Loader2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;

interface ShareQuestButtonProps {
  quest: Quest;
  variant?: 'default' | 'outline' | 'ghost';
}

export default function ShareQuestButton({ quest, variant = 'outline' }: ShareQuestButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  const generateReferralLink = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please sign in to share' });
      return;
    }

    setIsLoading(true);

    try {
      // Generate a unique referral code
      const referralCode = `${user.id.slice(0, 8)}-${quest.id.slice(0, 8)}`;
      
      // Check if referral already exists
      const { data: existing } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_user_id', user.id)
        .eq('quest_id', quest.id)
        .maybeSingle();

      if (!existing) {
        // Create new referral entry
        const { error } = await supabase.from('referrals').insert({
          referrer_user_id: user.id,
          quest_id: quest.id,
          referral_code: referralCode,
        });

        if (error) throw error;
      }

      const link = `${window.location.origin}/quests/${quest.slug}?ref=${existing?.referral_code || referralCode}`;
      setReferralLink(link);
    } catch (error: any) {
      console.error('Error generating referral link:', error);
      // Still generate a non-tracked link if referral creation fails
      setReferralLink(`${window.location.origin}/quests/${quest.slug}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: 'Link copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to copy link' });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !referralLink) {
      generateReferralLink();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant={variant}>
          <Share2 className="mr-2 h-4 w-4" />
          Share with a Friend
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-1">Share this quest</h4>
            <p className="text-sm text-muted-foreground">
              When your friend signs up using this link, you'll both be grouped together!
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex gap-2">
              <Input 
                value={referralLink} 
                readOnly 
                className="text-sm"
              />
              <Button 
                size="icon" 
                variant="outline"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              🎯 Bring friends and we'll try to group you in the same squad!
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
