/**
 * FindPeopleSection - Integrated friend code + user search for Profile hub
 * Combines sharing your friend code with finding others
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Share2, Check, QrCode, Search, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserSearch, UserSearchResult } from '@/hooks/useUserSearch';
import { UserSearchCard } from '@/components/social/UserSearchCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FindPeopleSectionProps {
  friendCode?: string;
}

export function FindPeopleSection({ friendCode }: FindPeopleSectionProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  const { data: results = [], isLoading } = useUserSearch(query);
  
  // Format code with dash for display (XXXX-XXXX)
  const formattedCode = friendCode 
    ? `${friendCode.slice(0, 4)}-${friendCode.slice(4)}`
    : '----';
  
  const handleCopy = async () => {
    if (!friendCode) return;
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
    if (!friendCode) return;
    const shareText = `Add me on OpenClique! My friend code is: ${friendCode}`;
    const shareUrl = `${window.location.origin}/profile?code=${friendCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OpenClique Friend Code',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };
  
  const handleViewProfile = (userId: string) => {
    console.log('View profile:', userId);
  };
  
  const handleInviteToClique = (userId: string) => {
    console.log('Invite to clique:', userId);
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Connect with People
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Your Friend Code */}
        {friendCode && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <QrCode className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Your Friend Code</p>
                  <span className="font-mono text-lg font-bold tracking-wider text-foreground">
                    {formattedCode}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopy}
                  className="gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShare}
                  className="gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Find People Search */}
        <Collapsible open={searchOpen} onOpenChange={setSearchOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Find People
              </span>
              <span className="text-xs text-muted-foreground">
                {searchOpen ? 'Close' : 'Search by @username or friend code'}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search @username, name, or friend code..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-11"
                autoFocus={searchOpen}
              />
            </div>
            
            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : query.length < 2 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Enter at least 2 characters to search</p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No results found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {results.length} {results.length === 1 ? 'person' : 'people'} found
                  </p>
                  {results.map((result: UserSearchResult) => (
                    <UserSearchCard
                      key={result.id}
                      user={result}
                      onViewProfile={handleViewProfile}
                      onInviteToClique={handleInviteToClique}
                      className="bg-background"
                    />
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <p className="text-xs text-muted-foreground text-center">
          Share your code or search to find friends and invite them to cliques.
        </p>
      </CardContent>
    </Card>
  );
}
