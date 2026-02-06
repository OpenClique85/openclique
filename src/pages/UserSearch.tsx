/**
 * UserSearch - Find people by username, name, or friend code
 */

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useAuth } from '@/hooks/useAuth';
import { UserSearchCard } from '@/components/social/UserSearchCard';
import { UserPublicProfileDrawer } from '@/components/social/UserPublicProfileDrawer';

export default function UserSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Get initial search from URL (e.g., ?code=XXXX or ?q=name)
  const initialQuery = searchParams.get('code') || searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const { data: results = [], isLoading } = useUserSearch(query);
  
  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setDrawerOpen(true);
  };
  
  const handleInviteToClique = (userId: string) => {
    // TODO: Implement invite to clique dialog
    console.log('Invite to clique:', userId);
  };
  
  const handleSendQuest = (userId: string) => {
    // TODO: Implement send quest dialog
    console.log('Send quest:', userId);
  };
  
  return (
    <div className="min-h-dvh flex flex-col bg-background pb-20 md:pb-0">
      <Navbar />
      
      <main className="flex-1 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Find People</h1>
              <p className="text-sm text-muted-foreground">
                Search by @username, name, or friend code
              </p>
            </div>
          </div>
          
          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by @username, name, or friend code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
          </div>
          
          {/* Results */}
          {!user ? (
            <Card className="border-dashed">
              <CardContent className="py-12 flex flex-col items-center text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Sign in to search</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-6">
                  Sign in to find people and connect with them.
                </p>
                <Link to="/auth">
                  <Button>Sign In</Button>
                </Link>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : query.length < 2 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 flex flex-col items-center text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Start typing to search</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Enter at least 2 characters to search for users by their username, display name, or friend code.
                </p>
              </CardContent>
            </Card>
          ) : results.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 flex flex-col items-center text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">No results found</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Try a different search term or check the spelling.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                {results.length} {results.length === 1 ? 'person' : 'people'} found
              </p>
              {results.map((result) => (
                <UserSearchCard
                  key={result.id}
                  user={result}
                  onViewProfile={handleViewProfile}
                  onInviteToClique={handleInviteToClique}
                  onSendQuest={handleSendQuest}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      {/* Profile Drawer */}
      <UserPublicProfileDrawer
        userId={selectedUserId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onInviteToClique={handleInviteToClique}
      />
    </div>
  );
}
