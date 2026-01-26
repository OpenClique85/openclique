/**
 * LFCBrowser - Netflix-style browse interface for Looking For Clique listings
 * 
 * Can be scoped to: event, club, org, or global
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Users, 
  Crown, 
  Sparkles, 
  Filter,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface LFCBrowserProps {
  scope?: 'event' | 'club' | 'org' | 'global';
  scopeId?: string;
  showFilters?: boolean;
}

interface LFCListing {
  id: string;
  name: string;
  lfc_bio: string | null;
  lfc_looking_for: string[] | null;
  lfc_scope: string;
  member_count: number;
  max_size: number;
  theme_tags: string[] | null;
  commitment_style: string | null;
  leader: {
    display_name: string;
    avatar_url: string | null;
  };
}

export function LFCBrowser({ scope = 'global', scopeId, showFilters = true }: LFCBrowserProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch LFC listings
  const { data: listings, isLoading } = useQuery({
    queryKey: ['lfc-listings', scope, scopeId, selectedCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('squads')
        .select('id, name, lfc_bio, lfc_looking_for, lfc_scope, max_members, theme_tags, commitment_style')
        .eq('lfc_listing_enabled', true)
        .limit(50);

      if (error) {
        console.error('Error fetching LFC listings:', error);
        return [];
      }

      // Fetch members for each squad
      const squadIds = (data || []).map(s => s.id);
      const { data: membersData } = squadIds.length > 0
        ? await supabase
            .from('squad_members')
            .select('squad_id, user_id, role')
            .in('squad_id', squadIds)
        : { data: [] };

      // Get profile info for leaders
      const leaderIds = (membersData || []).filter(m => m.role === 'leader').map(m => m.user_id);
      const { data: profiles } = leaderIds.length > 0
        ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', leaderIds)
        : { data: [] };
      
      const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

      return (data || []).map((squad) => {
        const squadMembers = (membersData || []).filter(m => m.squad_id === squad.id);
        const leader = squadMembers.find(m => m.role === 'leader');
        const leaderProfile = leader ? profilesMap.get(leader.user_id) : null;
        
        return {
          id: squad.id,
          name: squad.name,
          lfc_bio: squad.lfc_bio,
          lfc_looking_for: squad.lfc_looking_for as string[] | null,
          lfc_scope: squad.lfc_scope || 'global',
          member_count: squadMembers.length,
          max_size: squad.max_members || 6,
          theme_tags: squad.theme_tags as string[] | null,
          commitment_style: squad.commitment_style,
          leader: {
            display_name: leaderProfile?.display_name || 'Unknown',
            avatar_url: leaderProfile?.avatar_url || null,
          },
        } as LFCListing;
      });
    },
  });

  // Group listings by category
  const groupedListings = {
    active: listings?.filter(l => l.member_count >= 2) || [],
    forming: listings?.filter(l => l.member_count === 1) || [],
    nearbyFull: listings?.filter(l => l.member_count >= l.max_size - 1) || [],
  };

  const filteredListings = listings?.filter(l =>
    !searchQuery ||
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.lfc_bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.theme_tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderCliqueCard = (clique: LFCListing) => (
    <Card 
      key={clique.id} 
      className="min-w-[280px] max-w-[320px] hover:border-primary/30 transition-colors"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={clique.leader.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {clique.leader.display_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm truncate">{clique.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              <Crown className="h-3 w-3 text-amber-500" />
              {clique.leader.display_name}
            </CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            {clique.member_count}/{clique.max_size}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {clique.lfc_bio && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {clique.lfc_bio}
          </p>
        )}
        {clique.theme_tags && clique.theme_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {clique.theme_tags.slice(0, 2).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full mt-2" asChild>
          <Link to={`/cliques/${clique.id}`}>View Clique</Link>
        </Button>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-72 shrink-0" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cliques..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cliques</SelectItem>
              <SelectItem value="forming">Just Forming</SelectItem>
              <SelectItem value="active">Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {listings?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">No cliques looking for members</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to list your clique!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Active Cliques Row */}
          {groupedListings.active.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Active Cliques
                </h3>
                <Button variant="ghost" size="sm" className="gap-1">
                  See all <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {groupedListings.active.map(renderCliqueCard)}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Forming Cliques Row */}
          {groupedListings.forming.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Just Getting Started
                </h3>
                <Button variant="ghost" size="sm" className="gap-1">
                  See all <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {groupedListings.forming.map(renderCliqueCard)}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* All Listings (filtered) */}
          {searchQuery && (
            <div className="space-y-3">
              <h3 className="font-display font-semibold">
                Search Results ({filteredListings?.length || 0})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings?.map(renderCliqueCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
