/**
 * FriendCodeCard - Display and share friend code
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Share2, Check, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FriendCodeCardProps {
  friendCode: string;
  className?: string;
}

export function FriendCodeCard({ friendCode, className }: FriendCodeCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Format code with dash for display (XXXX-XXXX)
  const formattedCode = friendCode 
    ? `${friendCode.slice(0, 4)}-${friendCode.slice(4)}`
    : '----';
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(friendCode);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Friend code copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Please copy manually',
      });
    }
  };
  
  const handleShare = async () => {
    const shareText = `Add me on OpenClique! My friend code is: ${friendCode}`;
    const shareUrl = `${window.location.origin}/users?code=${friendCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OpenClique Friend Code',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          handleCopy(); // Fallback to copy
        }
      }
    } else {
      handleCopy(); // Fallback for browsers without share API
    }
  };
  
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <QrCode className="h-5 w-5" />
            <span className="text-sm font-medium">Your Friend Code</span>
          </div>
          
          <div className="bg-muted rounded-lg py-4 px-6 inline-block">
            <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
              {formattedCode}
            </span>
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Share this code so friends can find you and invite you to cliques.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
