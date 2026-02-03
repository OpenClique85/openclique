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
import { Share2, Copy, Check, Loader2, ExternalLink } from 'lucide-react';
import { getPublishedUrl } from '@/lib/config';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;

interface ShareQuestButtonProps {
  quest: Quest;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function ShareQuestButton({ quest, variant = 'outline', size = 'sm' }: ShareQuestButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Check if native share is available (mobile)
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const generateShareLink = async () => {
    setIsLoading(true);

    try {
      let refCode = '';
      
      // Only generate referral code if user is logged in
      if (user) {
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
          await supabase.from('referrals').insert({
            referrer_user_id: user.id,
            quest_id: quest.id,
            referral_code: referralCode,
          });
        }

        refCode = existing?.referral_code || referralCode;
      }

      // Use PUBLISHED_URL for consistent links across all environments
      const questPath = `/quests/${quest.slug || quest.id}`;
      const link = refCode 
        ? getPublishedUrl(`${questPath}?ref=${refCode}`)
        : getPublishedUrl(questPath);
      
      setShareLink(link);
    } catch (error: any) {
      console.error('Error generating share link:', error);
      // Still generate a non-tracked link if referral creation fails
      setShareLink(getPublishedUrl(`/quests/${quest.slug || quest.id}`));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({ title: 'Link copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to copy link' });
    }
  };

  const handleNativeShare = async () => {
    if (!shareLink) return;
    
    try {
      await navigator.share({
        title: quest.title,
        text: `Check out "${quest.title}" on OpenClique!`,
        url: shareLink,
      });
      toast({ title: 'Shared successfully!' });
      setIsOpen(false);
    } catch (error: any) {
      // User cancelled share - don't show error
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !shareLink) {
      generateShareLink();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-1">Share this quest</h4>
            <p className="text-sm text-muted-foreground">
              {user 
                ? "When your friend signs up using this link, you'll both be grouped together!"
                : "Share this quest with friends - they can sign up even without an account!"
              }
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input 
                  value={shareLink} 
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
              
              {canNativeShare && (
                <Button 
                  className="w-full" 
                  onClick={handleNativeShare}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Share with Friends
                </Button>
              )}
            </div>
          )}
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              🎯 {user 
                ? "Bring friends and we'll try to group you in the same squad!"
                : "Anyone with this link can view and join the quest!"
              }
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
